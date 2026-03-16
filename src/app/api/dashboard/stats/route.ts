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

        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const todayISO = today.toISOString();

        if (user.role === 'admin') {
            // 1. Total Items (Master)
            const { count: totalBarang } = await sb
                .from('barang')
                .select('*', { count: 'exact', head: true });
    
            // 2. Incoming Today
            const { data: incomingToday } = await sb
                .from('barang_masuk')
                .select('jumlah')
                .gte('tanggal', todayISO);
            const totalMasukHariIni = (incomingToday as any[])?.reduce((acc, curr) => acc + (curr.jumlah || 0), 0) || 0;

            // 3. Outgoing Today
            const { data: outgoingToday } = await sb
                .from('barang_keluar')
                .select('jumlah')
                .gte('tanggal', todayISO);
            const totalKeluarHariIni = (outgoingToday as any[])?.reduce((acc, curr) => acc + (curr.jumlah || 0), 0) || 0;

            // 4. Low Stock Items (threshold <= 5)
            const { data: lowStockItems, count: lowStockCount } = await sb
                .from('barang')
                .select('id, nama, kode, jumlah, satuan:satuan_id(nama)')
                .lte('jumlah', 5)
                .limit(5);
    
            // 5. Recent Activities
            const [recentMasuk, recentKeluar] = await Promise.all([
                sb.from('barang_masuk')
                    .select('id, created_at, jumlah, barang:barang_id(nama), type:kode_transaksi, satuan:satuan_id(nama)')
                    .order('created_at', { ascending: false })
                    .limit(5),
                sb.from('barang_keluar')
                    .select('id, created_at, jumlah, barang:barang_id(nama), type:kode_transaksi, satuan:satuan_id(nama)')
                    .order('created_at', { ascending: false })
                    .limit(5)
            ]);
    
            const activities = [
                ...((recentMasuk.data as any[]) || []).map(item => ({ ...item, activityType: 'masuk' })),
                ...((recentKeluar.data as any[]) || []).map(item => ({ ...item, activityType: 'keluar' }))
            ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
            .slice(0, 5);

            return NextResponse.json({
                stats: {
                    totalBarang: totalBarang || 0,
                    masukHariIni: totalMasukHariIni,
                    keluarHariIni: totalKeluarHariIni,
                    lowStockCount: lowStockCount || 0
                },
                lowStockItems: lowStockItems || [],
                activities
            });
        } else {
            // For Regular Users: Show Permintaan stats
            const sub_bagian_id = (user as any).sub_bagian_id;
            
            let query = sb.from('permintaan_barang').select('*', { count: 'exact' });
            
            // Filter by sub_bagian_id if exists, otherwise by user_id
            if (sub_bagian_id) {
                query = query.eq('sub_bagian_id', sub_bagian_id);
            } else {
                query = query.eq('user_id', user.id);
            }

            const [
                { count: totalRequest },
                { count: pendingCount },
                { count: approvedCount },
                { count: rejectedCount }
            ] = await Promise.all([
                query,
                sb.from('permintaan_barang').select('*', { count: 'exact', head: true })
                    .eq(sub_bagian_id ? 'sub_bagian_id' : 'user_id', sub_bagian_id || user.id)
                    .eq('status', 'pending'),
                sb.from('permintaan_barang').select('*', { count: 'exact', head: true })
                    .eq(sub_bagian_id ? 'sub_bagian_id' : 'user_id', sub_bagian_id || user.id)
                    .eq('status', 'disetujui'),
                sb.from('permintaan_barang').select('*', { count: 'exact', head: true })
                    .eq(sub_bagian_id ? 'sub_bagian_id' : 'user_id', sub_bagian_id || user.id)
                    .eq('status', 'ditolak')
            ]);

            // Recent Requests as activities
            const { data: recentRequests } = await sb
                .from('permintaan_barang')
                .select('id, created_at, jumlah, barang:barang_id(nama), status')
                .eq(sub_bagian_id ? 'sub_bagian_id' : 'user_id', sub_bagian_id || user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            const activities = (recentRequests as any[])?.map(item => ({
                id: item.id,
                created_at: item.created_at,
                jumlah: item.jumlah,
                barang: item.barang,
                activityType: 'permintaan',
                status: item.status
            })) || [];

            return NextResponse.json({
                stats: {
                    totalRequest: totalRequest || 0,
                    pendingCount: pendingCount || 0,
                    approvedCount: approvedCount || 0,
                    rejectedCount: rejectedCount || 0
                },
                lowStockItems: [], // No low stock for users
                activities
            });
        }
    } catch (error) {
        console.error(' Dashboard Stats Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
