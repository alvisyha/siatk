import { NextResponse } from 'next/server';
import { supabase, sb } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Get single barang by ID
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { data: bData, error: bError } = await sb
            .from('barang')
            .select('*')
            .eq('id', id)
            .single();

        if (bError) {
            return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
        }

        const { data: sData } = await sb
            .from('satuan')
            .select('nama')
            .eq('id', bData.satuan_id)
            .single();

        const data = {
            ...bData,
            satuan: sData ? { nama: sData.nama } : null
        };

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// PUT: Update barang
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        if (body.stok_minimum !== undefined) {
            const parsedStokMin = parseInt(body.stok_minimum);
            if (isNaN(parsedStokMin) || parsedStokMin <= 0) {
                return NextResponse.json(
                    { error: 'Stok minimal harus berupa angka dan lebih dari 0' },
                    { status: 400 }
                );
            }
            body.stok_minimum = parsedStokMin;
        }

        if (body.nama !== undefined) {
            const { data: existingName } = await sb
                .from('barang')
                .select('id')
                .ilike('nama', body.nama.trim())
                .neq('id', id)
                .single();

            if (existingName) {
                return NextResponse.json(
                    { error: 'Nama barang sudah terdaftar, gunakan nama lain' },
                    { status: 400 }
                );
            }
        }

        const { data: bData, error: bError } = await sb
            .from('barang')
            // @ts-ignore
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (bError) {
            console.error('Error updating barang:', bError);
            return NextResponse.json({ error: 'Gagal mengupdate barang' }, { status: 500 });
        }

        const { data: sData } = await sb
            .from('satuan')
            .select('nama')
            .eq('id', bData.satuan_id)
            .single();

        const data = {
            ...bData,
            satuan: sData ? { nama: sData.nama } : null
        };

        return NextResponse.json({ message: 'Barang berhasil diupdate', data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// DELETE: Delete barang (soft-delete if used in transactions)
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Check if barang has been used in any transactions
        const [masukCheck, keluarCheck, permintaanCheck] = await Promise.all([
            supabase.from('barang_masuk').select('id', { count: 'exact', head: true }).eq('barang_id', id),
            supabase.from('barang_keluar').select('id', { count: 'exact', head: true }).eq('barang_id', id),
            supabase.from('permintaan_barang').select('id', { count: 'exact', head: true }).eq('barang_id', id)
        ]);

        const totalTransactions = (masukCheck.count || 0) + (keluarCheck.count || 0) + (permintaanCheck.count || 0);

        if (totalTransactions > 0) {
            // Soft delete: set status to nonaktif
            const { error } = await supabase
                .from('barang')
                // @ts-ignore
                .update({ status: false })
                .eq('id', id);

            if (error) {
                console.error('Error soft-deleting barang:', error);
                return NextResponse.json({ error: 'Gagal menonaktifkan barang' }, { status: 500 });
            }

            return NextResponse.json({ message: 'Barang dinonaktifkan karena sudah pernah digunakan dalam transaksi', softDeleted: true });
        }

        // Hard delete: no transactions exist
        const { error } = await supabase
            .from('barang')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting barang:', error);
            return NextResponse.json({ error: `Gagal menghapus barang: ${error.message}` }, { status: 500 });
        }

        return NextResponse.json({ message: 'Barang berhasil dihapus' });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
