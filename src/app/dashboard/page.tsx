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
}

const stats: StatCard[] = [
    {
        title: 'Total Revenue',
        value: 'Rp 45.2M',
        change: '+12.5%',
        changeType: 'positive',
        icon: DollarSign,
        color: 'from-green-500 to-emerald-500'
    },
    {
        title: 'Active Users',
        value: '2,345',
        change: '+8.2%',
        changeType: 'positive',
        icon: Users,
        color: 'from-blue-500 to-cyan-500'
    },
    {
        title: 'Conversion Rate',
        value: '3.24%',
        change: '-2.1%',
        changeType: 'negative',
        icon: TrendingUp,
        color: 'from-purple-500 to-pink-500'
    },
    {
        title: 'Active Sessions',
        value: '1,234',
        change: '+15.3%',
        changeType: 'positive',
        icon: Activity,
        color: 'from-orange-500 to-yellow-500'
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

    useEffect(() => {
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
                return <CheckCircle2 className="w-5 h-5 text-green-400" />;
            case 'warning':
                return <AlertCircle className="w-5 h-5 text-yellow-400" />;
            case 'error':
                return <AlertCircle className="w-5 h-5 text-red-400" />;
            default:
                return <Clock className="w-5 h-5 text-blue-400" />;
        }
    };

    return (
        <div className="space-y-8">
            {/* Welcome Section */}
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                    <h1 className="text-2xl md:text-3xl font-bold text-white">
                        Welcome back, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400">{user?.name || 'User'}</span>! 👋
                    </h1>
                    <p className="text-gray-400 mt-1">
                        Here's what's happening with your dashboard today.
                    </p>
                </div>
                <div className="flex items-center gap-3 px-4 py-3 bg-white/5 rounded-xl border border-white/10">
                    <Clock className="w-5 h-5 text-purple-400" />
                    <span className="text-white font-medium">
                        {currentTime.toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
                {stats.map((stat, index) => (
                    <div
                        key={index}
                        className="group relative bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6 hover:border-white/20 transition-all duration-300"
                    >
                        {/* Gradient Glow */}
                        <div className={`absolute inset-0 rounded-2xl bg-gradient-to-r ${stat.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`} />

                        <div className="relative">
                            <div className="flex items-center justify-between mb-4">
                                <div className={`p-3 rounded-xl bg-gradient-to-r ${stat.color}`}>
                                    <stat.icon className="w-6 h-6 text-white" />
                                </div>
                                <div className={`flex items-center gap-1 text-sm font-medium ${stat.changeType === 'positive' ? 'text-green-400' : 'text-red-400'
                                    }`}>
                                    {stat.changeType === 'positive' ? (
                                        <ArrowUpRight className="w-4 h-4" />
                                    ) : (
                                        <ArrowDownRight className="w-4 h-4" />
                                    )}
                                    {stat.change}
                                </div>
                            </div>
                            <h3 className="text-gray-400 text-sm font-medium mb-1">{stat.title}</h3>
                            <p className="text-2xl font-bold text-white">{stat.value}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Recent Activity */}
                <div className="lg:col-span-2 bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-xl font-bold text-white">Recent Activity</h2>
                        <button className="p-2 hover:bg-white/5 rounded-lg transition-colors">
                            <MoreHorizontal className="w-5 h-5 text-gray-400" />
                        </button>
                    </div>

                    <div className="space-y-4">
                        {recentActivities.map((activity) => (
                            <div
                                key={activity.id}
                                className="flex items-center gap-4 p-4 bg-white/5 rounded-xl hover:bg-white/10 transition-colors"
                            >
                                {getStatusIcon(activity.status)}
                                <div className="flex-1">
                                    <p className="text-white">
                                        <span className="font-medium">{activity.user}</span>{' '}
                                        <span className="text-gray-400">{activity.action}</span>
                                    </p>
                                    <p className="text-sm text-gray-500">{activity.time}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Stats */}
                <div className="bg-slate-800/50 backdrop-blur-xl rounded-2xl border border-white/10 p-6">
                    <h2 className="text-xl font-bold text-white mb-6">Quick Stats</h2>

                    <div className="space-y-6">
                        {/* Progress Item */}
                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400">Monthly Goal</span>
                                <span className="text-white font-medium">78%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-[78%] bg-gradient-to-r from-purple-500 to-cyan-500 rounded-full" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400">User Satisfaction</span>
                                <span className="text-white font-medium">92%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-[92%] bg-gradient-to-r from-green-500 to-emerald-500 rounded-full" />
                            </div>
                        </div>

                        <div>
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-gray-400">Task Completion</span>
                                <span className="text-white font-medium">64%</span>
                            </div>
                            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                                <div className="h-full w-[64%] bg-gradient-to-r from-orange-500 to-yellow-500 rounded-full" />
                            </div>
                        </div>

                        {/* Info Cards */}
                        <div className="pt-4 border-t border-white/10 space-y-3">
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                <span className="text-gray-400">Total Orders</span>
                                <span className="text-white font-bold">1,234</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                <span className="text-gray-400">Pending Tasks</span>
                                <span className="text-white font-bold">23</span>
                            </div>
                            <div className="flex items-center justify-between p-3 bg-white/5 rounded-xl">
                                <span className="text-gray-400">Active Projects</span>
                                <span className="text-white font-bold">8</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
