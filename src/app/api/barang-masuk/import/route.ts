import { NextResponse } from 'next/server';
import { sb } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { data } = body;

        if (!data || !Array.isArray(data)) {
            return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
        }
        
        let successCount = 0;
        let errorCount = 0;

        // Process sequentially to handle stock updates properly
        for (const item of data) {
            try {
                // Find barang_id by name or code
                let barang_id = item.barang_id;
                
                if (!barang_id) {
                    const searchName = item.Barang || item.barang || item['Nama Barang'];
                    const searchCode = item.Kode || item.kode;
                    
                    if (!searchName && !searchCode) continue;

                    let query = sb.from('barang').select('id');
                    if (searchCode) {
                        query = query.eq('kode', searchCode);
                    } else if (searchName) {
                        query = query.ilike('nama', searchName);
                    }
                    
                    const { data: bData } = await query.limit(1).single();
                    if (!bData) {
                        errorCount++;
                        continue; // Skip if barang not found
                    }
                    barang_id = bData.id;
                }

                const jumlah = parseInt(item.Jumlah || item.jumlah || item.Qty || '0');
                if (jumlah <= 0) continue;

                // Generate Kode Transaksi
                const today = new Date();
                const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
                
                const { data: lastTx } = await (sb
                    .from('barang_masuk' as any)
                    .select('kode_transaksi')
                    .like('kode_transaksi', `BM-${dateStr}-%`)
                    .order('kode_transaksi', { ascending: false })
                    .limit(1) as any);

                let sequence = 1;
                if (lastTx && lastTx.length > 0 && (lastTx[0] as any).kode_transaksi) {
                    sequence = parseInt((lastTx[0] as any).kode_transaksi.split('-')[2]) + 1;
                }
                const kode_transaksi = `BM-${dateStr}-${String(sequence).padStart(3, '0')}`;

                // Calculate stock
                const [inRes, outRes] = await Promise.all([
                    sb.from('barang_masuk').select('jumlah').eq('barang_id', barang_id),
                    sb.from('barang_keluar').select('jumlah').eq('barang_id', barang_id)
                ]);

                const totalIn = (inRes.data as any[])?.reduce((acc, curr) => acc + (curr.jumlah || 0), 0) || 0;
                const totalOut = (outRes.data as any[])?.reduce((acc, curr) => acc + (curr.jumlah || 0), 0) || 0;
                const new_stok = (totalIn - totalOut) + jumlah;

                // Insert transaction
                const { error: insertErr } = await sb.from('barang_masuk').insert({
                    barang_id,
                    jumlah,
                    stok: new_stok,
                    harga: parseInt(item.Harga || item.harga || '0') || 0,
                    tanggal: item.Tanggal || item.tanggal || new Date().toISOString(),
                    pemasok: item.Pemasok || item.pemasok || item.Supplier || null,
                    keterangan: item.Keterangan || item.keterangan || null,
                    kode_transaksi
                });

                if (!insertErr) {
                    // Update stock in barang table
                    await sb.from('barang').update({ stok: new_stok }).eq('id', barang_id);
                    successCount++;
                } else {
                    errorCount++;
                }

            } catch (err) {
                console.error('Row process error:', err);
                errorCount++;
            }
        }

        return NextResponse.json({ 
            message: `Import selesai. ${successCount} berhasil, ${errorCount} gagal (barang tidak ditemukan / format salah).` 
        });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
