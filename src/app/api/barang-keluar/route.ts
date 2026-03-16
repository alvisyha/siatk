import { NextResponse } from 'next/server';
import { supabase, sb } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: List all barang keluar
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await sb
            .from('barang_keluar')
            .select(`
                *,
                barang:barang_id (
                    id, 
                    nama, 
                    kode,
                    satuan
                )
            `)
            .order('tanggal', { ascending: false });

        if (error) {
            console.error('Error fetching barang keluar:', error);
            return NextResponse.json({ error: 'Gagal mengambil data barang keluar' }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// POST: Create new barang keluar
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Auth failed: User not identified' }, { status: 401 });
        }

        const body = await request.json();
        console.log('DEBUG: POST /api/barang-keluar body:', body);
        const { barang_id, jumlah, tanggal, penerima, keterangan } = body;

        if (!barang_id || !jumlah) {
            return NextResponse.json({ error: 'Barang dan jumlah harus diisi' }, { status: 400 });
        }

        // Generate Kode Transaksi: BK-YYYYMMDD-XXX
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;

        // Find the last sequence for today
        const { data: lastTransactions } = await (sb
            .from('barang_keluar' as any)
            .select('kode_transaksi')
            .like('kode_transaksi', `BK-${dateStr}-%`)
            .order('kode_transaksi', { ascending: false })
            .limit(1) as any);

        let sequence = 1;
        if (lastTransactions && lastTransactions.length > 0) {
            const lastCode = (lastTransactions[0] as any).kode_transaksi;
            if (lastCode) {
                const lastSeq = parseInt(lastCode.split('-')[2]);
                sequence = lastSeq + 1;
            }
        }
        const kode_transaksi = `BK-${dateStr}-${String(sequence).padStart(3, '0')}`;

        console.log('DEBUG: Received barang_id:', barang_id);

        // Get current stock
        const { data: currentBarang, error: fetchError } = await sb
            .from('barang')
            .select('jumlah')
            .eq('id', barang_id)
            .single();

        if (fetchError || !currentBarang) {
            console.error('DEBUG: Barang lookup failed:', fetchError?.message || 'Not found');
            return NextResponse.json({ 
                error: 'Barang tidak ditemukan', 
                details: fetchError?.message || 'Item tidak ada di database',
                sent_id: barang_id
            }, { status: 404 });
        }

        // @ts-ignore
        const current_jumlah = currentBarang.jumlah || 0;
        const new_stok = current_jumlah - parseInt(jumlah);

        if (new_stok < 0) {
            return NextResponse.json({ error: 'Stok tidak mencukupi' }, { status: 400 });
        }

        const { data, error } = await sb
            .from('barang_keluar')
            // @ts-ignore
            .insert({
                barang_id,
                jumlah: parseInt(jumlah),
                stok: new_stok,
                tanggal: tanggal || new Date().toISOString(),
                penerima,
                keterangan,
                kode_transaksi
            })
            .select(`
                *,
                barang:barang_id (
                    id, 
                    nama, 
                    kode,
                    satuan
                )
            `)
            .single();

        if (error) {
            console.error('SERVER ERROR (Barang Keluar):', error);
            return NextResponse.json({
                error: 'Gagal menambah data barang keluar',
                details: error.message
            }, { status: 500 });
        }

        // Update current stock in barang table
        // @ts-ignore
        await sb.from('barang').update({ jumlah: new_stok }).eq('id', barang_id);

        return NextResponse.json({ message: 'Data barang keluar berhasil ditambahkan', data }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
