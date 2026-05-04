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
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        
        // For safe range filtering (handles some timezone overlap)
        const firstDayDate = new Date(year, today.getMonth(), 1);
        firstDayDate.setDate(firstDayDate.getDate() - 1);
        const safeStartDateFilter = firstDayDate.toISOString().split('T')[0];

        if (user.role === 'admin') {
            // 1. Total Items (Master)
            const [allBarangRes, satuanRes] = await Promise.all([
                sb.from('barang').select('id, nama, kode, satuan_id'),
                sb.from('satuan').select('id, nama')
            ]);
            
            if (allBarangRes.error) console.error('Dashboard Stats Error (allBarang):', allBarangRes.error);

            const allBarang = (allBarangRes.data || []).map((b: any) => ({
                ...b,
                satuan: (satuanRes.data || []).find((s: any) => s.id === b.satuan_id) || null
            }));
            const totalBarang = (allBarangRes.data || []).length || 0;
    
            // 2. Incoming This Month
            const { data: incomingThisMonth, error: incomingError } = await sb
                .from('barang_masuk')
                .select('jumlah, kode_transaksi, tanggal, created_at')
                .gte('tanggal', safeStartDateFilter); 
            
            if (incomingError) console.error('Dashboard Stats Error (incoming):', incomingError);
            
            const filteredIncoming = (incomingThisMonth || []).filter((item: any) => {
                const isThisMonthCode = item.kode_transaksi?.startsWith(`BM-${year}${month}`);
                // Format to local date string (YYYY-MM-DD) in Jakarta timezone
                const itemDate = item.tanggal ? new Date(item.tanggal).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) : '';
                const itemCreated = item.created_at ? new Date(item.created_at).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) : '';
                return isThisMonthCode || itemDate.startsWith(`${year}-${month}`) || itemCreated.startsWith(`${year}-${month}`);
            });
            const totalMasukBulanIni = filteredIncoming.length;

            // 3. Outgoing This Month
            const { data: outgoingThisMonth, error: outgoingError } = await sb
                .from('barang_keluar')
                .select('jumlah, kode_transaksi, tanggal, created_at')
                .gte('tanggal', safeStartDateFilter);
            
            if (outgoingError) console.error('Dashboard Stats Error (outgoing):', outgoingError);
            
            const filteredOutgoing = (outgoingThisMonth || []).filter((item: any) => {
                const isThisMonthCode = item.kode_transaksi?.startsWith(`BK-${year}${month}`);
                const itemDate = item.tanggal ? new Date(item.tanggal).toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' }) : '';
                const itemCreated = item.created_at ? new Date(item.created_at).toISOString().split('T')[0] : '';
                return isThisMonthCode || itemDate.startsWith(`${year}-${month}`) || itemCreated.startsWith(`${year}-${month}`);
            });
            const totalKeluarBulanIni = filteredOutgoing.length;

            // 4. Low Stock Items (threshold <= stok_minimum)
            const allBarangWithStockRes = await sb.from('barang').select('id, nama, kode, satuan_id, stok, stok_minimum');
            if (allBarangWithStockRes.error) console.error('Dashboard Stats Error (lowStock):', allBarangWithStockRes.error);
            
            const allBarangWithStock = allBarangWithStockRes.data || [];
            const lowStockCount = (allBarangWithStock as any[])?.filter(b => b.stok <= (b.stok_minimum || 0)).length || 0;
            const lowStockItems = allBarangWithStock.filter((b: any) => b.stok <= (b.stok_minimum || 0)).map((b: any) => ({
                id: b.id,
                nama: b.nama,
                kode: b.kode,
                jumlah: b.stok || 0,
                satuan: (satuanRes.data || []).find((s: any) => s.id === b.satuan_id)?.nama || '-',
                stok_minimum: b.stok_minimum || 0
            })).sort((a: any, b: any) => a.jumlah - b.jumlah).slice(0, 10) || [];

            // 5. Total Pending Items (across all users)
            const { count: totalPendingItems } = await sb
                .from('pengajuan_items')
                .select('id', { count: 'exact', head: true })
                .eq('status', 'pending');

            // 6. Recent Activities
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
                    totalMasukBulanIni,
                    totalKeluarBulanIni,
                    lowStockCount: lowStockCount || 0,
                    totalPendingItems: totalPendingItems || 0
                },
                lowStockItems: lowStockItems || [],
                activities: recentActivities
            });
        } else {
            // For Regular Users: Show Pengajuan stats
            const sub_bagian_id = user.sub_bagian_id;
            const filterField = sub_bagian_id ? 'sub_bagian_id' : 'user_id';
            const filterValue = sub_bagian_id || user.id;

            // Count pengajuan (header) per status via items
            const { data: allItems } = await sb
                .from('pengajuan_items')
                .select('id, status, pengajuan:pengajuan_id(id, sub_bagian_id, user_id)')
                .not('pengajuan', 'is', null);

            // Filter items milik user/sub_bagian ini
            const myItems = (allItems || []).filter((item: any) => {
                const pg = item.pengajuan as any;
                if (!pg) return false;
                return filterField === 'sub_bagian_id'
                    ? pg.sub_bagian_id === filterValue
                    : pg.user_id === filterValue;
            });

            const totalRequest = myItems.length;
            const pendingCount = myItems.filter((i: any) => i.status === 'pending').length;
            const approvedCount = myItems.filter((i: any) => i.status === 'disetujui').length;
            const rejectedCount = myItems.filter((i: any) => i.status === 'ditolak').length;

            // Recent Pengajuan as activities
            const { data: recentPengajuan } = await sb
                .from('pengajuan')
                .select('id, created_at, pemohon, pengajuan_items(id, jumlah, status, barang:barang_id(nama, satuan_id))')
                .eq(filterField, filterValue)
                .order('created_at', { ascending: false })
                .limit(5);

            const { data: satuanL } = await sb.from('satuan').select('id, nama');

            const activities = (recentPengajuan || []).flatMap((pg: any) =>
                (pg.pengajuan_items || []).slice(0, 2).map((item: any) => {
                    const s = (satuanL || []).find((x: any) => x.id === item.barang?.satuan_id);
                    return {
                        id: item.id,
                        created_at: pg.created_at,
                        jumlah: item.jumlah,
                        barang: item.barang ? { ...item.barang, satuan: s } : null,
                        activityType: 'permintaan',
                        status: item.status
                    };
                })
            ).slice(0, 5);

            return NextResponse.json({
                stats: {
                    totalRequest,
                    pendingCount,
                    approvedCount,
                    rejectedCount
                },
                lowStockItems: [],
                activities
            });
        }
    } catch (error) {
        console.error(' Dashboard Stats Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
