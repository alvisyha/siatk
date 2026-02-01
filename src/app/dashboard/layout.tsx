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
    DoorOpen
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
    { icon: Box, label: 'Barang', href: '/dashboard/barang' },
    { icon: DoorOpen, label: 'Ruangan', href: '/dashboard/ruangan' },
    { icon: Users, label: 'Users', href: '/dashboard/users' },
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

    useEffect(() => {
        fetchUser();
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
        <div className="min-h-screen bg-gray-50">
            {/* Mobile Sidebar Backdrop */}
            {sidebarOpen && (
                <div
                    className="fixed inset-0 z-40 bg-gray-900/50 backdrop-blur-sm lg:hidden"
                    onClick={() => setSidebarOpen(false)}
                />
            )}

            {/* Sidebar */}
            <aside
                className={`fixed top-0 left-0 z-50 h-full w-72 bg-white border-r border-gray-200 transform transition-transform duration-300 ease-in-out lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'
                    }`}
            >
                {/* Sidebar Header */}
                <div className="flex items-center justify-between h-16 px-6 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center">
                            <LayoutDashboard className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-lg font-bold text-gray-900">Dashboard</span>
                    </div>
                    <button
                        onClick={() => setSidebarOpen(false)}
                        className="lg:hidden text-gray-400 hover:text-gray-600"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>

                {/* Navigation */}
                <nav className="p-4 space-y-1">
                    {menuItems.map((item) => {
                        const isActive = pathname === item.href;
                        return (
                            <Link
                                key={item.href}
                                href={item.href}
                                className={`flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group ${isActive
                                    ? 'bg-blue-50 text-blue-600 font-medium'
                                    : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                                    }`}
                            >
                                <item.icon className={`w-5 h-5 ${isActive ? 'text-blue-600' : 'text-gray-400 group-hover:text-gray-600'}`} />
                                <span className={isActive ? 'font-medium' : ''}>{item.label}</span>
                            </Link>
                        );
                    })}
                </nav>

                {/* Sidebar Footer */}
                <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-100">
                    <button
                        onClick={handleLogout}
                        className="flex items-center gap-3 w-full px-4 py-2.5 rounded-lg text-gray-600 hover:text-red-600 hover:bg-red-50 transition-all duration-200"
                    >
                        <LogOut className="w-5 h-5" />
                        <span>Logout</span>
                    </button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="lg:ml-72">
                {/* Header */}
                <header className="sticky top-0 z-30 h-16 bg-white/80 backdrop-blur-md border-b border-gray-200">
                    <div className="flex items-center justify-between h-full px-4 lg:px-8">
                        {/* Left Side */}
                        <div className="flex items-center gap-4">
                            <button
                                onClick={() => setSidebarOpen(true)}
                                className="lg:hidden text-gray-500 hover:text-gray-700"
                            >
                                <Menu className="w-6 h-6" />
                            </button>

                            {/* Search */}
                            <div className="hidden md:flex items-center gap-3 px-4 py-2 bg-gray-50 rounded-lg border border-gray-200 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-100 transition-all">
                                <Search className="w-5 h-5 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search..."
                                    className="bg-transparent border-none outline-none text-gray-900 placeholder-gray-400 w-64 text-sm"
                                />
                            </div>
                        </div>

                        {/* Right Side */}
                        <div className="flex items-center gap-4">
                            {/* Notifications */}
                            <button className="relative p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
                                <Bell className="w-5 h-5" />
                                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white" />
                            </button>

                            {/* User Menu */}
                            <div className="relative">
                                <button
                                    onClick={() => setUserMenuOpen(!userMenuOpen)}
                                    className="flex items-center gap-3 pl-3 pr-2 py-1.5 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-200"
                                >
                                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 font-semibold text-sm">
                                        {user?.avatar || (user?.name ? user.name.charAt(0).toUpperCase() : 'U')}
                                    </div>
                                    <div className="hidden md:block text-left">
                                        <p className="text-sm font-medium text-gray-900">{user?.name || 'User'}</p>
                                        <p className="text-xs text-gray-500">{user?.role || 'Role'}</p>
                                    </div>
                                    <ChevronDown className="w-4 h-4 text-gray-400" />
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
