import { NextResponse } from 'next/server';
import { supabase, sb } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: List all barang masuk
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await sb
            .from('barang_masuk')
            .select(`
                *,
                harga,
                barang:barang_id (
                    id, 
                    nama, 
                    kode,
                    satuan
                )
            `)
            .order('tanggal', { ascending: false });

        if (error) {
            console.error('Error fetching barang masuk:', error);
            return NextResponse.json({ error: 'Gagal mengambil data barang masuk' }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// POST: Create new barang masuk
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Auth failed: User not identified' }, { status: 401 });
        }

        const body = await request.json();
        console.log('DEBUG: POST /api/barang-masuk body:', body);
        const { barang_id, jumlah, tanggal, pemasok, keterangan, harga } = body;

        if (!barang_id || !jumlah) {
            return NextResponse.json({ error: 'Barang dan jumlah harus diisi' }, { status: 400 });
        }

        // Generate Kode Transaksi: BM-YYYYMMDD-XXX
        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const dateStr = `${year}${month}${day}`;

        // Find the last sequence for today
        const { data: lastTransactions } = await (sb
            .from('barang_masuk' as any)
            .select('kode_transaksi')
            .like('kode_transaksi', `BM-${dateStr}-%`)
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
        const kode_transaksi = `BM-${dateStr}-${String(sequence).padStart(3, '0')}`;

        console.log('DEBUG: Attempting to find barang with ID:', barang_id);

        // Get current stock
        const { data: currentBarang, error: fetchError } = await sb
            .from('barang')
            .select('jumlah')
            .eq('id', barang_id)
            .maybeSingle(); // Use maybeSingle to avoid 406/single error if not found

        if (fetchError) {
            console.error('DEBUG: Supabase error during lookup:', fetchError.message, fetchError.code);
            return NextResponse.json({ 
                error: 'Terjadi kesalahan saat mencari barang', 
                details: fetchError.message,
                code: fetchError.code
            }, { status: 500 });
        }

        if (!currentBarang) {
            console.error('DEBUG: No barang found for ID:', barang_id);
            return NextResponse.json({ 
                error: 'Barang tidak ditemukan', 
                details: `Item dengan ID ${barang_id} tidak ada di database.`,
                sent_id: barang_id
            }, { status: 404 });
        }

        const current_jumlah = (currentBarang as any)?.jumlah || 0;
        const new_stok = current_jumlah + parseInt(jumlah);

        const { data, error } = await supabase
            .from('barang_masuk')
            .insert({
                barang_id,
                jumlah: parseInt(jumlah),
                stok: new_stok,
                tanggal: tanggal || new Date().toISOString(),
                pemasok,
                keterangan,
                kode_transaksi,
                harga: parseInt(harga) || 0
            } as any) // Use as any to bypass lint while types settle
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
            console.error('SERVER ERROR (Barang Masuk):', error);
            return NextResponse.json({
                error: 'Gagal menambah data barang masuk',
                details: error.message
            }, { status: 500 });
        }

        // Update current stock in barang table
        // @ts-ignore
        await sb.from('barang').update({ jumlah: new_stok }).eq('id', barang_id);

        return NextResponse.json({ message: 'Data barang masuk berhasil ditambahkan', data }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
