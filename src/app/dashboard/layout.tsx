'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    ChevronDown,
    Box,
    ChevronRight,
    Database,
    ArrowDownLeft,
    ArrowUpRight,
    ClipboardList,
    Briefcase,
    Truck,
    PackageCheck,
    FileText,
    Ruler,
    Menu,
    X
} from 'lucide-react';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string;
}

const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Box, label: 'Data Barang', href: '/dashboard/barang' },
    {
        icon: ClipboardList,
        label: 'Transaksi',
        subItems: [
            { icon: ArrowDownLeft, label: 'Barang Masuk', href: '/dashboard/barang-masuk', roles: ['admin'] },
            { icon: ArrowUpRight, label: 'Barang Keluar', href: '/dashboard/barang-keluar', roles: ['admin'] },
            { icon: ClipboardList, label: 'Permintaan Barang', href: '/dashboard/permintaan-barang' },
            { icon: PackageCheck, label: 'Barang Terkirim', href: '/dashboard/barang-diterima', roles: ['admin'] },
            { icon: PackageCheck, label: 'Barang Diterima', href: '/dashboard/barang-diterima', roles: ['user'] },
        ]
    },
    { icon: FileText, label: 'Laporan', href: '/dashboard/laporan' },
    {
        icon: Database,
        label: 'Master Data',
        roles: ['admin'],
        subItems: [
            { icon: Briefcase, label: 'Sub Bagian', href: '/dashboard/sub-bagian' },
            { icon: Ruler, label: 'Satuan', href: '/dashboard/satuan' },
            { icon: Truck, label: 'Supplier', href: '/dashboard/supplier' },
        ]
    },
    { icon: Users, label: 'Users', href: '/dashboard/users', roles: ['admin'] },
    { icon: Settings, label: 'Settings', href: '/dashboard/settings' },
];

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const router = useRouter();
    const pathname = usePathname();
    const [user, setUser] = useState<User | null>(null);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState<string[]>(['Master Data', 'Transaksi']);

    useEffect(() => {
        fetchUser();
    }, []);

    const toggleMenu = (label: string) => {
        setOpenMenus(prev =>
            prev.includes(label)
                ? prev.filter(m => m !== label)
                : [...prev, label]
        );
    };

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

    const handleLogout = async () => {
        try {
            await fetch('/api/auth/logout', { method: 'POST' });
            router.push('/login');
            router.refresh();
        } catch (error) {
            console.error('Logout failed:', error);
        }
    };

    const getInitials = (name?: string) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    const currentLabel = menuItems
        .flatMap(m => (m as any).subItems ? (m as any).subItems : [m])
        .find((m: any) => m.href === pathname)?.label || 'Dashboard';

    return (
        <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex' }}>
            {/* Mobile Backdrop */}
            {isMobileMenuOpen && (
                <div 
                    className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm md:hidden"
                    onClick={() => setIsMobileMenuOpen(false)}
                />
            )}

            {/* ─── Sidebar ─── */}
            <aside className={`fixed top-0 left-0 z-50 h-full w-[260px] flex flex-col transition-transform duration-300 ease-in-out md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{
                background: 'var(--sidebar-bg)',
                borderRight: '1px solid var(--sidebar-border)',
                boxShadow: 'var(--shadow-md)',
            }}>
                {/* Logo & Mobile Close */}
                <div style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    height: '64px', padding: '0 20px',
                    borderBottom: '1px solid var(--border)',
                    flexShrink: 0,
                }}>
                    <Link href="/dashboard" style={{ display: 'flex', alignItems: 'center', gap: '10px', textDecoration: 'none' }}>
                        <div style={{
                            width: '34px', height: '34px', borderRadius: '10px',
                            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 2px 8px rgba(99,102,241,0.35)', flexShrink: 0,
                        }}>
                            <span style={{ fontWeight: 900, fontSize: '14px', color: '#fff', fontStyle: 'italic' }}>A</span>
                        </div>
                        <span style={{ fontWeight: 800, fontSize: '17px', color: 'var(--text-primary)', letterSpacing: '-0.5px' }}>ATKIS</span>
                    </Link>
                    <button 
                        className="md:hidden p-1.5 rounded-lg text-gray-500 hover:bg-gray-100"
                        onClick={() => setIsMobileMenuOpen(false)}
                        style={{ color: 'var(--text-muted)' }}
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Nav */}
                <nav style={{ flex: 1, padding: '12px', overflowY: 'auto' }}>
                    {menuItems.map((item) => {
                        let renderItem: any = { ...item };

                        if (renderItem.roles && user?.role && !renderItem.roles.includes(user.role)) {
                            return null;
                        }

                        if (renderItem.subItems) {
                            const filteredSubItems = renderItem.subItems.filter((sub: any) =>
                                !sub.roles || (user?.role && sub.roles.includes(user.role))
                            );
                            if (filteredSubItems.length === 0) return null;
                            renderItem = { ...renderItem, subItems: filteredSubItems };
                        }

                        const hasSubItems = !!renderItem.subItems;
                        const isOpen = openMenus.includes(renderItem.label);
                        const isActive = pathname === renderItem.href ||
                            (renderItem.subItems?.some((sub: any) => pathname === sub.href));

                        if (hasSubItems) {
                            return (
                                <div key={renderItem.label} style={{ marginBottom: '2px' }}>
                                    <button
                                        onClick={() => toggleMenu(renderItem.label)}
                                        style={{
                                            width: '100%', display: 'flex', alignItems: 'center',
                                            justifyContent: 'space-between', gap: '10px',
                                            padding: '9px 12px', borderRadius: '9px',
                                            border: 'none', cursor: 'pointer', textAlign: 'left',
                                            background: isActive && !isOpen ? 'var(--sidebar-active-bg)' : 'transparent',
                                            color: isActive && !isOpen ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                                            transition: 'all 0.15s ease',
                                        }}
                                        onMouseEnter={e => {
                                            if (!(isActive && !isOpen)) {
                                                (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover-bg)';
                                                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            if (!(isActive && !isOpen)) {
                                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                                (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-text)';
                                            }
                                        }}
                                    >
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                            <renderItem.icon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                                            <span style={{ fontSize: '13.5px', fontWeight: 500 }}>{renderItem.label}</span>
                                        </div>
                                        <ChevronRight style={{
                                            width: '14px', height: '14px', flexShrink: 0,
                                            transform: isOpen ? 'rotate(90deg)' : 'none',
                                            transition: 'transform 0.2s ease',
                                            color: isOpen ? 'var(--primary)' : 'var(--text-muted)',
                                        }} />
                                    </button>

                                    {isOpen && (
                                        <div style={{ paddingLeft: '12px', marginTop: '2px', paddingBottom: '4px' }}>
                                            {renderItem.subItems?.map((sub: any) => {
                                                const isSubActive = pathname === sub.href;
                                                return (
                                                    <Link
                                                        key={sub.label}
                                                        href={sub.href}
                                                        style={{
                                                            display: 'flex', alignItems: 'center', gap: '10px',
                                                            padding: '8px 12px', borderRadius: '8px',
                                                            marginBottom: '1px', textDecoration: 'none',
                                                            background: isSubActive ? 'var(--sidebar-active-bg)' : 'transparent',
                                                            color: isSubActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                                                            fontWeight: isSubActive ? 600 : 400,
                                                            fontSize: '13px',
                                                            transition: 'all 0.15s ease',
                                                            borderLeft: isSubActive ? '2px solid var(--primary)' : '2px solid transparent',
                                                        }}
                                                        onMouseEnter={e => {
                                                            if (!isSubActive) {
                                                                (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover-bg)';
                                                                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                                                            }
                                                        }}
                                                        onMouseLeave={e => {
                                                            if (!isSubActive) {
                                                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                                                (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-text)';
                                                            }
                                                        }}
                                                    >
                                                        <sub.icon style={{ width: '14px', height: '14px', flexShrink: 0 }} />
                                                        <span>{sub.label}</span>
                                                    </Link>
                                                );
                                            })}
                                        </div>
                                    )}
                                </div>
                            );
                        }

                        return (
                            <Link
                                key={renderItem.label}
                                href={renderItem.href || '#'}
                                onClick={() => setIsMobileMenuOpen(false)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '10px',
                                    padding: '9px 12px', borderRadius: '9px',
                                    marginBottom: '2px', textDecoration: 'none',
                                    background: isActive ? 'var(--sidebar-active-bg)' : 'transparent',
                                    color: isActive ? 'var(--sidebar-active-text)' : 'var(--sidebar-text)',
                                    fontWeight: isActive ? 600 : 500,
                                    fontSize: '13.5px',
                                    transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={e => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover-bg)';
                                        (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!isActive) {
                                        (e.currentTarget as HTMLElement).style.background = 'transparent';
                                        (e.currentTarget as HTMLElement).style.color = 'var(--sidebar-text)';
                                    }
                                }}
                            >
                                <renderItem.icon style={{ width: '16px', height: '16px', flexShrink: 0 }} />
                                <span>{renderItem.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Footer */}
                <div style={{ padding: '12px', borderTop: '1px solid var(--border)', flexShrink: 0 }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', gap: '10px',
                        padding: '10px 12px', marginBottom: '6px', borderRadius: '10px',
                        background: 'var(--bg)',
                    }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}>
                            <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                                {getInitials(user?.name)}
                            </span>
                        </div>
                        <div style={{ minWidth: 0 }}>
                            <p style={{
                                fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)',
                                margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                            }}>
                                {user?.name || 'User'}
                            </p>
                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0, textTransform: 'capitalize' }}>
                                {user?.role || '—'}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={handleLogout}
                        style={{
                            display: 'flex', alignItems: 'center', gap: '10px',
                            width: '100%', padding: '9px 12px', borderRadius: '9px',
                            border: 'none', cursor: 'pointer', textAlign: 'left',
                            background: 'transparent', color: 'var(--text-secondary)',
                            fontSize: '13.5px', fontWeight: 500, transition: 'all 0.15s ease',
                        }}
                        onMouseEnter={e => {
                            (e.currentTarget as HTMLElement).style.background = 'var(--danger-light)';
                            (e.currentTarget as HTMLElement).style.color = 'var(--danger)';
                        }}
                        onMouseLeave={e => {
                            (e.currentTarget as HTMLElement).style.background = 'transparent';
                            (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                        }}
                    >
                        <LogOut style={{ width: '16px', height: '16px' }} />
                        <span>Keluar</span>
                    </button>
                </div>
            </aside>

            {/* ─── Main Area ─── */}
            <div className="flex-1 flex flex-col min-w-0 transition-all duration-300 ease-in-out md:ml-[260px]">

                {/* Header */}
                <header style={{
                    position: 'sticky', top: 0, zIndex: 30, height: '64px',
                    background: 'var(--surface)',
                    borderBottom: '1px solid var(--border)',
                    boxShadow: 'var(--shadow-sm)',
                    display: 'flex', alignItems: 'center',
                    flexShrink: 0,
                }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', justifyItems: 'space-between',
                        width: '100%', padding: '0 16px',
                    }} className="md:px-5 justify-between">
                        {/* Breadcrumb */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <button 
                                className="mr-2 p-1.5 rounded-lg md:hidden"
                                style={{ color: 'var(--text-muted)' }}
                                onClick={() => setIsMobileMenuOpen(true)}>
                                <Menu className="w-5 h-5" />
                            </button>
                            <span className="hidden sm:inline" style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>ATKIS</span>
                            <span className="hidden sm:inline" style={{ color: 'var(--border-strong)' }}>›</span>
                            <span style={{ fontSize: '13px', color: 'var(--text-primary)', fontWeight: 600 }}>
                                {currentLabel}
                            </span>
                        </div>

                        {/* User Dropdown */}
                        <div style={{ position: 'relative' }}>
                            <button
                                onClick={() => setUserMenuOpen(!userMenuOpen)}
                                style={{
                                    display: 'flex', alignItems: 'center', gap: '8px',
                                    padding: '6px 10px 6px 6px', borderRadius: '10px',
                                    border: '1px solid var(--border)', cursor: 'pointer',
                                    background: 'var(--surface)', transition: 'all 0.15s ease',
                                }}
                                onMouseEnter={e => {
                                    (e.currentTarget as HTMLElement).style.background = 'var(--bg)';
                                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border-strong)';
                                }}
                                onMouseLeave={e => {
                                    (e.currentTarget as HTMLElement).style.background = 'var(--surface)';
                                    (e.currentTarget as HTMLElement).style.borderColor = 'var(--border)';
                                }}
                            >
                                <div style={{
                                    width: '30px', height: '30px', borderRadius: '50%', flexShrink: 0,
                                    background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                }}>
                                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#fff' }}>
                                        {getInitials(user?.name)}
                                    </span>
                                </div>
                                <div style={{ textAlign: 'left' }}>
                                    <p style={{ fontSize: '12.5px', fontWeight: 600, color: 'var(--text-primary)', margin: 0, lineHeight: 1.3 }}>
                                        {user?.name || 'User'}
                                    </p>
                                    <p style={{ fontSize: '10px', color: 'var(--text-muted)', margin: 0, textTransform: 'capitalize' }}>
                                        {user?.role || '—'}
                                    </p>
                                </div>
                                <ChevronDown style={{
                                    width: '14px', height: '14px', color: 'var(--text-muted)',
                                    transform: userMenuOpen ? 'rotate(180deg)' : 'none',
                                    transition: 'transform 0.2s ease',
                                }} />
                            </button>

                            {userMenuOpen && (
                                <>
                                    <div onClick={() => setUserMenuOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 10 }} />
                                    <div className="animate-scale-in" style={{
                                        position: 'absolute', right: 0, top: 'calc(100% + 8px)', zIndex: 20,
                                        width: '200px', background: 'var(--surface)',
                                        borderRadius: 'var(--radius-md)', border: '1px solid var(--border)',
                                        boxShadow: 'var(--shadow-lg)', overflow: 'hidden', padding: '6px',
                                    }}>
                                        <div style={{ padding: '10px 12px', marginBottom: '4px', borderRadius: '8px', background: 'var(--bg)' }}>
                                            <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', margin: 0 }}>{user?.name}</p>
                                            <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{user?.email}</p>
                                        </div>
                                        <Link
                                            href="/dashboard/settings"
                                            onClick={() => setUserMenuOpen(false)}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                padding: '8px 12px', borderRadius: '8px',
                                                fontSize: '13px', color: 'var(--text-secondary)',
                                                textDecoration: 'none', transition: 'all 0.15s ease',
                                            }}
                                            onMouseEnter={e => {
                                                (e.currentTarget as HTMLElement).style.background = 'var(--sidebar-hover-bg)';
                                                (e.currentTarget as HTMLElement).style.color = 'var(--text-primary)';
                                            }}
                                            onMouseLeave={e => {
                                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                                (e.currentTarget as HTMLElement).style.color = 'var(--text-secondary)';
                                            }}
                                        >
                                            <Settings style={{ width: '14px', height: '14px' }} />
                                            Settings
                                        </Link>
                                        <div style={{ height: '1px', background: 'var(--border)', margin: '4px 0' }} />
                                        <button
                                            onClick={handleLogout}
                                            style={{
                                                display: 'flex', alignItems: 'center', gap: '8px',
                                                width: '100%', padding: '8px 12px', borderRadius: '8px',
                                                border: 'none', cursor: 'pointer', textAlign: 'left',
                                                fontSize: '13px', color: 'var(--danger)',
                                                background: 'transparent', transition: 'all 0.15s ease',
                                            }}
                                            onMouseEnter={e => {
                                                (e.currentTarget as HTMLElement).style.background = 'var(--danger-light)';
                                            }}
                                            onMouseLeave={e => {
                                                (e.currentTarget as HTMLElement).style.background = 'transparent';
                                            }}
                                        >
                                            <LogOut style={{ width: '14px', height: '14px' }} />
                                            Logout
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="flex-1 p-4 md:p-6 lg:p-7 overflow-y-auto w-full max-w-full">
                    {children}
                </main>
            </div>
        </div>
    );
}
