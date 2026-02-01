'use client';

import { useState, useEffect } from 'react';
import {
    TrendingUp,
    Users,
    DollarSign,
    Activity,
    ArrowUpRight,
    ArrowDownRight,
    Clock,
    CheckCircle2,
    AlertCircle,
    MoreHorizontal
} from 'lucide-react';

interface User {
    id: string;
    email: string;
    name: string;
    role: string;
    avatar: string;
}

interface StatCard {
    title: string;
    value: string;
    change: string;
    changeType: 'positive' | 'negative';
    icon: React.ComponentType<{ className?: string }>;
    color: string;
    bgColor: string;
}

const stats: StatCard[] = [
    {
        title: 'Total Revenue',
        value: 'Rp 45.2M',
        change: '+12.5%',
        changeType: 'positive',
        icon: DollarSign,
        color: 'text-emerald-600',
        bgColor: 'bg-emerald-50'
    },
    {
        title: 'Active Users',
        value: '2,345',
        change: '+8.2%',
        changeType: 'positive',
        icon: Users,
        color: 'text-blue-600',
        bgColor: 'bg-blue-50'
    },
    {
        title: 'Conversion Rate',
        value: '3.24%',
        change: '-2.1%',
        changeType: 'negative',
        icon: TrendingUp,
        color: 'text-purple-600',
        bgColor: 'bg-purple-50'
    },
    {
        title: 'Active Sessions',
        value: '1,234',
        change: '+15.3%',
        changeType: 'positive',
        icon: Activity,
        color: 'text-orange-600',
        bgColor: 'bg-orange-50'
    }
];

const recentActivities = [
    { id: 1, user: 'John Doe', action: 'completed a purchase', time: '2 minutes ago', status: 'success' },
    { id: 2, user: 'Jane Smith', action: 'updated profile settings', time: '15 minutes ago', status: 'info' },
    { id: 3, user: 'Mike Johnson', action: 'submitted a support ticket', time: '1 hour ago', status: 'warning' },
    { id: 4, user: 'Sarah Williams', action: 'joined the platform', time: '3 hours ago', status: 'success' },
    { id: 5, user: 'Alex Brown', action: 'cancelled subscription', time: '5 hours ago', status: 'error' },
];

export default function DashboardPage() {
    const [user, setUser] = useState<User | null>(null);
    const [currentTime, setCurrentTime] = useState(new Date());
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
        fetchUser();
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

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'success':
                return <CheckCircle2 className="w-5 h-5 text-green-500" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-amber-500" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-500" />;
            default:
                return <Clock className="w-5 h-5 text-blue-500" />;
        }
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                        Welcome back, <span className="text-blue-600">{user?.name || 'User'}</span>! 👋
                    </h1>
                    <p className="text-gray-500 mt-1">
                        Here's what's happening with your dashboard today.
                    </p>
                </div>
                <div className="flex items-center gap-3 px-4 py-2 bg-white rounded-lg border border-gray-200 shadow-sm text-sm">
                    <Clock className="w-4 h-4 text-gray-400" />
                    <span className="text-gray-700 font-medium min-w-[80px] text-center">
                        {mounted ? currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) : '--:--:--'}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="bg-white rounded-xl border border-gray-100 shadow-sm p-6 hover:shadow-md transition-all duration-300"
                    >
                        <div className="flex items-center justify-between mb-4">
                            <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                                <stat.icon className={`w-6 h-6 ${stat.color}`} />
                            </div>
                            <div className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${stat.changeType === 'positive' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
                                }`}>
                                {stat.changeType === 'positive' ? (
                                    <ArrowUpRight className="w-3 h-3" />
                                ) : (
                                    <ArrowDownRight className="w-3 h-3" />
                                )}
                                {stat.change}
                            </div>
                        </div>
                        <h3 className="text-gray-500 text-sm font-medium mb-1">{stat.title}</h3>
                        <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-lg font-bold text-gray-900">Recent Activity</h2>
                        <button className="p-2 hover:bg-gray-50 rounded-lg transition-colors">
                            <MoreHorizontal className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {recentActivities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-start gap-4 p-4 rounded-lg hover:bg-gray-50 transition-colors border border-transparent hover:border-gray-100"
                            >
                                <div className="mt-0.5">
                                    {getStatusIcon(activity.status)}
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-900 text-sm">
                                        <span className="font-semibold">{activity.user}</span>{' '}
                                        <span className="text-gray-600">{activity.action}</span>
                                    </p>
                                    <p className="text-xs text-gray-400 mt-1">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-6">
                    <h2 className="text-lg font-bold text-gray-900 mb-6">Quick Stats</h2>

                    <div className="space-y-6">
                        {/* Progress Item */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">Monthly Goal</span>
                                <span className="text-sm font-medium text-gray-900">78%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full w-[78%] bg-blue-500 rounded-full" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">User Satisfaction</span>
                                <span className="text-sm font-medium text-gray-900">92%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full w-[92%] bg-green-500 rounded-full" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-600">Task Completion</span>
                                <span className="text-sm font-medium text-gray-900">64%</span>
                            </div>
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                                <div className="h-full w-[64%] bg-orange-500 rounded-full" />
                            </div>
                        </div>

                        {/* Info Cards */}
                        <div className="pt-6 border-t border-gray-100 space-y-3">
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-sm text-gray-600">Total Orders</span>
                                <span className="text-sm font-bold text-gray-900">1,234</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-sm text-gray-600">Pending Tasks</span>
                                <span className="text-sm font-bold text-gray-900">23</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                                <span className="text-sm text-gray-600">Active Projects</span>
                                <span className="text-sm font-bold text-gray-900">8</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
