'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Mail, Lock, Eye, EyeOff, Loader2 } from 'lucide-react';

export default function LoginPage() {
    const router = useRouter();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsLoading(true);

        try {
            const res = await fetch('/api/auth/login', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email, password })
            });

            const data = await res.json();

            if (!res.ok) {
                setError(data.error || 'Login gagal');
                return;
            }

            router.push('/dashboard');
            router.refresh();
        } catch (err) {
            setError('Terjadi kesalahan. Silakan coba lagi.');
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-blue-100 to-blue-200 relative overflow-hidden">
            {/* Background Decorative Elements */}
            <div className="absolute top-0 left-0 w-96 h-96 bg-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse transition-all duration-1000"></div>
            <div className="absolute top-0 right-0 w-96 h-96 bg-blue-200 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse transition-all duration-1000 delay-300"></div>
            <div className="absolute -bottom-8 left-20 w-96 h-96 bg-blue-400 rounded-full mix-blend-multiply filter blur-3xl opacity-30 animate-pulse transition-all duration-1000 delay-700"></div>

            {/* Login Card */}
            <div className="w-full max-w-sm mx-4 relative z-10">
                <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-white p-8 transition-all hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)]">
                    {/* Header */}
                    <div className="text-center mb-8">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-tr from-blue-600 to-blue-400 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30 mb-6 transform rotate-3 hover:rotate-0 transition-transform duration-300">
                            <span className="text-3xl font-bold text-white tracking-wider">A</span>
                        </div>
                        <h1 className="text-3xl font-extrabold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500 mb-2">
                            ATKIS
                        </h1>
                        <p className="text-sm text-gray-500 font-medium">Silakan masuk ke akun Anda</p>
                    </div>

                    {/* Error Alert */}
                    {error && (
                        <div className="mb-6 p-4 rounded-xl bg-red-50/80 backdrop-blur-sm border border-red-100 text-red-600 text-sm font-medium flex items-center">
                            <span className="w-full text-center">{error}</span>
                        </div>
                    )}

                    {/* Login Form */}
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {/* Email Field */}
                        <div className="space-y-1.5">
                            <label htmlFor="email" className="block text-sm font-semibold text-gray-700">
                                Email
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                    <Mail className="w-5 h-5" />
                                </div>
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    className="w-full pl-11 pr-4 py-2.5 text-sm bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                    placeholder="admin@example.com"
                                    required
                                />
                            </div>
                        </div>

                        {/* Password Field */}
                        <div className="space-y-1.5">
                            <label htmlFor="password" className="block text-sm font-semibold text-gray-700">
                                Password
                            </label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-500 transition-colors">
                                    <Lock className="w-5 h-5" />
                                </div>
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    className="w-full pl-11 pr-11 py-2.5 text-sm bg-white/50 border border-gray-200 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 transition-all shadow-sm"
                                    placeholder="••••••••"
                                    required
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-gray-400 hover:text-blue-500 transition-colors"
                                >
                                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                </button>
                            </div>
                        </div>

                        {/* Remember & Forgot */}
                        <div className="flex items-center justify-between text-sm mt-2">
                            <label className="flex items-center gap-2.5 text-gray-600 cursor-pointer group">
                                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 focus:ring-offset-0 transition-colors cursor-pointer" />
                                <span className="group-hover:text-gray-900 transition-colors">Ingat saya</span>
                            </label>
                            <a href="#" className="font-medium text-blue-600 hover:text-blue-700 transition-colors">
                                Lupa password?
                            </a>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            className="w-full py-3 px-4 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-700 hover:to-blue-600 text-white text-sm font-semibold rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all shadow-lg shadow-blue-500/30 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transform hover:-translate-y-0.5 active:translate-y-0"
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Memproses...
                                </>
                            ) : (
                                'Masuk ke Dashboard'
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    <div className="mt-8 pt-5 border-t border-gray-100/80">
                        <p className="text-xs font-semibold text-gray-400 text-center mb-3 uppercase tracking-wider">Demo Credentials</p>
                        <div className="bg-blue-50/50 rounded-lg p-3 text-xs text-center text-gray-600 space-y-1 font-medium border border-blue-100/50">
                            <p>Email: <span className="text-blue-700">admin@example.com</span></p>
                            <p>Password: <span className="text-blue-700">password123</span></p>
                        </div>
                    </div>
                </div>

                {/* Footer */}
                <p className="text-center text-blue-900/40 text-xs mt-8 font-medium">
                    © {new Date().getFullYear()} ATKIS. All rights reserved.
                </p>
            </div>
        </div>
    );
}
