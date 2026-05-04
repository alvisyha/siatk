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
    PlusCircle,
    TrendingUp,
    ClipboardList
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
    totalMasukBulanIni: number;
    totalKeluarBulanIni: number;
    lowStockCount: number;
    totalPendingItems: number;
}

// Reusable stat card component inline
function StatCard({
    icon: Icon,
    label,
    value,
    accentColor,
    bgColor,
}: {
    icon: any;
    label: string;
    value: number;
    accentColor: string;
    bgColor: string;
}) {
    return (
        <div style={{
            background: 'var(--surface)', borderRadius: '14px',
            border: '1px solid var(--border)', padding: '20px 22px',
            boxShadow: 'var(--shadow-sm)',
            display: 'flex', alignItems: 'center', gap: '16px',
            transition: 'box-shadow 0.2s ease, transform 0.2s ease',
            cursor: 'default'
        }}
            onMouseEnter={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-md)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(-2px)';
            }}
            onMouseLeave={e => {
                (e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)';
                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
            }}
        >
            <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: bgColor, display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0
            }}>
                <Icon style={{ width: '20px', height: '20px', color: accentColor }} />
            </div>
            <div>
                <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: '0 0 4px', fontWeight: 500 }}>{label}</p>
                <p style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, lineHeight: 1 }}>{value}</p>
            </div>
        </div>
    );
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

    const getActivityIcon = (activity: Activity) => {
        if (activity.activityType === 'masuk') return { icon: ArrowDownLeft, bg: 'var(--teal-light)', color: 'var(--teal)' };
        if (activity.activityType === 'keluar') return { icon: ArrowUpRight, bg: 'var(--amber-light)', color: 'var(--amber)' };
        const status = (activity as any).status;
        if (status === 'disetujui') return { icon: CheckCircle2, bg: 'var(--success-light)', color: 'var(--success)' };
        if (status === 'ditolak') return { icon: AlertCircle, bg: 'var(--danger-light)', color: 'var(--danger)' };
        return { icon: History, bg: '#fef3c7', color: '#d97706' };
    };

    if (isLoading) {
        return (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '12px' }}>
                <Loader2 style={{ width: '32px', height: '32px', color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                <p style={{ color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, margin: 0 }}>Memuat dashboard...</p>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px' }}>

            {/* Welcome */}
            <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px' }}>
                <div>
                    <h1 style={{ fontSize: '22px', fontWeight: 700, color: 'var(--text-primary)', margin: '0 0 4px', lineHeight: 1.3 }}>
                        Selamat Datang, <span style={{ color: 'var(--primary)' }}>{user?.name || 'User'}</span> 👋
                    </h1>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '13.5px', margin: 0 }}>
                        {user?.role === 'admin'
                            ? 'Berikut adalah ringkasan inventaris ATK Anda bulan ini.'
                            : 'Pantau status pengajuan barang Anda di sini.'}
                    </p>
                    {user?.role === 'user' && (
                        <div style={{ marginTop: '14px' }}>
                            <Link href="/dashboard/permintaan-barang" style={{ textDecoration: 'none' }}>
                                <button style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                                    padding: '9px 18px', borderRadius: '10px',
                                    background: 'var(--primary)', color: '#fff',
                                    fontSize: '13px', fontWeight: 600, border: 'none', cursor: 'pointer',
                                    boxShadow: '0 4px 12px rgba(99,102,241,0.25)',
                                    transition: 'all 0.2s ease'
                                }}
                                    onMouseEnter={e => {
                                        (e.currentTarget as HTMLElement).style.background = 'var(--primary-hover)';
                                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                                    }}
                                    onMouseLeave={e => {
                                        (e.currentTarget as HTMLElement).style.background = 'var(--primary)';
                                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                    }}
                                >
                                    <PlusCircle style={{ width: '15px', height: '15px' }} />
                                    Buat Permintaan Baru
                                </button>
                            </Link>
                        </div>
                    )}
                </div>

                {/* Clock */}
                <div style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '10px 16px', background: 'var(--surface)',
                    borderRadius: '10px', border: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)'
                }}>
                    <Clock style={{ width: '15px', height: '15px', color: 'var(--text-muted)' }} />
                    <span style={{ fontSize: '13.5px', fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums', minWidth: '72px' }}>
                        {mounted ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                    </span>
                </div>
            </div>

            {/* Stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px' }}>
                {user?.role === 'admin' ? (
                    <>
                        <StatCard icon={Package} label="Total Jenis Barang" value={stats?.totalBarang || 0} accentColor="var(--primary)" bgColor="var(--primary-light)" />
                        <StatCard icon={ArrowDownLeft} label="Transaksi Masuk" value={stats?.totalMasukBulanIni || 0} accentColor="var(--teal)" bgColor="var(--teal-light)" />
                        <StatCard icon={ArrowUpRight} label="Transaksi Keluar" value={stats?.totalKeluarBulanIni || 0} accentColor="var(--amber)" bgColor="var(--amber-light)" />
                        <StatCard icon={AlertTriangle} label="Stok Menipis" value={stats?.lowStockCount || 0} accentColor="var(--danger)" bgColor="var(--danger-light)" />
                        <Link href="/dashboard/permintaan-barang" style={{ textDecoration: 'none' }}>
                            <StatCard icon={ClipboardList} label="Permintaan Pending" value={stats?.totalPendingItems || 0} accentColor="#d97706" bgColor="#fffbeb" />
                        </Link>
                    </>
                ) : (
                    <>
                        <StatCard icon={History} label="Total Pengajuan" value={(stats as any)?.totalRequest || 0} accentColor="var(--primary)" bgColor="var(--primary-light)" />
                        <StatCard icon={Clock} label="Menunggu" value={(stats as any)?.pendingCount || 0} accentColor="var(--amber)" bgColor="var(--amber-light)" />
                        <StatCard icon={CheckCircle2} label="Disetujui" value={(stats as any)?.approvedCount || 0} accentColor="var(--teal)" bgColor="var(--teal-light)" />
                        <StatCard icon={AlertCircle} label="Ditolak" value={(stats as any)?.rejectedCount || 0} accentColor="var(--danger)" bgColor="var(--danger-light)" />
                    </>
                )}
            </div>

            {/* Content Grid */}
            <div className={`grid gap-5 items-stretch ${user?.role === 'admin' ? 'grid-cols-1 lg:grid-cols-[1fr_340px]' : 'grid-cols-1'}`}>

                {/* Activity Feed */}
                <div style={{
                    background: 'var(--surface)', borderRadius: '14px',
                    border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden',
                    display: 'flex', flexDirection: 'column', height: '420px'
                }}>
                    {/* Card Header */}
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                        padding: '16px 20px', borderBottom: '1px solid var(--border)'
                    }}>
                        <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <History style={{ width: '15px', height: '15px', color: 'var(--text-muted)' }} />
                            {user?.role === 'admin' ? 'Aktivitas Terbaru' : 'Status Pengajuan Terbaru'}
                        </h2>
                    </div>

                    <div style={{ padding: '12px', flex: 1, overflowY: 'auto', minHeight: 0 }}>
                        {activities.length === 0 ? (
                            <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13.5px' }}>
                                Belum ada aktivitas terbaru hari ini.
                            </div>
                        ) : (
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                {activities.map((activity) => {
                                    const { icon: ActivityIcon, bg, color } = getActivityIcon(activity);
                                    return (
                                        <div key={activity.id} style={{
                                            display: 'flex', alignItems: 'center', gap: '12px',
                                            padding: '12px 14px', borderRadius: '10px',
                                            border: '1px solid transparent',
                                            transition: 'all 0.15s ease', cursor: 'default'
                                        }}
                                            onMouseEnter={e => {
                                                (e.currentTarget as HTMLElement).style.background = 'var(--bg)';
                                                (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                                            }}
                                            onMouseLeave={e => {
                                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                                (e.currentTarget as HTMLElement).style.borderColor = 'transparent';
                                            }}
                                        >
                                            <div style={{
                                                width: '34px', height: '34px', borderRadius: '50%',
                                                background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                            }}>
                                                <ActivityIcon style={{ width: '15px', height: '15px', color: color }} />
                                            </div>
                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                <p style={{ margin: 0, fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.4 }}>
                                                    <span style={{ fontWeight: 600 }}>{activity.barang.nama}</span>
                                                    <span style={{ color: 'var(--text-secondary)', marginLeft: '4px' }}>
                                                        {activity.activityType === 'masuk' ? 'masuk' :
                                                            activity.activityType === 'keluar' ? 'keluar' :
                                                                `— ${(activity as any).status}`}
                                                    </span>
                                                    {(activity.activityType as any) !== 'permintaan' && (
                                                        <span style={{ marginLeft: '4px', fontWeight: 700, color: color }}>
                                                            {activity.jumlah} {activity.satuan || 'unit'}
                                                        </span>
                                                    )}
                                                </p>
                                            </div>
                                            <span style={{ fontSize: '11px', color: 'var(--text-muted)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                                                {formatTime(activity.created_at)}
                                            </span>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                {/* Low Stock Alerts */}
                {user?.role === 'admin' && (
                    <div style={{
                        background: 'var(--surface)', borderRadius: '14px',
                        border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                        overflow: 'hidden',
                        display: 'flex', flexDirection: 'column', height: '420px'
                    }}>
                        <div style={{
                            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                            padding: '16px 20px', borderBottom: '1px solid var(--border)'
                        }}>
                            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <AlertTriangle style={{ width: '15px', height: '15px', color: 'var(--danger)' }} />
                                Stok Rendah
                            </h2>
                            {lowStockItems.length > 0 && (
                                <Link href="/dashboard/barang" style={{
                                    fontSize: '12px', fontWeight: 600, color: 'var(--primary)',
                                    textDecoration: 'none'
                                }}
                                    onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                    onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                                >
                                    Lihat Semua
                                </Link>
                            )}
                        </div>

                        {/* Scroll body — grows to fill card height below header */}
                        <div style={{ flex: 1, minHeight: 0, display: 'flex', flexDirection: 'column', paddingTop: '12px', paddingBottom: '12px', paddingLeft: '12px', paddingRight: '6px' }}>
                            {lowStockItems.length === 0 ? (
                                <div style={{ padding: '28px 16px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '13px' }}>
                                    Semua stok dalam kondisi aman. ✓
                                </div>
                            ) : (
                                <>
                                    {/* Dedicated scroll container — grows to fill, scrolls when needed */}
                                    <div style={{
                                        flex: 1,
                                        minHeight: 0,
                                        overflowY: 'auto',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        gap: '8px',
                                        paddingRight: '6px',
                                    }}>
                                        {lowStockItems.map((item) => {
                                            const pct = Math.min((item.jumlah / Math.max(item.stok_minimum, 1)) * 100, 100);
                                            return (
                                                <div key={item.id} style={{
                                                    padding: '12px 14px', borderRadius: '10px',
                                                    background: 'var(--danger-light)',
                                                    border: '1px solid var(--danger-border)',
                                                    flexShrink: 0,
                                                }}>
                                                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '8px' }}>
                                                        <div>
                                                            <p style={{ margin: 0, fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{item.nama}</p>
                                                            <p style={{ margin: '2px 0 0', fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace' }}>{item.kode || '—'}</p>
                                                        </div>
                                                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                                                            <p style={{ margin: 0, fontSize: '18px', fontWeight: 700, color: 'var(--danger)', lineHeight: 1.1 }}>{item.jumlah}</p>
                                                            <p style={{ margin: 0, fontSize: '10px', color: 'var(--danger)', fontWeight: 500 }}>{item.satuan || 'Unit'}</p>
                                                        </div>
                                                    </div>
                                                    {/* Progress bar */}
                                                    <div style={{ height: '4px', background: 'rgba(220,38,38,0.15)', borderRadius: '99px', overflow: 'hidden' }}>
                                                        <div style={{ height: '100%', width: `${pct}%`, background: 'var(--danger)', borderRadius: '99px', transition: 'width 0.5s ease' }} />
                                                    </div>
                                                    <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
                                                        <span style={{ fontSize: '10px', color: 'var(--text-muted)' }}>Min: {item.stok_minimum}</span>
                                                        <span style={{ fontSize: '10px', color: 'var(--danger)', fontWeight: 600 }}>{pct.toFixed(0)}%</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {/* Bottom spacer inside scroll area so last item isn't flush against the edge */}
                                        <div style={{ minHeight: '12px', flexShrink: 0 }} />
                                    </div>

                                    {/* Footer — always visible, outside scroll container */}
                                    <p style={{ textAlign: 'center', fontSize: '11.5px', color: 'var(--text-muted)', margin: '8px 0 0', fontStyle: 'italic' }}>
                                        Segera lakukan transaksi barang masuk.
                                    </p>
                                </>
                            )}
                        </div>
                    </div>
                )}
            </div>

            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
              @media (max-width: 800px) {
                .dashboard-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
        </div>
    );
}
