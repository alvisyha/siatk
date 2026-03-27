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

        // Initialize query
        let query = sb.from('permintaan_barang').select('*');

        // If not admin, filter by sub_bagian_id
        if (user.role !== 'admin') {
            if (user.sub_bagian_id) {
                query = query.eq('sub_bagian_id', user.sub_bagian_id);
            } else {
                query = query.eq('user_id', user.id);
            }
        }

        const { data: pbData, error: pbError } = await query.order('created_at', { ascending: false });

        if (pbError) throw pbError;

        const [barangList, satuanList, subBagianList] = await Promise.all([
            sb.from('barang').select('id, nama, kode, stok, satuan_id'),
            sb.from('satuan').select('id, nama'),
            sb.from('sub_bagian').select('id, nama')
        ]);

        const data = (pbData || []).map((item: any) => {
            const b = (barangList.data || []).find((x: any) => x.id === item.barang_id);
            const s = (satuanList.data || []).find((x: any) => x.id === item.satuan_id);
            const sbeg = (subBagianList.data || []).find((x: any) => x.id === item.sub_bagian_id);

            return {
                ...item,
                jumlah: Number(item.jumlah) || 0,
                barang: b ? { 
                    ...b, 
                    stok: Number(b.stok) || 0,
                    satuan: (satuanList.data || []).find((x: any) => x.id === b.satuan_id) || null
                } : null,
                satuan: s || null,
                sub_bagian: sbeg || null,
                user_email: item.user_id 
            };
        });

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
            .select('stok, nama, satuan_id')
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
        const availableStock = (barang?.stok || 0) - totalPending;

        if (qty > availableStock) {
            return NextResponse.json({ 
                error: `Stok tidak mencukupi. Tersedia: ${availableStock} (Gudang: ${barang?.stok}, Antrean: ${totalPending})` 
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
                status: 'pending',
                satuan_id: barang?.satuan_id || null
            }])
            .select()
            .single();

        if (error) throw error;

        // Fetch related info for response
        const bInfo = await sb.from('barang').select('id, nama, kode, stok, satuan_id').eq('id', data.barang_id).single();
        const sInfo = await sb.from('satuan').select('id, nama').eq('id', data.satuan_id).single();

        const enrichedData = {
            ...data,
            barang: bInfo.data ? {
                ...bInfo.data,
                satuan: (await sb.from('satuan').select('id, nama').eq('id', bInfo.data.satuan_id).single()).data || null
            } : null,
            satuan: sInfo.data || null
        };

        return NextResponse.json({ data: enrichedData, message: 'Permintaan berhasil diajukan dan stok telah dipesan' });
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
                .select('stok, nama')
                .eq('id', reqData.barang_id)
                .single();

            if (!barang) throw new Error('Barang tidak ditemukan');
            
            const currentStock = barang.stok || 0;
            if (currentStock < reqData.jumlah) {
                return NextResponse.json({ error: `Gagal menyetujui: Stok fisik di gudang (${currentStock}) tidak mencukupi.` }, { status: 400 });
            }

            const newStock = currentStock - reqData.jumlah;
            const { error: updateError } = await sb
                .from('barang')
                .update({ stok: newStock })
                .eq('id', reqData.barang_id);
            
            if (updateError) throw updateError;
        }

        // If reverting from 'disetujui' to something else: Add Stock back
        if (status !== 'disetujui' && reqData.status === 'disetujui') {
            const { data: barang } = await sb
                .from('barang')
                .select('stok')
                .eq('id', reqData.barang_id)
                .single();

            if (barang) {
                const currentStock = barang.stok || 0;
                const newStock = currentStock + reqData.jumlah;
                await sb.from('barang').update({ stok: newStock }).eq('id', reqData.barang_id);
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
