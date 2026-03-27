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

        // Fetch all barang and satuan separately
        const [barangRes, satuanRes] = await Promise.all([
            sb.from('barang').select('*').order('nama', { ascending: true }),
            sb.from('satuan').select('id, nama')
        ]);

        if (barangRes.error) {
            console.error('Error fetching data-atk (barang):', barangRes.error);
            return NextResponse.json({ error: 'Gagal mengambil data ATK' }, { status: 500 });
        }

        if (satuanRes.error) {
            console.error('Error fetching data-atk (satuan):', satuanRes.error);
            return NextResponse.json({ error: 'Gagal mengambil data ATK' }, { status: 500 });
        }

        // Merge satuan data into barangList
        const barangList = (barangRes.data || []).map((item: any) => {
            const s = (satuanRes.data || []).find((x: any) => x.id === item.satuan_id);
            return {
                ...item,
                satuan: s ? { nama: s.nama } : null
            };
        });

        console.log(`DEBUG: Data ATK API - Fetched ${barangList.length} items from 'barang' table`);

        // Fetch total incoming and outgoing for each barang with units as fallback
        const [incomingRes, outgoingRes] = await Promise.all([
            sb.from('barang_masuk').select('barang_id, jumlah'),
            sb.from('barang_keluar').select('barang_id, jumlah')
        ]);

        const incomingMap: Record<string, number> = {};
        const outgoingMap: Record<string, number> = {};

        // @ts-ignore
        const incomingData = incomingRes.data as any[];
        // @ts-ignore
        const outgoingData = outgoingRes.data as any[];

        incomingData?.forEach(item => {
            incomingMap[item.barang_id] = (incomingMap[item.barang_id] || 0) + (item.jumlah || 0);
        });

        outgoingData?.forEach(item => {
            outgoingMap[item.barang_id] = (outgoingMap[item.barang_id] || 0) + (item.jumlah || 0);
        });

        console.log(`DEBUG: Data ATK API - Aggregated ${incomingData?.length || 0} incoming and ${outgoingData?.length || 0} outgoing records`);

        const summary = (barangList as any[]).map(item => {
            const masuk = Number(incomingMap[item.id] || 0);
            const keluar = Number(outgoingMap[item.id] || 0);
            return {
                id: item.id,
                kode: item.kode,
                nama: item.nama,
                satuan: item.satuan?.nama || '-',
                masuk,
                keluar,
                sisa: masuk - keluar,
                keterangan: item.deskripsi || '-'
            };
        });

        return NextResponse.json({ data: summary });
    } catch (error: any) {
        console.error('CRITICAL ERROR in data-atk GET:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server', details: error.message }, { status: 500 });
    }
}
