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
        <div style={{
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative',
            overflow: 'hidden',
            background: 'linear-gradient(135deg, #f0f4ff 0%, #e8eeff 40%, #f5f0ff 100%)'
        }}>
            {/* Decorative blobs */}
            <div style={{
                position: 'absolute', top: '-80px', left: '-80px',
                width: '360px', height: '360px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
                animation: 'pulse 6s ease-in-out infinite'
            }} />
            <div style={{
                position: 'absolute', bottom: '-100px', right: '-60px',
                width: '400px', height: '400px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(167,139,250,0.10) 0%, transparent 70%)',
                animation: 'pulse 8s ease-in-out infinite 2s'
            }} />
            <div style={{
                position: 'absolute', top: '40%', right: '15%',
                width: '200px', height: '200px', borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(99,102,241,0.07) 0%, transparent 70%)',
                animation: 'pulse 7s ease-in-out infinite 1s'
            }} />

            {/* Card */}
            <div className="animate-fade-in" style={{
                width: '100%', maxWidth: '400px',
                margin: '0 16px',
                position: 'relative', zIndex: 10
            }}>
                <div style={{
                    background: 'rgba(255,255,255,0.85)',
                    backdropFilter: 'blur(20px)',
                    WebkitBackdropFilter: 'blur(20px)',
                    borderRadius: '24px',
                    border: '1px solid rgba(255,255,255,0.9)',
                    boxShadow: '0 20px 60px rgba(99,102,241,0.08), 0 4px 16px rgba(0,0,0,0.06)',
                    padding: '40px 36px'
                }}>
                    {/* Header */}
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{
                            width: '56px', height: '56px', borderRadius: '16px',
                            background: 'linear-gradient(135deg, #6366f1, #818cf8)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            margin: '0 auto 16px',
                            boxShadow: '0 8px 24px rgba(99,102,241,0.3)',
                        }}>
                            <span style={{ fontSize: '24px', fontWeight: 900, color: '#fff', fontStyle: 'italic' }}>A</span>
                        </div>
                        <h1 style={{
                            fontSize: '26px', fontWeight: 800, margin: '0 0 0px',
                            background: 'linear-gradient(135deg, #4f46e5, #6366f1)',
                            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                            backgroundClip: 'text', letterSpacing: '-0.5px'
                        }}>
                            ATKIS
                        </h1>
                        <h2 style={{ fontSize: '16px', margin: '0 0 0px', fontWeight: 800 }}>
                            ATK Information System
                        </h2>
                        <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0, fontWeight: 400 }}>
                            Silakan masuk ke akun Anda
                        </p>
                    </div>

                    {/* Error */}
                    {error && (
                        <div className="animate-fade-in" style={{
                            marginBottom: '20px', padding: '12px 16px', borderRadius: '10px',
                            background: 'var(--danger-light)', border: '1px solid var(--danger-border)',
                            color: 'var(--danger)', fontSize: '13px', fontWeight: 500, textAlign: 'center'
                        }}>
                            {error}
                        </div>
                    )}

                    {/* Form */}
                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                        {/* Email */}
                        <div>
                            <label htmlFor="email" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '7px' }}>
                                Email
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Mail style={{
                                    position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
                                    width: '16px', height: '16px', color: 'var(--text-muted)', pointerEvents: 'none'
                                }} />
                                <input
                                    id="email"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required
                                    placeholder="admin@example.com"
                                    style={{
                                        width: '100%', paddingLeft: '40px', paddingRight: '14px',
                                        paddingTop: '10px', paddingBottom: '10px',
                                        fontSize: '13.5px', borderRadius: '10px',
                                        border: '1.5px solid var(--border)', background: 'var(--surface)',
                                        color: 'var(--text-primary)', outline: 'none',
                                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                                    }}
                                    onFocus={e => {
                                        e.currentTarget.style.borderColor = 'var(--primary)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                                    }}
                                    onBlur={e => {
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                            </div>
                        </div>

                        {/* Password */}
                        <div>
                            <label htmlFor="password" style={{ display: 'block', fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '7px' }}>
                                Password
                            </label>
                            <div style={{ position: 'relative' }}>
                                <Lock style={{
                                    position: 'absolute', left: '13px', top: '50%', transform: 'translateY(-50%)',
                                    width: '16px', height: '16px', color: 'var(--text-muted)', pointerEvents: 'none'
                                }} />
                                <input
                                    id="password"
                                    type={showPassword ? 'text' : 'password'}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    placeholder="••••••••"
                                    style={{
                                        width: '100%', paddingLeft: '40px', paddingRight: '44px',
                                        paddingTop: '10px', paddingBottom: '10px',
                                        fontSize: '13.5px', borderRadius: '10px',
                                        border: '1.5px solid var(--border)', background: 'var(--surface)',
                                        color: 'var(--text-primary)', outline: 'none',
                                        transition: 'border-color 0.2s ease, box-shadow 0.2s ease'
                                    }}
                                    onFocus={e => {
                                        e.currentTarget.style.borderColor = 'var(--primary)';
                                        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                                    }}
                                    onBlur={e => {
                                        e.currentTarget.style.borderColor = 'var(--border)';
                                        e.currentTarget.style.boxShadow = 'none';
                                    }}
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    style={{
                                        position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                                        background: 'none', border: 'none', cursor: 'pointer',
                                        color: 'var(--text-muted)', padding: '2px',
                                        display: 'flex', alignItems: 'center'
                                    }}
                                >
                                    {showPassword ? <EyeOff style={{ width: '16px', height: '16px' }} /> : <Eye style={{ width: '16px', height: '16px' }} />}
                                </button>
                            </div>
                        </div>

                        {/* Remember & Forgot */}
                        {/* <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                                <input
                                    type="checkbox"
                                    style={{
                                        width: '15px', height: '15px',
                                        accentColor: 'var(--primary)', cursor: 'pointer'
                                    }}
                                />
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>Ingat saya</span>
                            </label>
                            <a href="#" style={{ fontSize: '13px', color: 'var(--primary)', fontWeight: 500, textDecoration: 'none' }}
                                onMouseEnter={e => (e.currentTarget.style.textDecoration = 'underline')}
                                onMouseLeave={e => (e.currentTarget.style.textDecoration = 'none')}
                            >
                                Lupa password?
                            </a>
                        </div> */}

                        {/* Submit */}
                        <button
                            type="submit"
                            disabled={isLoading}
                            style={{
                                width: '100%', padding: '11px',
                                background: isLoading ? '#a5b4fc' : 'linear-gradient(135deg, #6366f1, #4f46e5)',
                                color: '#fff', fontWeight: 600, fontSize: '14px',
                                borderRadius: '10px', border: 'none', cursor: isLoading ? 'not-allowed' : 'pointer',
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                                boxShadow: isLoading ? 'none' : '0 4px 14px rgba(99,102,241,0.3)',
                                transition: 'all 0.2s ease',
                                marginTop: '12px',
                                marginBottom: '12px'
                            }}
                            onMouseEnter={e => {
                                if (!isLoading) {
                                    (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                                    (e.currentTarget as HTMLElement).style.boxShadow = '0 6px 20px rgba(99,102,241,0.4)';
                                }
                            }}
                            onMouseLeave={e => {
                                (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                (e.currentTarget as HTMLElement).style.boxShadow = '0 4px 14px rgba(99,102,241,0.3)';
                            }}
                        >
                            {isLoading ? (
                                <>
                                    <Loader2 style={{ width: '16px', height: '16px', animation: 'spin 1s linear infinite' }} />
                                    Memproses...
                                </>
                            ) : (
                                'Login'
                            )}
                        </button>
                    </form>

                    {/* Demo Credentials */}
                    {/* <div style={{ marginTop: '24px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
                        <p style={{ fontSize: '11px', fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                            Demo Credentials
                        </p>
                        <div style={{
                            background: 'var(--primary-light)', borderRadius: '10px',
                            padding: '12px 16px', fontSize: '12.5px', textAlign: 'center',
                            color: 'var(--text-secondary)', lineHeight: 1.8,
                            border: '1px solid var(--primary-border)'
                        }}>
                            <p style={{ margin: 0 }}>Email: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>admin@example.com</span></p>
                            <p style={{ margin: 0 }}>Password: <span style={{ color: 'var(--primary)', fontWeight: 600 }}>password123</span></p>
                        </div>
                    </div> */}
                </div>

                {/* Footer note */}
                <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(99,102,241,0.5)', marginTop: '20px', fontWeight: 500 }}>
                    © {new Date().getFullYear()} ATKIS. All rights reserved.
                </p>
            </div>

            <style>{`
              @keyframes pulse {
                0%, 100% { transform: scale(1); opacity: 1; }
                50% { transform: scale(1.05); opacity: 0.8; }
              }
              @keyframes spin {
                to { transform: rotate(360deg); }
              }
            `}</style>
        </div>
    );
}
