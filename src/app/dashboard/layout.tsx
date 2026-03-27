'use client';

import { useState, useEffect } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import {
    LayoutDashboard,
    Users,
    Settings,
    LogOut,
    Menu,
    X,
    Bell,
    Search,
    ChevronDown,
    Box,
    DoorOpen,
    Scale,
    Tags,
    ChevronRight,
    Database,
    ArrowDownLeft,
    ArrowUpRight,
    ClipboardList,
    Briefcase,
    Truck,
    CheckCircle,
    PackageCheck,
    FileText,
    Ruler
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
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [userMenuOpen, setUserMenuOpen] = useState(false);
    const [openMenus, setOpenMenus] = useState<string[]>(['Master Data', 'Transaksi']); // Both groups open by default

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

    return (
        <div className="min-h-screen bg-gray-50 text-gray-900">
            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-72 bg-blue-600 shadow-xl transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-white/10">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-white flex items-center justify-center text-blue-600 shadow-sm">
                            <span className="font-black text-xs italic">A</span>
                        </div>
                        <span className="text-xl font-black tracking-tighter text-white">ATKIS</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-gray-400 hover:text-gray-600 transition-colors"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1.5 overflow-y-auto max-h-[calc(100vh-140px)]">
                    {menuItems.map((item) => {
                        let renderItem: any = { ...item };

                        // Role-based filtering for top-level items
                        if (renderItem.roles && user?.role && !renderItem.roles.includes(user.role)) {
                            return null;
                        }

                        // Filter sub-items by role
                        if (renderItem.subItems) {
                            const filteredSubItems = renderItem.subItems.filter((sub: any) =>
                                !sub.roles || (user?.role && sub.roles.includes(user.role))
                            );
                            if (filteredSubItems.length === 0) return null;
                            renderItem = { ...renderItem, subItems: filteredSubItems };
                        }

                        const hasSubItems = !!renderItem.subItems;
                        const isOpen = openMenus.includes(renderItem.label);
                        const isActive = pathname === renderItem.href || (renderItem.subItems?.some((sub: any) => pathname === sub.href));

                        if (hasSubItems) {
                            return (
                                <div key={renderItem.label} className="space-y-1">
                                    <button
                                        onClick={() => toggleMenu(renderItem.label)}
                                        className={`w-full flex items-center justify-between gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${isActive && !isOpen
                                            ? 'bg-white/20 text-white'
                                            : 'text-blue-50 hover:text-white hover:bg-white/10'
                                            }`}
                                    >
                                        <div className="flex items-center gap-3">
                                            <renderItem.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-200/60 group-hover:text-white'}`} />
                                            <span className="font-medium">{renderItem.label}</span>
                                        </div>
                                        <ChevronRight className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-90 text-white' : 'text-blue-200/40'}`} />
                                    </button>

                                    {isOpen && (
                                        <div className="pl-4 space-y-1">
                                            {renderItem.subItems?.map((sub: any) => {
                                                const isSubActive = pathname === sub.href;
                                                return (
                                                    <Link
                                                        key={sub.label}
                                                        href={sub.href}
                                                        className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 group ${isSubActive
                                                            ? 'bg-white text-blue-600 font-bold'
                                                            : 'text-blue-50/70 hover:text-white hover:bg-white/10'
                                                            }`}
                                                    >
                                                        <sub.icon className={`w-4 h-4 ${isSubActive ? 'text-blue-600' : 'text-blue-200/40 group-hover:text-white'}`} />
                                                        <span className="text-sm">{sub.label}</span>
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
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-white/20 text-white font-bold'
                                    : 'text-blue-50/80 hover:text-white hover:bg-white/10'
                                    }`}
                            >
                                <renderItem.icon className={`w-5 h-5 ${isActive ? 'text-white' : 'text-blue-200/60 group-hover:text-white'}`} />
                                <span className="font-medium">{renderItem.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/10">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-blue-50 hover:text-white hover:bg-red-500 transition-all duration-200 font-bold"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:ml-72">
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 bg-blue-600 text-white shadow-lg shadow-blue-200">
                    <div className="flex items-center justify-between h-full px-4 lg:px-8">
                        {/* Left Side */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden text-white hover:bg-white/10 p-2 rounded-lg"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            {/* Search */}
                            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-white/10 rounded-lg border border-white/20 focus-within:bg-white/20 focus-within:border-white transition-all">
                                <Search className="w-5 h-5 text-white/70" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="bg-transparent border-none outline-none text-white placeholder-white/60 w-64 text-sm"
                                />
                            </div>
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-4">
                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-lg hover:bg-white/10 transition-colors border border-transparent hover:border-white/20"
                                >
                                    <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center text-blue-600 font-bold text-sm">
                                        {user?.avatar || (user?.name ? user.name.charAt(0).toUpperCase() : 'U')}
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-bold text-white leading-tight">{user?.name || 'User'}</p>
                                        <p className="text-[10px] text-white/70 font-bold uppercase tracking-widest">{user?.role || 'Role'}</p>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-white/70" />
                                </button>

                                {userMenuOpen && (
                                    <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl border border-gray-100 shadow-lg py-1">
                                        <div className="px-4 py-2 border-b border-gray-50 md:hidden">
                                            <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                                            <p className="text-xs text-gray-500">{user?.email}</p>
                                        </div>
                                        <Link
                                            href="/dashboard/settings"
                                            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            Settings
                                        </Link>
                                        <div className="border-t border-gray-100 my-1"></div>
                                        <button
                                            onClick={handleLogout}
                                            className="block w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                        >
                                            Logout
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </header>

                {/* Page Content */}
                <main className="p-4 lg:p-8">
                    {children}
                </main>
            </div>
        </div>
    );
}
