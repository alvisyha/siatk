import { NextResponse } from 'next/server';
import { supabase, sb } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { jumlah: new_jumlah, tanggal, pemasok, keterangan, harga } = body;

        // 1. Get the old transaction to know the difference
        const { data: oldTransaction, error: fetchError } = await sb
            .from('barang_masuk')
            .select('*')
            .eq('id', id)
            .single();

        if (fetchError || !oldTransaction) {
            return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
        }

        const old_jumlah = oldTransaction.jumlah;
        const barang_id = oldTransaction.barang_id;

        // 2. Update the transaction
        const { data, error: updateError } = await sb
            .from('barang_masuk')
            .update({
                jumlah: parseInt(new_jumlah),
                tanggal,
                pemasok: pemasok || null,
                keterangan: keterangan || null,
                harga: parseInt(harga) || 0
            })
            .eq('id', id)
            .select()
            .single();

        if (updateError) {
            return NextResponse.json({ error: 'Gagal memperbarui transaksi' }, { status: 500 });
        }

        // 3. Update stock in barang table
        // Difference = new - old
        const diff = parseInt(new_jumlah) - old_jumlah;

        // Get current stock in barang table
        const { data: barang } = await sb
            .from('barang')
            .select('stok')
            .eq('id', barang_id)
            .single();
        
        if (barang) {
            const current_total = barang.stok || 0;
            const updated_total = current_total + diff;

            // Update main stock
            await sb.from('barang').update({ stok: updated_total }).eq('id', barang_id);

            // Also update the snapshot stok in the transaction itself
            await sb.from('barang_masuk').update({ stok: updated_total }).eq('id', id);
        }

        return NextResponse.json({ message: 'Transaksi berhasil diperbarui', data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // 1. Get the transaction to know how much to subtract from stock
        const { data: transaction, error: fetchError } = await sb
            .from('barang_masuk')
            .select('*')
            .eq('id', id)
            .single();
        if (fetchError || !transaction) {
            return NextResponse.json({ error: 'Transaksi tidak ditemukan' }, { status: 404 });
        }

        const amountToDelete = transaction.jumlah;
        const barang_id = transaction.barang_id;

        // 2. Delete the transaction
        const { error: deleteError } = await sb
            .from('barang_masuk')
            .delete()
            .eq('id', id);

        if (deleteError) {
            return NextResponse.json({ error: 'Gagal menghapus transaksi' }, { status: 500 });
        }

        // 3. Subtract from stock in barang table
        const { data: barang } = await sb
            .from('barang')
            .select('stok')
            .eq('id', barang_id)
            .single();

        if (barang) {
            const current_total = barang.stok || 0;
            const updated_total = current_total - amountToDelete;

            await sb.from('barang').update({ stok: updated_total }).eq('id', barang_id);
        }

        return NextResponse.json({ message: 'Transaksi berhasil dihapus' });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
