import { NextResponse } from 'next/server';
import { sb } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET /api/barang/pending-stats
// Mengembalikan total jumlah yang sedang pending (terpesan) per barang_id
// Digunakan oleh form permintaan agar semua user bisa melihat stok yang sudah di-reserve
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        // Ambil semua pengajuan_items yang masih pending (lintas semua user)
        const { data, error } = await sb
            .from('pengajuan_items')
            .select('barang_id, jumlah')
            .eq('status', 'pending');

        if (error) throw error;

        // Agregasi: total pending per barang_id
        const pendingMap: Record<string, number> = {};
        for (const item of data || []) {
            if (!item.barang_id) continue;
            pendingMap[item.barang_id] = (pendingMap[item.barang_id] || 0) + (item.jumlah || 0);
        }

        return NextResponse.json({ data: pendingMap });
    } catch (error: any) {
        console.error('GET /api/barang/pending-stats error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
