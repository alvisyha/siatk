'use client';

import React, { useState, useEffect, useCallback } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Search, Plus, X, Loader2, ClipboardList, AlertCircle, Info,
    CheckCircle2, XCircle, Clock, Filter, Calendar, ChevronDown,
    ChevronRight, Trash2, PackagePlus
} from 'lucide-react';
import SearchableSelect from '@/components/SearchableSelect';

// ─── Types ────────────────────────────────────────────────────────────────────

interface Barang {
    id: string;
    nama: string;
    kode: string | null;
    stok?: number;
    satuan_id?: string;
    satuan?: { id: string; nama: string } | null;
    status?: boolean;
}

interface SubBagian {
    id: string;
    nama: string;
}

interface PengajuanItem {
    id: string;
    pengajuan_id: string;
    barang_id: string;
    jumlah: number;
    satuan_id: string | null;
    status: 'pending' | 'disetujui' | 'ditolak';
    alasan_penolakan?: string | null;
    barang?: { id: string; nama: string; kode: string | null; stok?: number; satuan_id?: string } | null;
    satuan?: { id: string; nama: string } | null;
}

interface Pengajuan {
    id: string;
    user_id: string;
    sub_bagian_id: string | null;
    tanggal: string;
    pemohon: string | null;
    keterangan: string | null;
    created_at: string;
    pengajuan_items: PengajuanItem[];
    sub_bagian?: { id: string; nama: string } | null;
}

// Item sementara di form (sebelum submit)
interface FormItem {
    barang_id: string;
    jumlah: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOverallStatus(items: PengajuanItem[]): 'pending' | 'disetujui' | 'ditolak' | 'sebagian' {
    if (!items || items.length === 0) return 'pending';
    const allDisetujui = items.every(i => i.status === 'disetujui');
    const allDitolak = items.every(i => i.status === 'ditolak');
    const anyPending = items.some(i => i.status === 'pending');
    if (allDisetujui) return 'disetujui';
    if (allDitolak) return 'ditolak';
    if (anyPending) return 'pending';
    return 'sebagian';
}

function StatusBadge({ status }: { status: string }) {
    const cfg: Record<string, { cls: string; icon: React.ReactNode; label: string }> = {
        pending:   { cls: 'bg-amber-100 text-amber-700',   icon: <Clock className="w-3 h-3" />,         label: 'Pending' },
        disetujui: { cls: 'bg-emerald-100 text-emerald-700', icon: <CheckCircle2 className="w-3 h-3" />, label: 'Disetujui' },
        ditolak:   { cls: 'bg-red-100 text-red-700',       icon: <XCircle className="w-3 h-3" />,       label: 'Ditolak' },
        sebagian:  { cls: 'bg-blue-100 text-blue-700',     icon: <Info className="w-3 h-3" />,           label: 'Sebagian' },
    };
    const c = cfg[status] || cfg.pending;
    return (
        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider ${c.cls}`}>
            {c.icon}{c.label}
        </span>
    );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function PermintaanBarangPage() {
    const [list, setList] = useState<Pengajuan[]>([]);
    const [barangList, setBarangList] = useState<Barang[]>([]);
    const [subBagianList, setSubBagianList] = useState<SubBagian[]>([]);
    // pendingMap: { [barang_id]: total_pending } dari SEMUA user (bukan hanya user ini)
    const [pendingMap, setPendingMap] = useState<Record<string, number>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [userRole, setUserRole] = useState<string>('user');
    const [userData, setUserData] = useState<any>(null);

    // Table state
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('semua');
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Form state
    const [formHeader, setFormHeader] = useState({
        pemohon: '',
        sub_bagian_id: '',
        tanggal: new Date().toISOString().split('T')[0],
        keterangan: ''
    });
    const [formItems, setFormItems] = useState<FormItem[]>([{ barang_id: '', jumlah: '' }]);

    // ── Fetch ──────────────────────────────────────────────────────────────

    const fetchAll = useCallback(async () => {
        setIsLoading(true);
        try {
            const [resPg, resBarang, resSubBagian, resPending] = await Promise.all([
                fetch('/api/pengajuan'),
                fetch('/api/barang'),
                fetch('/api/sub-bagian'),
                fetch('/api/barang/pending-stats')   // total pending SEMUA user
            ]);

            if (resPg.ok) {
                const d = await resPg.json();
                setList(d.data || []);
            }
            if (resBarang.ok) {
                const d = await resBarang.json();
                setBarangList(d.data || []);
            }
            if (resSubBagian.ok) {
                const d = await resSubBagian.json();
                setSubBagianList(d.data || []);
            }
            if (resPending.ok) {
                const d = await resPending.json();
                setPendingMap(d.data || {});   // { barang_id: total_pending }
            }
        } catch (e) {
            console.error('fetchAll error:', e);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const fetchUserProfile = useCallback(async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const d = await res.json();
                const u = d.user;
                setUserRole(u.role || 'user');
                setUserData(u);
                if (u.role === 'user') {
                    setFormHeader(prev => ({
                        ...prev,
                        pemohon: u.name || '',
                        sub_bagian_id: u.sub_bagian_id || ''
                    }));
                }
            }
        } catch (e) {
            console.error('fetchUserProfile error:', e);
        }
    }, []);

    useEffect(() => {
        fetchAll();
        fetchUserProfile();
    }, [fetchAll, fetchUserProfile]);

    // ── Form Item Management ───────────────────────────────────────────────

    const addItem = () => setFormItems(prev => [...prev, { barang_id: '', jumlah: '' }]);

    const removeItem = (index: number) =>
        setFormItems(prev => prev.filter((_, i) => i !== index));

    const updateItem = (index: number, field: keyof FormItem, value: string) =>
        setFormItems(prev => prev.map((item, i) => i === index ? { ...item, [field]: value } : item));

    // ── Compute stock breakdown per barang in form ────────────────────────
    // Menggunakan pendingMap dari /api/barang/pending-stats
    // sehingga pending User lain JUGA terlihat (bukan hanya milik user ini)

    const getStockInfo = (barang_id: string) => {
        const barang = barangList.find(b => b.id === barang_id);
        if (!barang) return { stok: 0, pending: 0, available: 0 };

        const stok = barang.stok || 0;
        const pending = pendingMap[barang_id] || 0;   // ← dari semua user
        return { stok, pending, available: Math.max(0, stok - pending) };
    };

    // Compatibility alias
    const getAvailableStock = (barang_id: string) => getStockInfo(barang_id).available;

    // ── Submit ─────────────────────────────────────────────────────────────

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        // Build enriched items with satuan_id from barang
        const enrichedItems = formItems.map(it => {
            const b = barangList.find(x => x.id === it.barang_id);
            return {
                barang_id: it.barang_id,
                jumlah: parseInt(it.jumlah),
                satuan_id: b?.satuan_id || null,
                nama_barang: b?.nama || ''
            };
        });

        try {
            const res = await fetch('/api/pengajuan', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ...formHeader, items: enrichedItems })
            });

            if (res.ok) {
                await fetchAll();
                setIsModalOpen(false);
                resetForm();
            } else {
                const err = await res.json();
                alert(`Gagal: ${err.error}`);
            }
        } catch (e) {
            console.error('handleSave error:', e);
        } finally {
            setIsSaving(false);
        }
    };

    const resetForm = () => {
        setFormHeader({
            pemohon: userData?.name || '',
            sub_bagian_id: userData?.sub_bagian_id || '',
            tanggal: new Date().toISOString().split('T')[0],
            keterangan: ''
        });
        setFormItems([{ barang_id: '', jumlah: '' }]);
    };

    // ── Update item status (approve/tolak per item) ────────────────────────

    const handleItemStatus = async (itemId: string, status: 'disetujui' | 'ditolak') => {
        let alasan_penolakan = null;
        if (status === 'ditolak') {
            let targetItem;
            for (const pg of list) {
                const found = pg.pengajuan_items?.find(i => i.id === itemId);
                if (found) { targetItem = found; break; }
            }
            
            if (targetItem) {
                const stok = targetItem.barang?.stok || 0;
                if (stok === 0) {
                    alasan_penolakan = 'Stok fisik saat ini kosong atau habis.';
                } else if (stok < targetItem.jumlah) {
                    alasan_penolakan = `Stok tidak memadai (tersedia ${stok} ${targetItem.satuan?.nama || ''}).`;
                } else {
                    alasan_penolakan = 'Pengajuan ditolak oleh Admin.';
                }
            } else {
                alasan_penolakan = 'Pengajuan ditolak oleh Admin.';
            }
        }

        setIsSaving(true);
        try {
            const res = await fetch(`/api/pengajuan/${itemId}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status, alasan_penolakan })
            });

            if (res.ok) {
                await fetchAll();
            } else {
                const err = await res.json();
                alert(`Gagal: ${err.error}`);
            }
        } catch (e) {
            console.error('handleItemStatus error:', e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelItem = async (itemId: string) => {
        if (!confirm('Apakah Anda yakin ingin membatalkan dan menghapus permintaan barang ini?')) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/pengajuan/${itemId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                await fetchAll();
            } else {
                const err = await res.json();
                alert(`Gagal: ${err.error}`);
            }
        } catch (e) {
            console.error('handleCancelItem error:', e);
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancelPengajuan = async (pengajuanId: string, e: React.MouseEvent) => {
        e.stopPropagation();
        if (!confirm('Apakah Anda yakin ingin membatalkan dan menghapus seluruh pengajuan ini?')) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/pengajuan/batal-semua/${pengajuanId}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                await fetchAll();
            } else {
                const err = await res.json();
                alert(`Gagal: ${err.error}`);
            }
        } catch (e) {
            console.error('handleCancelPengajuan error:', e);
        } finally {
            setIsSaving(false);
        }
    };

    // ── Filter & Search ────────────────────────────────────────────────────

    const filteredList = list.filter(pg => {
        const overall = getOverallStatus(pg.pengajuan_items || []);
        const matchStatus = statusFilter === 'semua' || overall === statusFilter;

        const lower = searchTerm.toLowerCase();
        const matchSearch =
            pg.pemohon?.toLowerCase().includes(lower) ||
            pg.sub_bagian?.nama?.toLowerCase().includes(lower) ||
            pg.keterangan?.toLowerCase().includes(lower) ||
            (pg.pengajuan_items || []).some(it => it.barang?.nama?.toLowerCase().includes(lower));

        return matchStatus && matchSearch;
    });

    // ── PDF Export ─────────────────────────────────────────────────────────

    const exportToPDF = () => {
        const doc = new jsPDF();
        doc.setFontSize(16);
        doc.text('Laporan Permintaan Barang', 14, 15);
        doc.setFontSize(10);
        doc.text(`Dicetak: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}`, 14, 22);

        const rows: any[] = [];
        filteredList.forEach((pg, pgIdx) => {
            (pg.pengajuan_items || []).forEach((item, itemIdx) => {
                rows.push([
                    itemIdx === 0 ? pgIdx + 1 : '',
                    itemIdx === 0 ? pg.pemohon || '-' : '',
                    itemIdx === 0 ? pg.sub_bagian?.nama || '-' : '',
                    itemIdx === 0 ? new Date(pg.tanggal).toLocaleDateString('id-ID') : '',
                    item.barang?.nama || '-',
                    item.jumlah,
                    item.satuan?.nama || '-',
                    item.status.toUpperCase()
                ]);
            });
        });

        autoTable(doc, {
            head: [['No', 'Pemohon', 'Sub Bagian', 'Tanggal', 'Barang', 'Jumlah', 'Satuan', 'Status']],
            body: rows,
            startY: 28,
            theme: 'grid',
            styles: { fontSize: 7.5 },
            headStyles: { fillColor: [52, 152, 219], textColor: 255 }
        });

        doc.save(`permintaan_barang_${Date.now()}.pdf`);
    };

    // ── Render ─────────────────────────────────────────────────────────────

    const formIsValid = formItems.every(it => {
        if (!it.barang_id || !it.jumlah) return false;
        const qty = parseInt(it.jumlah);
        return qty > 0 && qty <= getAvailableStock(it.barang_id);
    });

    const inputCls = 'w-full px-3 py-2.5 text-sm rounded-lg outline-none';
    const inputStyle = (focused?: boolean) => ({
        border: `1.5px solid ${focused ? 'var(--primary)' : 'var(--border)'}`,
        background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'inherit'
    });
    const onFocus = (e: React.FocusEvent<any>) => {
        e.currentTarget.style.borderColor = 'var(--primary)';
        e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)';
    };
    const onBlur = (e: React.FocusEvent<any>) => {
        e.currentTarget.style.borderColor = 'var(--border)';
        e.currentTarget.style.boxShadow = 'none';
    };

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
                            Permintaan Barang
                        </h1>
                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                            Ajukan dan pantau permintaan Alat Tulis Kantor
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button onClick={exportToPDF} className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg"
                            style={{ background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(239,68,68,0.2)' }}>
                            Export PDF
                        </button>
                        {userRole === 'user' && (
                            <button onClick={() => { setIsModalOpen(true); resetForm(); }}
                                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg"
                                style={{ background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}>
                                <Plus className="w-4 h-4" /> Buat Pengajuan
                            </button>
                        )}
                    </div>
                </div>

                {/* Table Card */}
                <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                    {/* Filter bar */}
                    <div className="p-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                            <div className="relative w-full max-w-sm">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                                <input type="text" placeholder="Cari pemohon, barang, sub bagian..." value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none"
                                    style={{ border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }}
                                    onFocus={onFocus} onBlur={onBlur}
                                />
                            </div>
                            <div className="flex items-center gap-3 w-full md:w-auto">
                                <label className="text-sm font-medium flex items-center gap-2 whitespace-nowrap" style={{ color: 'var(--text-secondary)' }}>
                                    <Filter className="w-4 h-4" /> Filter Status:
                                </label>
                                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                    className="rounded-lg px-3 py-2 text-sm outline-none font-medium"
                                    style={{ background: 'var(--surface)', border: '1.5px solid var(--border)', color: 'var(--text-primary)' }}
                                    onFocus={onFocus} onBlur={onBlur}>
                                    <option value="semua">Semua Status</option>
                                    <option value="pending">⏳ Pending</option>
                                    <option value="sebagian">🔄 Sebagian Diproses</option>
                                    <option value="disetujui">✅ Semua Disetujui</option>
                                    <option value="ditolak">❌ Semua Ditolak</option>
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm min-w-[750px]">
                            <thead style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                                <tr>
                                    {['No', 'Pemohon', 'Sub Bagian', 'Tanggal', 'Items', 'Progress', 'Status'].map(h => (
                                        <th key={h} className="px-4 py-3"
                                            style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                            {h}
                                        </th>
                                    ))}
                                    <th className="px-4 py-3" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                                        Detail
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {isLoading ? (
                                    <tr><td colSpan={8} className="py-14 text-center" style={{ color: 'var(--text-muted)' }}>
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: 'var(--primary)' }} />
                                        <p className="text-sm">Memuat data...</p>
                                    </td></tr>
                                ) : filteredList.length === 0 ? (
                                    <tr><td colSpan={8} className="py-14 text-center" style={{ color: 'var(--text-muted)' }}>
                                        <Info className="w-7 h-7 mx-auto mb-2" />
                                        <p className="text-sm">Belum ada pengajuan permintaan.</p>
                                    </td></tr>
                                ) : filteredList.map((pg, index) => {
                                    const items = pg.pengajuan_items || [];
                                    const overall = getOverallStatus(items);
                                    const approved = items.filter(i => i.status === 'disetujui').length;
                                    const isExpanded = expandedId === pg.id;

                                    return (
                                        <React.Fragment key={pg.id}>
                                            {/* Header row */}
                                            <tr key={pg.id}
                                                className="transition-colors cursor-pointer"
                                                style={{ borderTop: '1px solid var(--border)' }}
                                                onClick={() => setExpandedId(isExpanded ? null : pg.id)}
                                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                                <td className="px-4 py-3.5 text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>{index + 1}</td>
                                                <td className="px-4 py-3.5 font-medium" style={{ color: 'var(--text-primary)' }}>{pg.pemohon || '-'}</td>
                                                <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{pg.sub_bagian?.nama || '-'}</td>
                                                <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>
                                                    {new Date(pg.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <span className="px-2 py-1 rounded-lg text-xs font-bold"
                                                        style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                                        {items.length} barang
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3.5 text-sm font-medium" style={{ color: 'var(--text-secondary)' }}>
                                                    {approved}/{items.length} disetujui
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <StatusBadge status={overall} />
                                                </td>
                                                <td className="px-4 py-3.5">
                                                    <div className="flex items-center gap-2">
                                                        {userRole === 'user' && overall === 'pending' && (
                                                            <button
                                                                title="Batalkan Pengajuan"
                                                                disabled={isSaving}
                                                                onClick={(e) => handleCancelPengajuan(pg.id, e)}
                                                                className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                                                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }}
                                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                            >
                                                                <Trash2 className="w-3.5 h-3.5" /> Batal
                                                            </button>
                                                        )}
                                                        <button className="px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5"
                                                            style={{ background: 'var(--bg)', border: '1px solid var(--border)', color: 'var(--text-secondary)', cursor: 'pointer' }}
                                                            onMouseEnter={e => { e.currentTarget.style.background = 'var(--surface)'; e.currentTarget.style.color = 'var(--text-primary)'; }}
                                                            onMouseLeave={e => { e.currentTarget.style.background = 'var(--bg)'; e.currentTarget.style.color = 'var(--text-secondary)'; }}>
                                                            Detail <ChevronRight className="w-3.5 h-3.5" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        </React.Fragment>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>

            {/* ─── Modal Buat Pengajuan ─────────────────────────────────────────── */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-4"
                    style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(2px)' }}>
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto animate-scale-in"
                        style={{ background: 'var(--surface)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>

                        {/* Modal Header */}
                        <div className="sticky top-0 px-6 py-4 flex items-center justify-between"
                            style={{ borderBottom: '1px solid var(--border)', background: 'var(--surface)', zIndex: 1 }}>
                            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <PackagePlus className="w-4 h-4" style={{ color: 'var(--primary)' }} />
                                Buat Pengajuan Baru
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg"
                                style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
                                onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')}
                                onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>

                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            {/* ── Header Info ── */}
                            <div className="space-y-4">
                                <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
                                    Informasi Pengajuan
                                </p>

                                {userRole === 'admin' && (
                                    <div className="grid grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                                Pemohon <span style={{ color: 'var(--danger)' }}>*</span>
                                            </label>
                                            <input type="text" required className={inputCls}
                                                style={inputStyle()} onFocus={onFocus} onBlur={onBlur}
                                                value={formHeader.pemohon}
                                                onChange={e => setFormHeader({ ...formHeader, pemohon: e.target.value })}
                                                placeholder="Nama pemohon..." />
                                        </div>
                                        <div>
                                            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                                Sub Bagian <span style={{ color: 'var(--danger)' }}>*</span>
                                            </label>
                                            <select required className={inputCls}
                                                style={inputStyle()} onFocus={onFocus} onBlur={onBlur}
                                                value={formHeader.sub_bagian_id}
                                                onChange={e => setFormHeader({ ...formHeader, sub_bagian_id: e.target.value })}>
                                                <option value="">-- Pilih Sub Bagian --</option>
                                                {subBagianList.map(sb => <option key={sb.id} value={sb.id}>{sb.nama}</option>)}
                                            </select>
                                        </div>
                                    </div>
                                )}

                                <div className="grid grid-cols-2 gap-3">
                                    <div>
                                        <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1" style={{ color: 'var(--text-primary)' }}>
                                            <Calendar className="w-3.5 h-3.5" /> Tanggal <span style={{ color: 'var(--danger)' }}>*</span>
                                        </label>
                                        <input type="date" required className={inputCls}
                                            style={inputStyle()} onFocus={onFocus} onBlur={onBlur}
                                            value={formHeader.tanggal}
                                            onChange={e => setFormHeader({ ...formHeader, tanggal: e.target.value })} />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>
                                            Keterangan / Keperluan
                                        </label>
                                        <input type="text" className={inputCls}
                                            style={inputStyle()} onFocus={onFocus} onBlur={onBlur}
                                            value={formHeader.keterangan}
                                            onChange={e => setFormHeader({ ...formHeader, keterangan: e.target.value })}
                                            placeholder="Opsional..." />
                                    </div>
                                </div>
                            </div>

                            <div style={{ borderTop: '1px dashed var(--border)' }} />

                            {/* ── Daftar Barang ── */}
                            <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                    <p className="text-xs font-bold uppercase tracking-widest" style={{ color: 'var(--primary)' }}>
                                        Daftar Barang ({formItems.length} item)
                                    </p>
                                    <button type="button" onClick={addItem}
                                        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg"
                                        style={{ background: 'var(--primary-light)', color: 'var(--primary)', border: 'none', cursor: 'pointer' }}>
                                        <Plus className="w-3.5 h-3.5" /> Tambah Barang
                                    </button>
                                </div>

                                <div className="space-y-3">
                                    {formItems.map((item, index) => {
                                        const selectedBarang = barangList.find(b => b.id === item.barang_id);
                                        const stockInfo = item.barang_id ? getStockInfo(item.barang_id) : { stok: 0, pending: 0, available: 0 };
                                        const qty = parseInt(item.jumlah) || 0;
                                        const exceeded = qty > stockInfo.available && item.barang_id !== '';

                                        return (
                                            <div key={index} className="rounded-xl p-3 space-y-2"
                                                style={{ background: 'var(--bg)', border: `1.5px solid ${exceeded ? 'var(--danger)' : 'var(--border)'}` }}>
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-semibold" style={{ color: 'var(--text-muted)' }}>
                                                        Barang #{index + 1}
                                                    </span>
                                                    {formItems.length > 1 && (
                                                        <button type="button" onClick={() => removeItem(index)}
                                                            className="p-1 rounded-lg"
                                                            style={{ background: 'var(--danger-light)', color: 'var(--danger)', border: 'none', cursor: 'pointer' }}>
                                                            <Trash2 className="w-3.5 h-3.5" />
                                                        </button>
                                                    )}
                                                </div>

                                                <div className="grid grid-cols-3 gap-2">
                                                    {/* Pilih Barang */}
                                                    <div className="col-span-2">
                                                        <SearchableSelect
                                                            required
                                                            className={inputCls}
                                                            style={inputStyle()}
                                                            onFocusCb={onFocus}
                                                            onBlurCb={onBlur}
                                                            value={item.barang_id}
                                                            onChange={(val) => updateItem(index, 'barang_id', val)}
                                                            placeholder="Cari & pilih barang..."
                                                            options={barangList.filter(b => b.status !== false).map(b => ({
                                                                value: b.id,
                                                                label: b.nama
                                                            }))}
                                                        />
                                                    </div>

                                                    {/* Jumlah */}
                                                    <div>
                                                        <input type="number" required min="1" placeholder="Jumlah"
                                                            className={inputCls} style={inputStyle()} onFocus={onFocus} onBlur={onBlur}
                                                            value={item.jumlah}
                                                            onChange={e => updateItem(index, 'jumlah', e.target.value)} />
                                                    </div>
                                                </div>

                                                {/* Stock info 3-chip row */}
                                                {item.barang_id && selectedBarang && (
                                                    <div className="space-y-1.5">
                                                        {/* 3 info chips */}
                                                        <div className="grid grid-cols-3 gap-1.5">
                                                            {/* Stok Gudang */}
                                                            <div className="flex flex-col items-center px-2 py-1.5 rounded-lg"
                                                                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}>
                                                                <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: 'var(--text-muted)' }}>
                                                                    Stok Gudang
                                                                </span>
                                                                <span className="text-sm font-bold mt-0.5" style={{ color: 'var(--text-primary)' }}>
                                                                    {stockInfo.stok}
                                                                    <span className="text-[10px] font-normal ml-1" style={{ color: 'var(--text-muted)' }}>
                                                                        {selectedBarang.satuan?.nama || ''}
                                                                    </span>
                                                                </span>
                                                            </div>

                                                            {/* Terpesan (pending) */}
                                                            <div className="flex flex-col items-center px-2 py-1.5 rounded-lg"
                                                                style={{
                                                                    background: stockInfo.pending > 0 ? 'rgba(245,158,11,0.08)' : 'var(--surface)',
                                                                    border: `1px solid ${stockInfo.pending > 0 ? 'rgba(245,158,11,0.3)' : 'var(--border)'}`
                                                                }}>
                                                                <span className="text-[10px] font-medium uppercase tracking-wide" style={{ color: stockInfo.pending > 0 ? '#d97706' : 'var(--text-muted)' }}>
                                                                    Terpesan
                                                                </span>
                                                                <span className="text-sm font-bold mt-0.5" style={{ color: stockInfo.pending > 0 ? '#d97706' : 'var(--text-muted)' }}>
                                                                    {stockInfo.pending}
                                                                    <span className="text-[10px] font-normal ml-1">
                                                                        {selectedBarang.satuan?.nama || ''}
                                                                    </span>
                                                                </span>
                                                            </div>

                                                            {/* Tersedia */}
                                                            <div className="flex flex-col items-center px-2 py-1.5 rounded-lg"
                                                                style={{
                                                                    background: exceeded ? 'var(--danger-light)' : stockInfo.available === 0 ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.08)',
                                                                    border: `1px solid ${exceeded ? 'var(--danger)' : stockInfo.available === 0 ? 'rgba(239,68,68,0.3)' : 'rgba(16,185,129,0.3)'}`
                                                                }}>
                                                                <span className="text-[10px] font-medium uppercase tracking-wide"
                                                                    style={{ color: exceeded || stockInfo.available === 0 ? 'var(--danger)' : '#059669' }}>
                                                                    Tersedia
                                                                </span>
                                                                <span className="text-sm font-bold mt-0.5"
                                                                    style={{ color: exceeded || stockInfo.available === 0 ? 'var(--danger)' : '#059669' }}>
                                                                    {stockInfo.available}
                                                                    <span className="text-[10px] font-normal ml-1">
                                                                        {selectedBarang.satuan?.nama || ''}
                                                                    </span>
                                                                </span>
                                                            </div>
                                                        </div>

                                                        {/* Warning jika melebihi */}
                                                        {exceeded && (
                                                            <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs"
                                                                style={{ background: 'var(--danger-light)', color: 'var(--danger)' }}>
                                                                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                                                                <span>Jumlah melebihi stok yang tersedia ({stockInfo.available} {selectedBarang.satuan?.nama || ''})</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* ── Tombol ── */}
                            <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)}
                                    className="flex-1 py-2.5 text-sm font-medium rounded-lg"
                                    style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }}
                                    onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')}
                                    onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg)')}>
                                    Batal
                                </button>
                                <button type="submit"
                                    disabled={isSaving || !formIsValid || formItems.some(it => !it.barang_id)}
                                    className="flex-1 py-2.5 text-sm font-medium rounded-lg flex items-center justify-center gap-2"
                                    style={{
                                        background: (isSaving || !formIsValid || formItems.some(it => !it.barang_id)) ? '#a5b4fc' : 'var(--primary)',
                                        color: '#fff', border: 'none',
                                        cursor: (isSaving || !formIsValid || formItems.some(it => !it.barang_id)) ? 'not-allowed' : 'pointer'
                                    }}>
                                    {isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Memproses...</> : `Ajukan Permintaan (${formItems.length} Barang)`}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* ─── Centered Modal (Opsi 2 Detail Pengajuan) ──────────────────────── */}
            {expandedId && (
                <div className="fixed inset-0 z-[9990] flex items-center justify-center p-4 sm:p-6 transition-opacity duration-300" style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(3px)' }} onClick={() => setExpandedId(null)}>
                    {list.filter(pg => pg.id === expandedId).map(pg => {
                        const items = pg.pengajuan_items || [];
                        const overall = getOverallStatus(items);
                        const approvedCount = items.filter(i => i.status === 'disetujui').length;
                        
                        return (
                            <div key={pg.id} onClick={(e) => e.stopPropagation()} className="relative w-full max-w-4xl max-h-[90vh] flex flex-col rounded-2xl shadow-2xl animate-scale-in" style={{ background: 'var(--surface)', border: '1px solid var(--border)', overflow: 'hidden' }}>
                                {/* Header */}
                                <div className="px-6 py-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                                    <div>
                                        <h3 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Detail Pengajuan</h3>
                                        <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>ID: {pg.id.split('-')[0]}</p>
                                    </div>
                                    <button onClick={() => setExpandedId(null)} className="p-2 rounded-lg transition-colors"
                                        style={{ color: 'var(--text-muted)' }}
                                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg)'}
                                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                                        <X className="w-6 h-6" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="flex-1 overflow-y-auto p-6 flex flex-col lg:flex-row gap-6">
                                    {/* Sidebar Info (Left/Top) */}
                                    <div className="w-full lg:w-1/3 flex flex-col gap-4">
                                        <div className="rounded-xl p-5 shadow-sm space-y-4" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                                            <div className="flex items-center gap-3 pb-4" style={{ borderBottom: '1px solid var(--border)' }}>
                                                <div className="w-12 h-12 rounded-full flex items-center justify-center font-bold text-xl"
                                                    style={{ background: 'var(--primary-light)', color: 'var(--primary)' }}>
                                                    {pg.pemohon?.charAt(0).toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>{pg.pemohon || '-'}</p>
                                                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-secondary)' }}>{pg.sub_bagian?.nama || '-'}</p>
                                                </div>
                                            </div>
                                            <div className="space-y-3">
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Tanggal</p>
                                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {new Date(pg.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                                    </p>
                                                </div>
                                                <div>
                                                    <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Progress</p>
                                                    <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                                                        {approvedCount} dari {items.length} selesai
                                                    </p>
                                                </div>
                                                {pg.keterangan && (
                                                    <div>
                                                        <p className="text-xs font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--text-muted)' }}>Catatan</p>
                                                        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{pg.keterangan}</p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="pt-2">
                                                <StatusBadge status={overall} />
                                            </div>
                                        </div>
                                    </div>

                                    {/* Main Content: Item List (Right/Bottom) */}
                                    <div className="w-full lg:w-2/3">
                                        <h4 className="text-sm font-bold uppercase tracking-widest mb-4 flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                                            <span>Daftar Barang ({items.length})</span>
                                        </h4>
                                        <div className="space-y-3">
                                            {items.map((item) => (
                                                <div key={item.id} className="p-4 rounded-xl shadow-sm transition-all flex flex-col sm:flex-row gap-4 justify-between items-center" style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}>
                                                    <div className="flex-1 min-w-0 flex items-start gap-3 w-full">
                                                        <div className="flex-1 min-w-0">
                                                            <div className="flex items-center gap-2 mb-1">
                                                                <h5 className="font-bold text-[15px] truncate" style={{ color: 'var(--text-primary)' }}>{item.barang?.nama || '-'}</h5>
                                                                <StatusBadge status={item.status} />
                                                            </div>
                                                            <div className="flex items-center flex-wrap gap-2 mt-1.5">
                                                                <span className="text-[11px] font-mono px-1.5 py-0.5 rounded" style={{ background: 'var(--surface)', color: 'var(--text-muted)', border: '1px solid var(--border)' }}>{item.barang?.kode || '-'}</span>
                                                                <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{item.jumlah} <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.satuan?.nama || '-'}</span></span>
                                                                
                                                                {/* Admin Stock Information */}
                                                                {userRole === 'admin' && (
                                                                    <div className="ml-1 pl-3 flex items-center gap-2" style={{ borderLeft: '1px solid var(--border)' }}>
                                                                        <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border" style={{ background: 'var(--bg)', borderColor: 'var(--border)'}}>
                                                                            <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Stok Fisis:</span>
                                                                            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{item.barang?.stok || 0}</span>
                                                                        </div>
                                                                        {item.status === 'pending' && (
                                                                            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded border" style={{ background: 'var(--bg)', borderColor: 'var(--border)'}}>
                                                                                <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>Est. Sisa:</span>
                                                                                <span className="text-xs font-bold" style={{ color: (item.barang?.stok || 0) - item.jumlah < 0 ? '#ef4444' : 'var(--text-primary)' }}>
                                                                                    {(item.barang?.stok || 0) - item.jumlah}
                                                                                </span>
                                                                            </div>
                                                                        )}
                                                                    </div>
                                                                )}
                                                            </div>
                                                            
                                                            {/* Alasan Penolakan */}
                                                            {item.status === 'ditolak' && item.alasan_penolakan && (
                                                                <div className="mt-2.5 p-2.5 rounded-lg flex items-start gap-2 text-sm" style={{ background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)' }}>
                                                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" style={{ color: '#ef4444' }} />
                                                                    <div className="flex-1">
                                                                        <span className="font-bold block text-[10px] uppercase tracking-wider mb-0.5" style={{ color: '#ef4444' }}>Alasan Penolakan:</span>
                                                                        <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{item.alasan_penolakan}</span>
                                                                    </div>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Admin Actions */}
                                                    {userRole === 'admin' && item.status === 'pending' && (
                                                        <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-3 sm:mt-0">
                                                            <button
                                                                disabled={isSaving}
                                                                onClick={e => { e.stopPropagation(); handleItemStatus(item.id, 'ditolak'); }}
                                                                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                                                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }}
                                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                            >
                                                                <XCircle className="w-4 h-4" /> Tolak
                                                            </button>
                                                            <button
                                                                disabled={isSaving}
                                                                onClick={e => { e.stopPropagation(); handleItemStatus(item.id, 'disetujui'); }}
                                                                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                                                                style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: '1px solid rgba(16, 185, 129, 0.2)', cursor: 'pointer' }}
                                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.2)'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)'}
                                                            >
                                                                <CheckCircle2 className="w-4 h-4" /> Setujui
                                                            </button>
                                                        </div>
                                                    )}

                                                    {/* User Actions */}
                                                    {userRole === 'user' && item.status === 'pending' && (
                                                        <div className="flex gap-2 w-full sm:w-auto shrink-0 mt-3 sm:mt-0">
                                                            <button
                                                                disabled={isSaving}
                                                                onClick={e => { e.stopPropagation(); handleCancelItem(item.id); }}
                                                                className="flex-1 sm:flex-none px-4 py-2 text-xs font-bold rounded-lg flex items-center justify-center gap-1.5 transition-colors"
                                                                style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#ef4444', border: '1px solid rgba(239, 68, 68, 0.2)', cursor: 'pointer' }}
                                                                onMouseEnter={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.2)'}
                                                                onMouseLeave={e => e.currentTarget.style.background = 'rgba(239, 68, 68, 0.1)'}
                                                            >
                                                                <Trash2 className="w-4 h-4" /> Batal
                                                            </button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
}
