import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { data } = body;

        if (!data || !Array.isArray(data)) {
            return NextResponse.json({ error: 'Data tidak valid' }, { status: 400 });
        }

        // Fetch all satuan to map names to IDs
        const { data: satuanList } = await supabase.from('satuan').select('id, nama');
        const satuanMap = new Map((satuanList as any[] || []).map(s => [s.nama.toLowerCase(), s.id]));

        // Format data for insertion
        const formattedData = data.map((item: any) => {
            const itemName = item.Nama || item.nama || item['Nama Barang'] || '';
            const unitName = (item.Satuan || item.satuan || '').toString().toLowerCase();
            
            return {
                kode: item.Kode || item.kode || null,
                nama: itemName,
                satuan_id: satuanMap.get(unitName) || null,
                stok_minimum: parseInt(item.Stok_Minimum || item.stok_minimum || item['Stok Minimum'] || '0') || 0,
                stok: parseInt(item.Stok || item.stok || '0') || 0,
                deskripsi: item.Deskripsi || item.deskripsi || item.Keterangan || null,
                status: true
            };
        }).filter(item => item.nama !== ''); // Filter out empty rows

        if (formattedData.length === 0) {
            return NextResponse.json({ error: 'Tidak ada data valid untuk diimport' }, { status: 400 });
        }

        const { error } = await supabase
            .from('barang')
            .insert(formattedData as any);

        if (error) {
            console.error('Error importing barang:', error);
            return NextResponse.json({ error: 'Gagal mengimport data barang' }, { status: 500 });
        }

        return NextResponse.json({ message: `${formattedData.length} data barang berhasil diimport` });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
