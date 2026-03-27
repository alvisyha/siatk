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

        const { data: bmData, error: bmError } = await sb
            .from('barang_masuk')
            .select('*')
            .order('tanggal', { ascending: false });

        if (bmError) {
            console.error('Error fetching barang masuk:', bmError);
            return NextResponse.json({ error: 'Gagal mengambil data barang masuk' }, { status: 500 });
        }

        const [barangList, satuanList] = await Promise.all([
            sb.from('barang').select('id, nama, kode, satuan_id'),
            sb.from('satuan').select('id, nama')
        ]);

        const data = (bmData || []).map((item: any) => {
            const b = (barangList.data || []).find((x: any) => x.id === item.barang_id);
            const s = (satuanList.data || []).find((x: any) => x.id === item.satuan_id);
            return {
                ...item,
                jumlah: Number(item.jumlah) || 0,
                harga: Number(item.harga) || 0,
                stok: Number(item.stok) || 0,
                barang: b ? { 
                    ...b, 
                    satuan: (satuanList.data || []).find((x: any) => x.id === b.satuan_id) || null
                } : null,
                satuan: s || null
            };
        });

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('CRITICAL ERROR in barang-masuk GET:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server', details: error.message }, { status: 500 });
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

        // Get current stock and unit info from barang table
        const { data: currentBarang, error: barangError } = await sb
            .from('barang')
            .select('stok, satuan_id')
            .eq('id', barang_id)
            .single();

        if (barangError) {
            console.error('SERVER ERROR (Get Barang Info):', barangError);
            return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
        }

        const current_stok = currentBarang?.stok || 0;
        const new_stok = current_stok + parseInt(jumlah);

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
                harga: parseInt(harga) || 0,
                satuan_id: currentBarang?.satuan_id || null
            } as any)
            .select()
            .single();

        if (error) {
            console.error('SERVER ERROR (Barang Masuk):', error);
            return NextResponse.json({
                error: 'Gagal menambah data barang masuk',
                details: error.message
            }, { status: 500 });
        }

        const resData = data as any;

        // Fetch related info for response
        const [bInfo, sInfo] = await Promise.all([
            sb.from('barang').select('id, nama, kode, satuan_id').eq('id', resData.barang_id).single(),
            sb.from('satuan').select('id, nama').eq('id', resData.satuan_id).single()
        ]);

        const enrichedData = {
            ...resData,
            jumlah: Number(resData.jumlah) || 0,
            harga: Number(resData.total_harga || resData.harga) || 0,
            barang: bInfo.data ? {
                ...bInfo.data,
                satuan: (await sb.from('satuan').select('id, nama').eq('id', bInfo.data.satuan_id).single()).data || null
            } : null,
            satuan: sInfo.data || null
        };

        // Update current stock in barang table
        await sb.from('barang').update({ stok: new_stok }).eq('id', barang_id);

        return NextResponse.json({ message: 'Data barang masuk berhasil ditambahkan', data: enrichedData }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
