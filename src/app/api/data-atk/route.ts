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

        // Fetch all barang with their category and unit
        const { data: barangList, error: barangError } = await sb
            .from('barang')
            .select(`
                id,
                nama,
                kode,
                harga,
                deskripsi,
                jumlah,
                satuan
            `)
            .order('nama', { ascending: true });

        if (barangError) {
            console.error('Error fetching barang:', barangError);
            return NextResponse.json({ error: 'Gagal mengambil data summary ATK' }, { status: 500 });
        }

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
            return {
                id: item.id,
                kode: item.kode,
                nama: item.nama,
                harga: item.harga || 0,
                satuan: item.satuan || '-',
                masuk: incomingMap[item.id] || 0,
                keluar: outgoingMap[item.id] || 0,
                sisa: item.jumlah || 0,
                keterangan: item.deskripsi || '-'
            };
        });

        return NextResponse.json({ data: summary });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
