'use client';

import { useState, useEffect } from 'react';
import {
    Clock,
    CheckCircle2,
    AlertCircle,
    Package,
    ArrowDownLeft,
    ArrowUpRight,
    Loader2,
    AlertTriangle,
    History,
    PlusCircle
} from 'lucide-react';
import Link from 'next/link';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string;
}

interface Activity {
    id: string;
    created_at: string;
    jumlah: number;
    activityType: 'masuk' | 'keluar';
    barang: { nama: string };
    satuan?: string;
}

interface LowStockItem {
    id: string;
    nama: string;
    kode: string | null;
    jumlah: number;
    satuan?: string;
    stok_minimum: number;
}

interface DashboardStats {
    totalBarang: number;
    totalMasukHariIni: number;
    totalKeluarHariIni: number;
    lowStockCount: number;
}

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [mounted, setMounted] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [stats, setStats] = useState<DashboardStats | null>(null);
    const [activities, setActivities] = useState<Activity[]>([]);
    const [lowStockItems, setLowStockItems] = useState<LowStockItem[]>([]);

    useEffect(() => {
        setMounted(true);
        fetchUser();
        fetchDashboardData();
        const timer = setInterval(() => setCurrentTime(new Date()), 1000);
        return () => clearInterval(timer);
    }, []);

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    };

    const fetchDashboardData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/dashboard/stats', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setStats(data.stats);
                setActivities(data.activities);
                setLowStockItems(data.lowStockItems);
            }
        } catch (error) {
            console.error('Failed to fetch dashboard data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const formatTime = (isoString: string) => {
        const date = new Date(isoString);
        return date.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' });
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
                <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-4" />
                <p className="font-medium">Memuat dashboard Anda...</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 animate-in fade-in duration-500">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        Selamat Datang, <span className="text-blue-600">{user?.name || 'User'}</span>! 👋
                    </h1>
                    <p className="text-gray-500 mt-1">
                        {user?.role === 'admin' 
                            ? 'Berikut adalah ringkasan inventaris ATK Anda hari ini.' 
                            : 'Pantau status pengajuan barang Anda di sini.'}
                    </p>
                    {user?.role === 'user' && (
                        <div className="mt-4">
                            <Link href="/dashboard/permintaan-barang">
                                <button className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 font-medium text-sm">
                                    <PlusCircle className="w-4 h-4" />
                                    Buat Permintaan Baru
                                </button>
                            </Link>
                        </div>
                    )}
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 font-medium min-w-[80px] text-center">
                        {mounted ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 text-gray-900">
                {user?.role === 'admin' ? (
                    <>
                        {/* Total Master Barang */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-lg bg-blue-50">
                                    <Package className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Jenis Barang</h3>
                            <p className="text-2xl font-bold">{stats?.totalBarang || 0}</p>
                        </div>

                        {/* Masuk Hari Ini */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                                    <ArrowDownLeft className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium mb-1">Transaksi Masuk</h3>
                            <p className="text-2xl font-bold">{stats?.totalMasukHariIni || 0}</p>
                        </div>

                        {/* Keluar Hari Ini */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-lg bg-orange-50 text-orange-600">
                                    <ArrowUpRight className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium mb-1">Transaksi Keluar</h3>
                            <p className="text-2xl font-bold">{stats?.totalKeluarHariIni || 0}</p>
                        </div>

                        {/* Stok Rendah */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-lg bg-red-50 text-red-600">
                                    <AlertTriangle className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium mb-1">Stok Menipis</h3>
                            <p className="text-2xl font-bold">{stats?.lowStockCount || 0}</p>
                        </div>
                    </>
                ) : (
                    <>
                        {/* Total Pengajuan */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-lg bg-blue-50">
                                    <History className="w-6 h-6 text-blue-600" />
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium mb-1">Total Pengajuan</h3>
                            <p className="text-2xl font-bold">{(stats as any)?.totalRequest || 0}</p>
                        </div>

                        {/* Menunggu */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-lg bg-yellow-50 text-yellow-600">
                                    <Clock className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium mb-1">Menunggu</h3>
                            <p className="text-2xl font-bold">{(stats as any)?.pendingCount || 0}</p>
                        </div>

                        {/* Disetujui */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-lg bg-emerald-50 text-emerald-600">
                                    <CheckCircle2 className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium mb-1">Disetujui</h3>
                            <p className="text-2xl font-bold">{(stats as any)?.approvedCount || 0}</p>
                        </div>

                        {/* Ditolak */}
                        <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all">
                            <div className="flex items-center justify-between mb-4">
                                <div className="p-3 rounded-lg bg-red-50 text-red-600">
                                    <AlertCircle className="w-6 h-6" />
                                </div>
                            </div>
                            <h3 className="text-gray-500 text-sm font-medium mb-1">Ditolak</h3>
                            <p className="text-2xl font-bold">{(stats as any)?.rejectedCount || 0}</p>
                        </div>
                    </>
                )}
            </div>

            {/* Main Content Grid */}
            <div className={`grid grid-cols-1 ${user?.role === 'admin' ? 'lg:grid-cols-3' : 'lg:grid-cols-1'} gap-6 text-gray-900`}>
                {/* Recent Activity */}
                <div className={`${user?.role === 'admin' ? 'lg:col-span-2' : ''} bg-white rounded-xl border border-gray-100 shadow-sm p-4 md:p-5 flex flex-col`}>
                    <div className="flex items-center justify-between mb-4 border-b border-gray-50 pb-3">
                        <h2 className="text-base font-bold text-gray-900 flex items-center gap-2">
                            <History className="w-4 h-4 text-gray-400" />
                            {user?.role === 'admin' ? 'Aktivitas Terbaru' : 'Status Pengajuan Terbaru'}
                        </h2>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 space-y-2 max-h-[320px]">
                        {activities.length === 0 ? (
                            <div className="py-10 text-center text-gray-500 italic">
                                Belum ada aktivitas terbaru hari ini.
                            </div>
                        ) : (
                            activities.map((activity) => (
                                <div
                                    key={activity.id}
                                    className="flex items-center gap-4 p-3.5 rounded-xl bg-gray-50/50 border border-gray-100 hover:bg-white hover:shadow-sm hover:border-blue-100 transition-all duration-300 group"
                                >
                                    <div className="mt-0.5">
                                        {activity.activityType === 'masuk' ? (
                                            <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center">
                                                <ArrowDownLeft className="w-4 h-4 text-emerald-600" />
                                            </div>
                                        ) : activity.activityType === 'keluar' ? (
                                            <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center">
                                                <ArrowUpRight className="w-4 h-4 text-orange-600" />
                                            </div>
                                        ) : (
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center 
                                                ${(activity as any).status === 'disetujui' ? 'bg-emerald-100 text-emerald-600' : 
                                                  (activity as any).status === 'ditolak' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                                <History className="w-4 h-4" />
                                            </div>
                                        )}
                                    </div>
                                    <div className="flex-1">
                                        <p className="text-sm text-gray-900">
                                            <span className="font-semibold">{activity.barang.nama}</span>
                                            <span className="text-gray-500 ml-1">
                                                {activity.activityType === 'masuk' ? 'telah masuk sebanyak' : 
                                                 activity.activityType === 'keluar' ? 'telah keluar sebanyak' : 
                                                 `sebanyak ${activity.jumlah} unit sedang ${(activity as any).status}`}
                                            </span>
                                            {(activity.activityType as any) !== 'permintaan' && (
                                                <span className={`ml-1 font-bold ${activity.activityType === 'masuk' ? 'text-emerald-600' : 'text-orange-600'}`}>
                                                    {activity.jumlah} {activity.satuan || 'unit'}
                                                </span>
                                            )}
                                        </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-[11px] text-gray-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" />
                                            {formatTime(activity.created_at)}
                                        </p>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Low Stock Alerts (Only for Admin) */}
                {user?.role === 'admin' && (
                    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                                <AlertTriangle className="w-5 h-5 text-red-500" />
                                Peringatan Stok Rendah
                            </h2>
                            {lowStockItems.length > 0 && (
                                <Link 
                                    href="/dashboard/barang" 
                                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-all"
                                >
                                    Lihat Semua
                                </Link>
                            )}
                        </div>

                        <div className="space-y-4">
                            {lowStockItems.length === 0 ? (
                                <div className="py-6 text-center text-gray-500 text-sm italic">
                                    Semua stok dalam kondisi aman.
                                </div>
                            ) : (
                                lowStockItems.slice(0, 3).map((item) => (
                                    <div key={item.id} className="p-3 bg-red-50/50 border border-red-100 rounded-lg group hover:bg-red-50 transition-all duration-300">
                                        <div className="flex items-start justify-between">
                                            <div className="flex-1 mr-2">
                                                <h4 className="text-sm font-semibold text-gray-900 truncate">{item.nama}</h4>
                                                <p className="text-[10px] text-gray-500 mt-0.5 font-mono">{item.kode || '-'}</p>
                                            </div>
                                            <div className="text-right shrink-0">
                                                <p className="text-lg font-bold text-red-600 leading-none">{item.jumlah}</p>
                                                <p className="text-[9px] text-red-400 mt-1 uppercase font-bold tracking-tighter">{item.satuan || 'Unit'}</p>
                                            </div>
                                        </div>
                                        {/* Progress indicate seriousness */}
                                        <div className="mt-3 h-1.5 bg-red-100/50 rounded-full overflow-hidden">
                                            <div 
                                                className="h-full bg-red-500 rounded-full transition-all duration-500" 
                                                style={{ width: `${Math.min((item.jumlah / Math.max(item.stok_minimum, 1)) * 100, 100)}%` }} 
                                            />
                                        </div>
                                        <div className="flex justify-between items-center mt-2">
                                            <span className="text-[9px] text-gray-400">Ambang: {item.stok_minimum}</span>
                                            <span className="text-[10px] text-red-500 font-semibold">Tersisa {(item.jumlah / Math.max(item.stok_minimum, 1) * 100).toFixed(0)}%</span>
                                        </div>
                                    </div>
                                ))
                            )}

                            {(stats?.lowStockCount || 0) > 3 && (
                                <div className="p-2 py-1.5 bg-gray-50 rounded-lg text-center">
                                    <p className="text-[11px] text-gray-500 font-medium italic">
                                        + {(stats?.lowStockCount || 0) - 3} barang lainnya juga menipis
                                    </p>
                                </div>
                            )}

                            <div className="pt-4 mt-2">
                                 <p className="text-[11px] text-center text-gray-400 italic">
                                    Segera lakukan transaksi barang masuk untuk menjaga ketersediaan stok.
                                 </p>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
