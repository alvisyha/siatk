import { NextResponse } from 'next/server';
import { supabase, sb } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch requests with joined data
        let query = sb
            .from('permintaan_barang')
            .select(`
                *,
                barang:barang_id (id, nama, kode, jumlah, satuan),
                sub_bagian:sub_bagian_id (id, nama),
                user_email:user_id
            `);

        // If not admin, filter by sub_bagian_id
        if (user.role !== 'admin') {
            if (user.sub_bagian_id) {
                query = query.eq('sub_bagian_id', user.sub_bagian_id);
            } else {
                // Fallback to their own requests if no sub_bagian is assigned to the user profile
                query = query.eq('user_id', user.id);
            }
        }

        const { data, error } = await query.order('created_at', { ascending: false });

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Error fetching requests:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { barang_id, jumlah, sub_bagian_id, tanggal, keterangan, pemohon } = body;

        // Use sub_bagian_id from user profile if available, otherwise use from request body
        let finalSubBagianId = sub_bagian_id;
        if (user.role !== 'admin' && user.sub_bagian_id) {
            finalSubBagianId = user.sub_bagian_id;
        }

        if (!barang_id || !jumlah || !finalSubBagianId) {
            return NextResponse.json({ error: 'Barang, jumlah, dan sub bagian harus diisi' }, { status: 400 });
        }

        const qty = parseInt(jumlah);

        // --- Stock Reservation (FIFO) Logic ---
        // 1. Get Physical Stock
        const { data: barang, error: bError } = await sb
            .from('barang')
            .select('jumlah, nama')
            .eq('id', barang_id)
            .single();
        
        if (bError || !barang) throw new Error('Barang tidak ditemukan');

        // 2. Get Sum of Pending Requests
        const { data: pendingReqs, error: pError } = await sb
            .from('permintaan_barang')
            .select('jumlah')
            .eq('barang_id', barang_id)
            .eq('status', 'pending');
        
        if (pError) throw pError;

        const totalPending = (pendingReqs as any[])?.reduce((acc, curr) => acc + (curr.jumlah || 0), 0) || 0;
        const availableStock = (barang.jumlah || 0) - totalPending;

        if (qty > availableStock) {
            return NextResponse.json({ 
                error: `Stok tidak mencukupi. Tersedia: ${availableStock} (Gudang: ${barang.jumlah}, Antrean: ${totalPending})` 
            }, { status: 400 });
        }
        // --- End Stock Reservation Logic ---

        const { data, error } = await sb
            .from('permintaan_barang')
            .insert([{
                user_id: user.id,
                barang_id,
                jumlah: qty,
                sub_bagian_id: finalSubBagianId,
                tanggal: tanggal || new Date().toISOString(),
                keterangan,
                pemohon: pemohon || null,
                status: 'pending'
            }])
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data, message: 'Permintaan berhasil diajukan dan stok telah dipesan' });
    } catch (error: any) {
        console.error('Error creating request:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function PUT(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { id, status } = body;

        if (!['pending', 'disetujui', 'ditolak'].includes(status)) {
            return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
        }

        // Fetch current request details
        const { data: reqData, error: reqError } = await sb
            .from('permintaan_barang')
            .select('barang_id, jumlah, status')
            .eq('id', id)
            .single();

        if (reqError || !reqData) {
            return NextResponse.json({ error: 'Permintaan tidak ditemukan' }, { status: 404 });
        }

        // Guard: Re-approve prevention or if already processed
        if (reqData.status !== 'pending' && status !== 'pending') {
            return NextResponse.json({ error: 'Permintaan sudah diproses sebelumnya' }, { status: 400 });
        }

        // If approving: Reduce Physical Stock
        if (status === 'disetujui' && reqData.status === 'pending') {
            // Get current stock
            const { data: barang } = await sb
                .from('barang')
                .select('jumlah, nama')
                .eq('id', reqData.barang_id)
                .single();

            if (!barang) throw new Error('Barang tidak ditemukan');
            
            const currentStock = barang.jumlah || 0;
            if (currentStock < reqData.jumlah) {
                return NextResponse.json({ error: `Gagal menyetujui: Stok fisik di gudang (${currentStock}) tidak mencukupi.` }, { status: 400 });
            }

            const newStock = currentStock - reqData.jumlah;
            const { error: updateError } = await sb
                .from('barang')
                .update({ jumlah: newStock })
                .eq('id', reqData.barang_id);
            
            if (updateError) throw updateError;
        }

        // If reverting from 'disetujui' to something else: Add Stock back
        if (status !== 'disetujui' && reqData.status === 'disetujui') {
            const { data: barang } = await sb
                .from('barang')
                .select('jumlah')
                .eq('id', reqData.barang_id)
                .single();

            if (barang) {
                const currentStock = barang.jumlah || 0;
                const newStock = currentStock + reqData.jumlah;
                await sb.from('barang').update({ jumlah: newStock }).eq('id', reqData.barang_id);
            }
        }

        const { data, error } = await sb
            .from('permintaan_barang')
            .update({ status })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data, message: `Status permintaan diperbarui menjadi ${status}` });
    } catch (error: any) {
        console.error('Error updating status:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
