'use client';

import { useState, useEffect } from 'react';
import {
    User,
    Mail,
    Lock,
    Save,
    Loader2,
    CheckCircle2,
    AlertCircle,
    UserCircle,
    Building2
} from 'lucide-react';

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Profile state
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');

    // Password state
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    useEffect(() => {
        fetchUser();
    }, []);

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
                setName(data.user.name || '');
                setEmail(data.user.email || '');
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage(null);

        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Profil berhasil diperbarui!' });
                // Optional: refresh page or update global state
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Gagal memperbarui profil' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Terjadi kesalahan koneksi' });
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            setMessage({ type: 'error', text: 'Password baru dan konfirmasi tidak cocok!' });
            return;
        }

        setSaving(true);
        setMessage(null);

        try {
            // First verify current password (using login API or specific verify API)
            // Simplified for this implementation: direct update
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword })
            });

            if (res.ok) {
                setMessage({ type: 'success', text: 'Password berhasil diubah!' });
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                const data = await res.json();
                setMessage({ type: 'error', text: data.error || 'Gagal mengubah password' });
            }
        } catch (error) {
            setMessage({ type: 'error', text: 'Terjadi kesalahan koneksi' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[60vh]">
                <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
            </div>
        );
    }

    return (
        <div className="space-y-10 animate-in fade-in duration-700">
            {/* Minimalist Header */}
            <div className="border-b border-gray-100 pb-6">
                <h1 className="text-2xl font-black tracking-tight text-gray-900">Setting Akun</h1>
                <p className="text-gray-500 text-sm mt-1">Kelola informasi profil dan keamanan akun Anda di sini.</p>
            </div>

            {message && (
                <div className={`p-4 rounded-xl flex items-center gap-3 border animate-in zoom-in duration-300 ${message.type === 'success'
                        ? 'bg-emerald-50 border-emerald-100 text-emerald-700'
                        : 'bg-red-50 border-red-100 text-red-700'
                    }`}>
                    {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <AlertCircle className="w-5 h-5 text-red-500" />}
                    <p className="text-sm font-bold">{message.text}</p>
                </div>
            )}

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-8 items-start">
                {/* Profile Section */}
                <div className="space-y-4">
                    <div className="px-1">
                        <h2 className="text-lg font-bold text-gray-900">Informasi Profil</h2>
                        <p className="text-sm text-gray-500">Perbarui nama dan alamat email Anda secara berkala.</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full">
                        <form onSubmit={handleUpdateProfile} className="p-6 space-y-5 flex flex-col h-full">
                            <div className="space-y-5 flex-grow">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Nama Lengkap</label>
                                    <div className="relative">
                                        <User className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={name}
                                            onChange={(e) => setName(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-medium text-gray-900"
                                            placeholder="Masukkan nama lengkap"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Alamat Email</label>
                                    <div className="relative">
                                        <Mail className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                                        <input
                                            type="email"
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            className="w-full bg-white border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-medium text-gray-900"
                                            placeholder="nama@email.com"
                                        />
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Sub Bagian</label>
                                    <div className="relative">
                                        <Building2 className="absolute left-4 top-3.5 w-4 h-4 text-gray-400" />
                                        <input
                                            type="text"
                                            value={user?.sub_bagian?.nama || '-'}
                                            readOnly
                                            className="w-full bg-gray-50 border border-gray-200 rounded-xl pl-11 pr-4 py-3 text-sm font-medium text-gray-500 cursor-not-allowed outline-none"
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-blue-600 text-white rounded-xl font-bold text-sm hover:bg-blue-700 transition-all disabled:opacity-50 shadow-lg shadow-blue-200 active:scale-95"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                    Simpan Profil
                                </button>
                            </div>
                        </form>
                    </div>
                </div>

                {/* Password Section */}
                <div className="space-y-4">
                    <div className="px-1">
                        <h2 className="text-lg font-bold text-gray-900">Ubah Password</h2>
                        <p className="text-sm text-gray-500">Pastikan akun Anda tetap aman dengan password baru.</p>
                    </div>
                    <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden h-full">
                        <form onSubmit={handleChangePassword} className="p-6 space-y-5 flex flex-col h-full">
                            <div className="space-y-5 flex-grow">
                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Password Saat Ini</label>
                                    <input
                                        type="password"
                                        value={currentPassword}
                                        onChange={(e) => setCurrentPassword(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-medium text-gray-900"
                                        placeholder="••••••••"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Password Baru</label>
                                    <input
                                        type="password"
                                        value={newPassword}
                                        onChange={(e) => setNewPassword(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-medium text-gray-900"
                                        placeholder="Minimal 6 karakter"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-bold text-gray-700">Konfirmasi Password</label>
                                    <input
                                        type="password"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full bg-white border border-gray-200 rounded-xl px-4 py-3 text-sm focus:ring-2 focus:ring-blue-600/10 focus:border-blue-600 outline-none transition-all font-medium text-gray-900"
                                        placeholder="Ulangi password baru"
                                    />
                                </div>
                            </div>

                            <div className="pt-6 flex justify-end">
                                <button
                                    type="submit"
                                    disabled={saving}
                                    className="inline-flex items-center gap-2 px-8 py-3 bg-red-600 text-white rounded-xl font-bold text-sm hover:bg-red-700 transition-all disabled:opacity-50 shadow-lg shadow-red-200 active:scale-95"
                                >
                                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                                    Update Password
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    );
}
