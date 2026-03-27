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
        // Use local date string for 'tanggal' columns (YYYY-MM-DD)
        const todayDateOnly = today.toISOString().split('T')[0];
        // Use ISO string for 'created_at' columns
        const todayStartISO = today.toISOString();

        if (user.role === 'admin') {
            // 1. Total Items (Master)
            const [allBarangRes, satuanRes] = await Promise.all([
                sb.from('barang').select('id, nama, kode, satuan_id'),
                sb.from('satuan').select('id, nama')
            ]);
            const allBarang = (allBarangRes.data || []).map((b: any) => ({
                ...b,
                satuan: (satuanRes.data || []).find((s: any) => s.id === b.satuan_id) || null
            }));
            const totalBarang = (allBarang as any[])?.length || 0;
    
            // 2. Incoming Today
            const { data: incomingToday } = await sb
                .from('barang_masuk')
                .select('jumlah')
                .gte('tanggal', todayDateOnly);
            const totalMasukHariIni = (incomingToday as any[])?.reduce((acc, curr) => acc + (curr.jumlah || 0), 0) || 0;

            // 3. Outgoing Today
            const { data: outgoingToday } = await sb
                .from('barang_keluar')
                .select('jumlah')
                .gte('tanggal', todayDateOnly);
            const totalKeluarHariIni = (outgoingToday as any[])?.reduce((acc, curr) => acc + (curr.jumlah || 0), 0) || 0;

            // 4. Low Stock Items (threshold <= stok_minimum)
            const allBarangWithStock = (await sb.from('barang').select('id, nama, kode, satuan_id, stok, stok_minimum')).data || [];
            const lowStockItems = allBarangWithStock.filter((b: any) => b.stok <= (b.stok_minimum || 0)).map((b: any) => ({
                id: b.id,
                nama: b.nama,
                kode: b.kode,
                jumlah: b.stok || 0,
                satuan: (satuanRes.data || []).find((s: any) => s.id === b.satuan_id)?.nama || '-',
                stok_minimum: b.stok_minimum || 0
            })).sort((a: any, b: any) => a.jumlah - b.jumlah).slice(0, 5) || [];

            const lowStockCount = (allBarangWithStock as any[])?.filter(b => b.stok <= (b.stok_minimum || 0)).length || 0;
    
            // 5. Recent Activities
            const [recentMasuk, recentKeluar] = await Promise.all([
                sb.from('barang_masuk')
                    .select('id, created_at, jumlah, barang_id, type:kode_transaksi')
                    .order('created_at', { ascending: false })
                    .limit(5),
                sb.from('barang_keluar')
                    .select('id, created_at, jumlah, barang_id, type:kode_transaksi')
                    .order('created_at', { ascending: false })
                    .limit(5)
            ]);
    
            const recentActivities = [
                ...((recentMasuk.data || []).map((m: any) => {
                    const b = (allBarang || []).find((x: any) => x.id === m.barang_id);
                    return { 
                        id: m.id, 
                        created_at: m.created_at, 
                        jumlah: m.jumlah, 
                        barang: b, 
                        satuan: b?.satuan?.nama || '-',
                        activityType: 'masuk' 
                    };
                })),
                ...((recentKeluar.data || []).map((k: any) => {
                    const b = (allBarang || []).find((x: any) => x.id === k.barang_id);
                    return { 
                        id: k.id, 
                        created_at: k.created_at, 
                        jumlah: k.jumlah, 
                        barang: b, 
                        satuan: b?.satuan?.nama || '-',
                        activityType: 'keluar' 
                    };
                }))
            ].sort((a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 5);

            return NextResponse.json({
                stats: {
                    totalBarang,
                    totalMasukHariIni,
                    totalKeluarHariIni,
                    lowStockCount: lowStockCount || 0
                },
                lowStockItems: lowStockItems || [],
                activities: recentActivities
            });
        } else {
            // For Regular Users: Show Permintaan stats
            const sub_bagian_id = user.sub_bagian_id;
            
            // Initialize query for counts
            let query = sb.from('permintaan_barang').select('*', { count: 'exact', head: true });
            
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
                .select('id, created_at, jumlah, barang_id, status')
                .eq(sub_bagian_id ? 'sub_bagian_id' : 'user_id', sub_bagian_id || user.id)
                .order('created_at', { ascending: false })
                .limit(5);

            const [barangL, satuanL] = await Promise.all([
                sb.from('barang').select('id, nama, satuan_id'),
                sb.from('satuan').select('id, nama')
            ]);

            const activities = (recentRequests || []).map((r: any) => {
                const b = (barangL.data || []).find((x: any) => x.id === r.barang_id);
                const s = b ? (satuanL.data || []).find((x: any) => x.id === b.satuan_id) : null;
                return {
                    id: r.id,
                    created_at: r.created_at,
                    jumlah: r.jumlah,
                    barang: b ? { ...b, satuan: s } : null,
                    activityType: 'permintaan',
                    status: r.status
                };
            });

            return NextResponse.json({
                stats: {
                    totalRequest: totalRequest || 0,
                    pendingCount: pendingCount || 0,
                    approvedCount: approvedCount || 0,
                    rejectedCount: rejectedCount || 0
                },
                lowStockItems: [], // No low stock items for regular users
                activities
            });
        }
    } catch (error) {
        console.error(' Dashboard Stats Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
