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
    Building2,
    KeyRound,
    Phone
} from 'lucide-react';

// Consistent input style helper
const inputStyle: React.CSSProperties = {
    width: '100%',
    padding: '10px 14px',
    fontSize: '13.5px',
    borderRadius: '10px',
    border: '1.5px solid var(--border)',
    background: 'var(--surface)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border-color 0.2s ease, box-shadow 0.2s ease',
    fontFamily: 'inherit'
};

const inputWithIconStyle: React.CSSProperties = {
    ...inputStyle,
    paddingLeft: '40px'
};

const readOnlyStyle: React.CSSProperties = {
    ...inputWithIconStyle,
    background: 'var(--bg)',
    color: 'var(--text-muted)',
    cursor: 'not-allowed'
};

function FormField({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <label style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>
                {label}
            </label>
            {children}
        </div>
    );
}

function InputWithIcon({ icon: Icon, ...props }: { icon: any } & React.InputHTMLAttributes<HTMLInputElement> & { readOnlyField?: boolean }) {
    const { readOnlyField, ...inputProps } = props as any;
    return (
        <div style={{ position: 'relative' }}>
            <Icon style={{
                position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)',
                width: '15px', height: '15px', color: 'var(--text-muted)', pointerEvents: 'none'
            }} />
            <input
                {...inputProps}
                style={readOnlyField ? readOnlyStyle : inputWithIconStyle}
                onFocus={!readOnlyField ? (e => {
                    e.currentTarget.style.borderColor = 'var(--primary)';
                    e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
                }) : undefined}
                onBlur={!readOnlyField ? (e => {
                    e.currentTarget.style.borderColor = 'var(--border)';
                    e.currentTarget.style.boxShadow = 'none';
                }) : undefined}
            />
        </div>
    );
}

function PasswordInput({ value, onChange, placeholder }: { value: string; onChange: (v: string) => void; placeholder?: string }) {
    return (
        <input
            type="password"
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder || '••••••••'}
            style={inputStyle}
            onFocus={e => {
                e.currentTarget.style.borderColor = 'var(--primary)';
                e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
            }}
            onBlur={e => {
                e.currentTarget.style.borderColor = 'var(--border)';
                e.currentTarget.style.boxShadow = 'none';
            }}
        />
    );
}

export default function SettingsPage() {
    const [user, setUser] = useState<any>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
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
                setPhone(data.user.phone || '');
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        } finally {
            setLoading(false);
        }
    };

    const showMessage = (type: 'success' | 'error', text: string) => {
        setMessage({ type, text });
        setTimeout(() => setMessage(null), 4000);
    };

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name, email, phone })
            });
            if (res.ok) {
                showMessage('success', 'Profil berhasil diperbarui!');
            } else {
                const data = await res.json();
                showMessage('error', data.error || 'Gagal memperbarui profil');
            }
        } catch {
            showMessage('error', 'Terjadi kesalahan koneksi');
        } finally {
            setSaving(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) {
            showMessage('error', 'Password baru dan konfirmasi tidak cocok!');
            return;
        }
        setSaving(true);
        try {
            const res = await fetch(`/api/users/${user.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ password: newPassword })
            });
            if (res.ok) {
                showMessage('success', 'Password berhasil diubah!');
                setCurrentPassword('');
                setNewPassword('');
                setConfirmPassword('');
            } else {
                const data = await res.json();
                showMessage('error', data.error || 'Gagal mengubah password');
            }
        } catch {
            showMessage('error', 'Terjadi kesalahan koneksi');
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '60vh' }}>
                <Loader2 style={{ width: '28px', height: '28px', color: 'var(--primary)', animation: 'spin 1s linear infinite' }} />
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
            </div>
        );
    }

    return (
        <div className="animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '28px', maxWidth: '900px' }}>

            {/* Page Header */}
            <div style={{ paddingBottom: '20px', borderBottom: '1px solid var(--border)' }}>
                <h1 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 4px', letterSpacing: '-0.3px' }}>
                    Setting Akun
                </h1>
                <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', margin: 0 }}>
                    Kelola informasi profil dan keamanan akun Anda di sini.
                </p>
            </div>

            {/* Toast Message */}
            {message && (
                <div className="animate-fade-in" style={{
                    display: 'flex', alignItems: 'center', gap: '10px',
                    padding: '13px 16px', borderRadius: '10px',
                    background: message.type === 'success' ? 'var(--success-light)' : 'var(--danger-light)',
                    border: `1px solid ${message.type === 'success' ? '#a7f3d0' : 'var(--danger-border)'}`,
                    color: message.type === 'success' ? 'var(--success)' : 'var(--danger)',
                    fontSize: '13.5px', fontWeight: 500
                }}>
                    {message.type === 'success'
                        ? <CheckCircle2 style={{ width: '17px', height: '17px', flexShrink: 0 }} />
                        : <AlertCircle style={{ width: '17px', height: '17px', flexShrink: 0 }} />
                    }
                    {message.text}
                </div>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', alignItems: 'start' }} className="settings-grid">

                {/* Profile Card */}
                <div style={{
                    background: 'var(--surface)', borderRadius: '14px',
                    border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '9px',
                            background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <User style={{ width: '15px', height: '15px', color: 'var(--primary)' }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Informasi Profil</h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Perbarui nama dan email Anda</p>
                        </div>
                    </div>
                    <form onSubmit={handleUpdateProfile} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <FormField label="Nama Lengkap">
                            <InputWithIcon
                                icon={User}
                                type="text"
                                value={name}
                                onChange={(e: any) => setName(e.target.value)}
                                placeholder="Masukkan nama lengkap"
                            />
                        </FormField>
                        <FormField label="Alamat Email">
                            <InputWithIcon
                                icon={Mail}
                                type="email"
                                value={email}
                                onChange={(e: any) => setEmail(e.target.value)}
                                placeholder="nama@email.com"
                            />
                        </FormField>
                        <FormField label="Nomor WhatsApp (HP)">
                            <InputWithIcon
                                icon={Phone}
                                type="text"
                                value={phone}
                                onChange={(e: any) => setPhone(e.target.value)}
                                placeholder="Contoh: 08123456789"
                            />
                        </FormField>
                        <FormField label="Sub Bagian">
                            <InputWithIcon
                                icon={Building2}
                                type="text"
                                value={user?.sub_bagian?.nama || '-'}
                                readOnly
                                readOnlyField
                            />
                        </FormField>
                        <div style={{ paddingTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                                    padding: '9px 22px', borderRadius: '10px',
                                    background: saving ? '#a5b4fc' : 'var(--primary)',
                                    color: '#fff', fontSize: '13px', fontWeight: 600,
                                    border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                                    boxShadow: saving ? 'none' : '0 4px 12px rgba(99,102,241,0.25)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => {
                                    if (!saving) {
                                        (e.currentTarget as HTMLElement).style.background = 'var(--primary-hover)';
                                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!saving) {
                                        (e.currentTarget as HTMLElement).style.background = 'var(--primary)';
                                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                {saving ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <Save style={{ width: '14px', height: '14px' }} />}
                                Simpan Profil
                            </button>
                        </div>
                    </form>
                </div>

                {/* Password Card */}
                <div style={{
                    background: 'var(--surface)', borderRadius: '14px',
                    border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)',
                    overflow: 'hidden'
                }}>
                    <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                            width: '32px', height: '32px', borderRadius: '9px',
                            background: 'var(--danger-light)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                        }}>
                            <KeyRound style={{ width: '15px', height: '15px', color: 'var(--danger)' }} />
                        </div>
                        <div>
                            <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Ubah Password</h2>
                            <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: 0 }}>Pastikan akun Anda tetap aman</p>
                        </div>
                    </div>
                    <form onSubmit={handleChangePassword} style={{ padding: '22px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                        <FormField label="Password Saat Ini">
                            <PasswordInput value={currentPassword} onChange={setCurrentPassword} />
                        </FormField>
                        <FormField label="Password Baru">
                            <PasswordInput value={newPassword} onChange={setNewPassword} placeholder="Minimal 6 karakter" />
                        </FormField>
                        <FormField label="Konfirmasi Password">
                            <PasswordInput value={confirmPassword} onChange={setConfirmPassword} placeholder="Ulangi password baru" />
                        </FormField>
                        <div style={{ paddingTop: '4px', display: 'flex', justifyContent: 'flex-end' }}>
                            <button
                                type="submit"
                                disabled={saving}
                                style={{
                                    display: 'inline-flex', alignItems: 'center', gap: '7px',
                                    padding: '9px 22px', borderRadius: '10px',
                                    background: saving ? '#fca5a5' : 'var(--danger)',
                                    color: '#fff', fontSize: '13px', fontWeight: 600,
                                    border: 'none', cursor: saving ? 'not-allowed' : 'pointer',
                                    boxShadow: saving ? 'none' : '0 4px 12px rgba(220,38,38,0.2)',
                                    transition: 'all 0.2s ease'
                                }}
                                onMouseEnter={e => {
                                    if (!saving) {
                                        (e.currentTarget as HTMLElement).style.background = '#b91c1c';
                                        (e.currentTarget as HTMLElement).style.transform = 'translateY(-1px)';
                                    }
                                }}
                                onMouseLeave={e => {
                                    if (!saving) {
                                        (e.currentTarget as HTMLElement).style.background = 'var(--danger)';
                                        (e.currentTarget as HTMLElement).style.transform = 'translateY(0)';
                                    }
                                }}
                            >
                                {saving ? <Loader2 style={{ width: '14px', height: '14px', animation: 'spin 1s linear infinite' }} /> : <Lock style={{ width: '14px', height: '14px' }} />}
                                Update Password
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <style>{`
              @keyframes spin { to { transform: rotate(360deg); } }
              @media (max-width: 680px) {
                .settings-grid { grid-template-columns: 1fr !important; }
              }
            `}</style>
        </div>
    );
}
