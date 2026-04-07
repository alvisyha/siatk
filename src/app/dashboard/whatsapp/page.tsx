'use client';

import { useState } from 'react';
import { sendWA } from '@/lib/whatsapp';
import { MessageSquare, Send, Phone, FileText, AlertCircle, CheckCircle2, Loader2, Info } from 'lucide-react';

export default function WhatsAppPage() {
    const [target, setTarget] = useState('');
    const [message, setMessage] = useState('');
    const [loading, setLoading] = useState(false);
    const [status, setStatus] = useState<{ type: 'success' | 'error' | 'none'; message: string }>({
        type: 'none',
        message: ''
    });

    const handleSend = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!target || !message) {
            setStatus({ type: 'error', message: 'Nomor tujuan dan pesan tidak boleh kosong' });
            return;
        }

        setLoading(true);
        setStatus({ type: 'none', message: '' });

        try {
            await sendWA(target, message);
            setStatus({ 
                type: 'success', 
                message: 'Permintaan pengiriman pesan WhatsApp berhasil dikirim ke server Fonnte!' 
            });
            setMessage('');
        } catch (error: any) {
            console.error('Test WA Error:', error);
            setStatus({ 
                type: 'error', 
                message: error.message || 'Gagal mengirim pesan. Pastikan FONNTE_TOKEN sudah benar di .env.local' 
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ marginBottom: '24px' }}>
                <h1 style={{ fontSize: '24px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '8px' }}>
                    WhatsApp Integration (Fonnte)
                </h1>
                <p style={{ color: 'var(--text-muted)', fontSize: '14px' }}>
                    Gunakan halaman ini untuk menguji integrasi WhatsApp API menggunakan Fonnte.
                </p>
            </div>

            <div style={{ 
                background: 'var(--surface)', 
                borderRadius: '16px', 
                border: '1px solid var(--border)', 
                padding: '24px', 
                boxShadow: 'var(--shadow-sm)' 
            }}>
                <div style={{ display: 'flex', gap: '16px', marginBottom: '24px', padding: '16px', background: 'rgba(99, 102, 241, 0.05)', borderRadius: '12px', border: '1px solid rgba(99, 102, 241, 0.1)' }}>
                    <Info style={{ color: 'var(--primary)', width: '20px', height: '20px', flexShrink: 0 }} />
                    <div style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                        <p style={{ fontWeight: 600, color: 'var(--primary)', marginBottom: '4px' }}>Petunjuk:</p>
                        <ul style={{ paddingLeft: '20px', margin: 0 }}>
                            <li>Pastikan <code>FONNTE_TOKEN</code> sudah diatur di environment variables Vercel atau file <code>.env.local</code>.</li>
                            <li>Format nomor: <code>08123456789</code> atau <code>628123456789</code>.</li>
                            <li>Pastikan perangkat WhatsApp di dashboard Fonnte dalam status <strong>Connect</strong>.</li>
                        </ul>
                    </div>
                </div>

                <form onSubmit={handleSend} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Phone style={{ width: '16px', height: '16px' }} />
                            Nomor WhatsApp Tujuan
                        </label>
                        <input
                            type="text"
                            placeholder="Contoh: 081234567890"
                            value={target}
                            onChange={(e) => setTarget(e.target.value)}
                            style={{
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        />
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <label style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-primary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <FileText style={{ width: '16px', height: '16px' }} />
                            Isi Pesan
                        </label>
                        <textarea
                            placeholder="Ketik pesan di sini..."
                            rows={4}
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            style={{
                                padding: '12px 16px',
                                borderRadius: '10px',
                                border: '1px solid var(--border)',
                                background: 'var(--bg)',
                                color: 'var(--text-primary)',
                                outline: 'none',
                                transition: 'border-color 0.2s',
                                resize: 'vertical',
                                minHeight: '100px'
                            }}
                            onFocus={(e) => e.target.style.borderColor = 'var(--primary)'}
                            onBlur={(e) => e.target.style.borderColor = 'var(--border)'}
                        />
                    </div>

                    {status.type !== 'none' && (
                        <div style={{ 
                            padding: '12px 16px', 
                            borderRadius: '10px', 
                            display: 'flex', 
                            alignItems: 'center', 
                            gap: '10px',
                            fontSize: '14px',
                            background: status.type === 'success' ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
                            color: status.type === 'success' ? 'var(--success)' : 'var(--danger)',
                            border: `1px solid ${status.type === 'success' ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'}`
                        }}>
                            {status.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertCircle className="w-5 h-5" />}
                            {status.message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            padding: '12px',
                            borderRadius: '10px',
                            background: 'var(--primary)',
                            color: 'white',
                            fontWeight: 600,
                            border: 'none',
                            cursor: loading ? 'not-allowed' : 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            gap: '8px',
                            transition: 'opacity 0.2s',
                            opacity: loading ? 0.7 : 1,
                            marginTop: '8px'
                        }}
                    >
                        {loading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                            <Send className="w-5 h-5" />
                        )}
                        {loading ? 'Mengirim...' : 'Kirim Pesan Sekarang'}
                    </button>
                </form>
            </div>
            
            <div style={{ marginTop: '24px', padding: '20px', background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '12px', color: 'var(--text-primary)' }}>Cara Menggunakan di Kode:</h3>
                <div style={{ background: '#1e1e1e', padding: '16px', borderRadius: '8px', overflowX: 'auto' }}>
                    <code style={{ color: '#d4d4d4', fontSize: '13px', whiteSpace: 'pre' }}>
{`import { sendWA } from '@/lib/whatsapp';

// Di dalam fungsi asinkron (Server Action atau Client Side)
const handleNotifikasi = async () => {
  await sendWA('08123456789', 'Halo, stok barang X sudah menipis!');
};`}
                    </code>
                </div>
            </div>
        </div>
    );
}
