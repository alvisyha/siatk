'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import {
    Search,
    Plus,
    X,
    Loader2,
    ClipboardList,
    AlertCircle,
    Info,
    CheckCircle2,
    XCircle,
    Clock,
    Filter,
    Calendar
} from 'lucide-react';

interface Barang {
    id: string;
    nama: string;
    kode: string | null;
    stok?: number;
    satuan?: { nama: string } | null;
    status?: boolean;
}

interface SubBagian {
    id: string;
    nama: string;
}

interface PermintaanBarang {
    id: string;
    user_id: string;
    barang_id: string;
    jumlah: number;
    sub_bagian_id: string | null;
    tanggal: string;
    status: 'pending' | 'disetujui' | 'ditolak';
    pemohon: string | null;
    keterangan: string | null;
    created_at: string;
    barang?: {
        nama: string;
        kode: string | null;
        satuan: { nama: string } | null;
        stok?: number;
    };
    sub_bagian?: {
        nama: string;
    };
    user_email?: string;
}

export default function PermintaanBarangPage() {
    const [requestList, setRequestList] = useState<PermintaanBarang[]>([]);
    const [barangList, setBarangList] = useState<Barang[]>([]);
    const [subBagianList, setSubBagianList] = useState<SubBagian[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState('semua');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isApproveModalOpen, setIsApproveModalOpen] = useState(false);
    const [selectedRequest, setSelectedRequest] = useState<PermintaanBarang | null>(null);
    const [approvalNote, setApprovalNote] = useState('');
    const [isSaving, setIsSaving] = useState(false);
    const [userRole, setUserRole] = useState<string>('user');

    const [userData, setUserData] = useState<any>(null);

    // Form State
    const [formData, setFormData] = useState({
        barang_id: '',
        jumlah: '',
        sub_bagian_id: '',
        tanggal: new Date().toISOString().split('T')[0],
        pemohon: '',
        keterangan: ''
    });

    useEffect(() => {
        fetchInitialData();
        fetchUserProfile();
    }, []);

    const fetchUserProfile = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                const user = data.user;
                setUserRole(user.role || 'user');
                setUserData(user);
                
                // Pre-fill form if user is not admin
                if (user.role === 'user') {
                    setFormData(prev => ({
                        ...prev,
                        pemohon: user.name || '',
                        sub_bagian_id: user.sub_bagian_id || ''
                    }));
                }
            }
        } catch (error) {
            console.error('Failed to fetch user profile:', error);
        }
    };

    const fetchInitialData = async () => {
        setIsLoading(true);
        try {
            const [resReq, resBarang, resSubBagian] = await Promise.all([
                fetch('/api/permintaan-barang'),
                fetch('/api/barang'),
                fetch('/api/sub-bagian')
            ]);

            if (resReq.ok) {
                const data = await resReq.json();
                setRequestList(data.data);
            }
            if (resBarang.ok) {
                const data = await resBarang.json();
                setBarangList(data.data);
            }
            if (resSubBagian.ok) {
                const data = await resSubBagian.json();
                setSubBagianList(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch initial data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const res = await fetch('/api/permintaan-barang', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchInitialData();
                setIsModalOpen(false);
                setFormData({
                    barang_id: '',
                    jumlah: '',
                    sub_bagian_id: '',
                    tanggal: new Date().toISOString().split('T')[0],
                    pemohon: '',
                    keterangan: ''
                });
            } else {
                const errorData = await res.json();
                alert(`Gagal: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error saving request:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleUpdateStatus = async (id: string, status: string) => {
        setIsSaving(true);
        try {
            const res = await fetch('/api/permintaan-barang', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, status })
            });

            if (res.ok) {
                fetchInitialData();
                setIsApproveModalOpen(false);
                setSelectedRequest(null);
                setApprovalNote('');
            } else {
                const errorData = await res.json();
                alert(`Gagal update status: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error updating status:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleOpenApproveModal = (item: PermintaanBarang) => {
        setSelectedRequest(item);
        setApprovalNote('');
        setIsApproveModalOpen(true);
    };

    // Filtered requests based on search and status
    const filteredRequests = (requestList || []).filter(item => {
        const lowerCaseSearchTerm = searchTerm.toLowerCase();

        const matchesSearch =
            item.barang?.nama.toLowerCase().includes(lowerCaseSearchTerm) ||
            item.pemohon?.toLowerCase().includes(lowerCaseSearchTerm) ||
            item.sub_bagian?.nama?.toLowerCase().includes(lowerCaseSearchTerm) ||
            item.keterangan?.toLowerCase().includes(lowerCaseSearchTerm);

        const matchesStatus = statusFilter === 'semua' || item.status === statusFilter;

        return matchesSearch && matchesStatus;
    });

    const exportToPDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text('Laporan Permintaan Barang', 14, 15);
        doc.setFontSize(10);
        doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 22);
        
        const tableColumn = ["No", "Pemohon", "Sub Bagian", "Tanggal", "Barang", "Jumlah", "Status"];
        const tableRows: any[] = [];

        filteredRequests.forEach((item, index) => {
            const rowData = [
                index + 1,
                item.pemohon || '-',
                item.sub_bagian?.nama || '-',
                new Date(item.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                item.barang?.nama || '-',
                `${item.jumlah} ${item.barang?.satuan?.nama || ''}`,
                item.status.toUpperCase()
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [52, 152, 219], textColor: 255 }
        });

        doc.save(`permintaan_barang_${new Date().getTime()}.pdf`);
    };

    const getStatusStyle = (status: string) => {
        switch (status) {
            case 'disetujui':
                return 'bg-green-100 text-green-700 border-green-200';
            case 'ditolak':
                return 'bg-red-100 text-red-700 border-red-200';
            default:
                return 'bg-yellow-100 text-yellow-700 border-yellow-200';
        }
    };

    return (
        <>
            <div className="space-y-6 animate-fade-in">
                {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{color:'var(--text-primary)'}}>Permintaan Barang</h1>
                    <p className="text-sm mt-1" style={{color:'var(--text-secondary)'}}>Ajukan dan pantau permintaan Alat Tulis Kantor</p>
                </div>
                <div className="flex gap-2">
                    <button onClick={exportToPDF} className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg" style={{background:'var(--danger)',color:'#fff',border:'none',cursor:'pointer',boxShadow:'0 2px 8px rgba(239,68,68,0.2)'}}>
                        Export PDF
                    </button>
                    {userRole === 'user' && (
                        <button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg" style={{background:'var(--primary)',color:'#fff',border:'none',cursor:'pointer',boxShadow:'0 2px 8px rgba(99,102,241,0.25)'}}>
                            <Plus className="w-4 h-4" /> Buat Pengajuan
                        </button>
                    )}
                </div>
            </div>

            {/* Table Card */}
            <div className="rounded-xl overflow-hidden" style={{background:'var(--surface)',border:'1px solid var(--border)',boxShadow:'var(--shadow-sm)'}}>
                <div className="p-4" style={{borderBottom:'1px solid var(--border)',background:'var(--bg)'}}>
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full max-w-sm">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'var(--text-muted)'}} />
                            <input type="text" placeholder="Cari barang atau pemohon..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none" style={{border:'1.5px solid var(--border)',background:'var(--surface)',color:'var(--text-primary)'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}} />
                        </div>
                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <label className="text-sm font-medium flex items-center gap-2 whitespace-nowrap" style={{color:'var(--text-secondary)'}}>
                                <Filter className="w-4 h-4" /> Filter Status:
                            </label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="rounded-lg px-3 py-2 text-sm outline-none font-medium" style={{background:'var(--surface)',border:'1.5px solid var(--border)',color:'var(--text-primary)'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}}>
                                <option value="semua">Semua Status</option>
                                <option value="pending">⏳ Pending</option>
                                <option value="disetujui">✅ Disetujui</option>
                                <option value="ditolak">❌ Ditolak</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[800px]">
                        <thead style={{background:'var(--bg)',borderBottom:'1px solid var(--border)'}}>
                            <tr>
                                <th className="px-4 py-3" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>No</th>
                                <th className="px-4 py-3" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Pemohon</th>
                                <th className="px-4 py-3" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Sub Bagian</th>
                                <th className="px-4 py-3" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Tanggal</th>
                                <th className="px-4 py-3 w-[30%]" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Barang</th>
                                <th className="px-4 py-3 text-center" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Jumlah</th>
                                <th className="px-4 py-3" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Satuan</th>
                                <th className="px-4 py-3" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Status</th>
                                <th className="px-4 py-3" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Keterangan</th>
                                {userRole === 'admin' && <th className="px-4 py-3 text-center" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Aksi</th>}
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (<tr><td colSpan={10} className="py-14 text-center" style={{color:'var(--text-muted)'}}><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{color:'var(--primary)'}} /><p className="text-sm">Memuat data...</p></td></tr>
                            ) : filteredRequests.length === 0 ? (<tr><td colSpan={10} className="py-14 text-center" style={{color:'var(--text-muted)'}}><Info className="w-7 h-7 mx-auto mb-2" /><p className="text-sm">Belum ada pengajuan permintaan.</p></td></tr>
                            ) : filteredRequests.map((item, index) => (
                                <tr key={item.id} className="transition-colors" style={{borderTop:'1px solid var(--border)'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--bg)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                                    <td className="px-4 py-3.5 text-xs font-semibold" style={{color:'var(--text-muted)'}}>{index + 1}</td>
                                    <td className="px-4 py-3.5 font-medium" style={{color:'var(--text-primary)'}}>{item.pemohon || '-'}</td>
                                    <td className="px-4 py-3.5" style={{color:'var(--text-secondary)'}}>{item.sub_bagian?.nama || '-'}</td>
                                    <td className="px-4 py-3.5 text-sm" style={{color:'var(--text-secondary)'}}>{new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td className="px-4 py-3.5"><div className="font-medium text-sm" style={{color:'var(--text-primary)'}}>{item.barang?.nama}</div><div className="text-xs font-mono" style={{color:'var(--text-muted)'}}>{item.barang?.kode || '-'}</div></td>
                                    <td className="px-4 py-3.5 text-center font-bold" style={{color:'var(--text-primary)'}}>{item.jumlah}</td>
                                    <td className="px-4 py-3.5" style={{color:'var(--text-secondary)'}}>{item.barang?.satuan?.nama || '-'}</td>
                                    <td className="px-4 py-3.5"><span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${item.status === 'disetujui' ? 'bg-emerald-100 text-emerald-700' : item.status === 'ditolak' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>{item.status === 'pending' && <Clock className="w-3 h-3" />}{item.status === 'disetujui' && <CheckCircle2 className="w-3 h-3" />}{item.status === 'ditolak' && <XCircle className="w-3 h-3" />}{item.status}</span></td>
                                    <td className="px-4 py-3.5 text-xs max-w-[150px] truncate" style={{color:'var(--text-secondary)'}} title={item.keterangan || ''}>{item.keterangan || '-'}</td>
                                    {userRole === 'admin' && (
                                        <td className="px-4 py-3.5 text-center">
                                            {item.status === 'pending' ? (
                                                <div className="flex items-center justify-center gap-1">
                                                    <button onClick={() => handleOpenApproveModal(item)} className="px-3 py-1.5 text-xs font-medium rounded-md shadow-sm" style={{background:'var(--teal)',color:'#fff',border:'none',cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--teal-light)',e.currentTarget.style.color='var(--teal)')} onMouseLeave={e=>(e.currentTarget.style.background='var(--teal)',e.currentTarget.style.color='#fff')}>Setujui</button>
                                                    <button onClick={() => handleUpdateStatus(item.id, 'ditolak')} className="px-3 py-1.5 text-xs font-medium rounded-md shadow-sm" style={{background:'var(--danger)',color:'#fff',border:'none',cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--danger-light)',e.currentTarget.style.color='var(--danger)')} onMouseLeave={e=>(e.currentTarget.style.background='var(--danger)',e.currentTarget.style.color='#fff')}>Tolak</button>
                                                </div>
                                            ) : (
                                                <span className="text-xs italic" style={{color:'var(--text-muted)'}}>Selesai</span>
                                            )}
                                        </td>
                                    )}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
            
            </div>

            {/* Modal Create Request */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-16 md:pt-4 pointer-events-none">
                    <div className="w-full max-w-md overflow-hidden animate-scale-in pointer-events-auto" style={{background:'var(--surface)',borderRadius:'16px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--border)'}}>
                        <div className="px-6 py-4 flex items-center justify-between" style={{borderBottom:'1px solid var(--border)'}}>
                            <h3 className="text-base font-bold flex items-center gap-2" style={{color:'var(--text-primary)'}}>
                                <Plus className="w-4 h-4" style={{color:'var(--primary)'}} /> Buat Pengajuan
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg" style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--text-muted)'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--bg)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {userRole === 'admin' && (
                                <>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Pemohon</label>
                                        <input type="text" required value={formData.pemohon} onChange={e => setFormData({ ...formData, pemohon: e.target.value })} className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-primary)',fontFamily:'inherit'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}} placeholder="Nama pemohon..." />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Sub Bagian</label>
                                        <select required value={formData.sub_bagian_id} onChange={e => setFormData({ ...formData, sub_bagian_id: e.target.value })} className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-primary)',fontFamily:'inherit'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}}>
                                            <option value="">-- Pilih Sub Bagian --</option>
                                            {subBagianList.map(sb => (<option key={sb.id} value={sb.id}>{sb.nama}</option>))}
                                        </select>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Pilih Barang</label>
                                <select required value={formData.barang_id} onChange={e => setFormData({ ...formData, barang_id: e.target.value })} className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-primary)',fontFamily:'inherit'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}}>
                                    <option value="">-- Pilih Barang --</option>
                                    {barangList.filter(b => b.status !== false).map(b => (<option key={b.id} value={b.id}>{b.nama}</option>))}
                                </select>
                                {formData.barang_id && (() => {
                                    const selectedBarang = barangList.find(b => b.id === formData.barang_id);
                                    if (selectedBarang) {
                                        const physicalStock = selectedBarang.stok || 0;
                                        const pendingSum = (requestList || []).filter(r => r.barang_id === formData.barang_id && r.status === 'pending').reduce((sum, r) => sum + (r.jumlah || 0), 0);
                                        const availableStock = physicalStock - pendingSum;
                                        return (
                                            <div className="mt-2 space-y-2">
                                                {availableStock > 0 ? (
                                                    <div className="p-3 rounded-xl space-y-1 border" style={{background:'var(--bg)',borderColor:'var(--primary-light)'}}>
                                                        <p className="text-[11px] font-semibold uppercase tracking-wider" style={{color:'var(--primary)'}}>Informasi Stok</p>
                                                        <div className="flex justify-between items-center text-xs"><span style={{color:'var(--text-secondary)'}}>Stok di Gudang:</span><span className="font-bold" style={{color:'var(--text-primary)'}}>{physicalStock} {selectedBarang.satuan?.nama || ''}</span></div>
                                                        <div className="flex justify-between items-center text-xs"><span style={{color:'var(--text-secondary)'}}>Terpesan (Pending):</span><span className="font-bold" style={{color:pendingSum>0?'var(--amber)':'var(--text-muted)'}}>{pendingSum > 0 ? `-${pendingSum}` : '0'} {selectedBarang.satuan?.nama || ''}</span></div>
                                                        <div className="pt-1.5 mt-1.5 flex justify-between items-center text-xs" style={{borderTop:'1px solid var(--primary-light)'}}><span className="font-medium" style={{color:'var(--primary)'}}>Tersedia (Siap Pesan):</span><span className="font-bold" style={{color:'var(--primary)'}}>{availableStock} {selectedBarang.satuan?.nama || ''}</span></div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 p-3 rounded-xl border text-xs font-medium leading-relaxed" style={{background:'var(--danger-light)',borderColor:'var(--danger-light)',color:'var(--danger)'}}><AlertCircle className="w-4 h-4 shrink-0" /><span>Stok kosong atau antrean penuh.</span></div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Jumlah <span style={{color:'var(--danger)'}}>*</span></label><input type="number" required min="1" value={formData.jumlah} onChange={e => setFormData({ ...formData, jumlah: e.target.value })} placeholder="0" className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-primary)',fontFamily:'inherit'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}} /></div>
                                <div><label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Satuan</label><input type="text" readOnly disabled value={barangList.find(b => b.id === formData.barang_id)?.satuan?.nama || ''} placeholder="Satuan" className="w-full px-3 py-2.5 text-sm rounded-lg" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-muted)',fontFamily:'inherit',cursor:'not-allowed'}} /></div>
                            </div>
                            <div><label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{color:'var(--text-primary)'}}><Calendar className="w-3.5 h-3.5" /> Tanggal <span style={{color:'var(--danger)'}}>*</span></label><input type="date" required value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-primary)',fontFamily:'inherit'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}} /></div>
                            <div><label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Keterangan / Keperluan</label><textarea value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} rows={3} placeholder="Alasan permintaan barang..." className="w-full px-3 py-2.5 text-sm rounded-lg outline-none resize-none" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-primary)',fontFamily:'inherit'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}} /></div>
                            
                            {(() => {
                                const selected = barangList.find(b => b.id === formData.barang_id);
                                const physicalStock = selected?.stok ?? 0;
                                const pendingSum = (requestList || []).filter(r => r.barang_id === formData.barang_id && r.status === 'pending').reduce((sum, r) => sum + (r.jumlah || 0), 0);
                                const availableStock = physicalStock - pendingSum;
                                const requestedQty = formData.jumlah !== '' ? parseInt(formData.jumlah) : 0;
                                const exceeded = requestedQty > availableStock && formData.barang_id !== '';
                                return (
                                    <>
                                        {exceeded && <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{background:'var(--danger-light)',border:'1px solid var(--danger-light)',color:'var(--danger)'}}><AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>Jumlah pengajuan (<strong>{requestedQty}</strong>) melebihi stok tersedia (<strong>{availableStock}</strong>).</span></div>}
                                        <div className="flex gap-2 pt-2" style={{borderTop:'1px solid var(--border)'}}>
                                            <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-sm font-medium rounded-lg" style={{background:'var(--bg)',color:'var(--text-secondary)',border:'1px solid var(--border)',cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--border)')} onMouseLeave={e=>(e.currentTarget.style.background='var(--bg)')}>Batal</button>
                                            <button type="submit" disabled={isSaving || exceeded || requestedQty <= 0} className="flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2" style={{background:(isSaving || exceeded || requestedQty <= 0)?'#a5b4fc':'var(--primary)',color:'#fff',border:'none',cursor:(isSaving || exceeded || requestedQty <= 0)?'not-allowed':'pointer'}}>{isSaving ? <><Loader2 className="w-4 h-4 animate-spin"/>Memproses...</> : 'Ajukan Permintaan'}</button>
                                        </div>
                                    </>
                                );
                            })()}
                        </form>
                    </div>
                </div>
            )}

            {/* Modal Approve Confirmation */}
            {isApproveModalOpen && selectedRequest && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-16 md:pt-4 pointer-events-none">
                    <div className="w-full max-w-md overflow-hidden animate-scale-in pointer-events-auto" style={{background:'var(--surface)',borderRadius:'16px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--border)'}}>
                        <div className="px-6 py-4 flex items-center justify-between" style={{borderBottom:'1px solid var(--border)'}}>
                            <h3 className="text-base font-bold flex items-center gap-2" style={{color:'var(--text-primary)'}}>
                                <CheckCircle2 className="w-4 h-4" style={{color:'var(--teal)'}} /> Konfirmasi Persetujuan
                            </h3>
                            <button onClick={() => { setIsApproveModalOpen(false); setSelectedRequest(null); }} className="p-1.5 rounded-lg" style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--text-muted)'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--bg)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}><X className="w-4 h-4" /></button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="rounded-xl p-4 space-y-3 text-xs" style={{background:'var(--bg)',border:'1px solid var(--border)'}}>
                                <div className="flex justify-between"><span style={{color:'var(--text-secondary)'}}>Pemohon</span><span className="font-semibold" style={{color:'var(--text-primary)'}}>{selectedRequest.pemohon || '-'}</span></div>
                                <div className="flex justify-between"><span style={{color:'var(--text-secondary)'}}>Sub Bagian</span><span className="font-medium" style={{color:'var(--text-primary)'}}>{selectedRequest.sub_bagian?.nama || '-'}</span></div>
                                <div style={{borderTop:'1px solid var(--border)',margin:'8px 0'}}></div>
                                <div className="flex justify-between"><span style={{color:'var(--text-secondary)'}}>Tanggal</span><span className="font-medium" style={{color:'var(--text-primary)'}}>{new Date(selectedRequest.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</span></div>
                                <div style={{borderTop:'1px solid var(--border)',margin:'8px 0'}}></div>
                                <div className="flex justify-between"><span style={{color:'var(--text-secondary)'}}>Nama Barang</span><span className="font-semibold" style={{color:'var(--text-primary)'}}>{selectedRequest.barang?.nama || '-'}</span></div>
                                <div className="flex justify-between"><span style={{color:'var(--text-secondary)'}}>Kode Barang</span><span className="font-mono flex" style={{color:'var(--text-muted)'}}>{selectedRequest.barang?.kode || '-'}</span></div>
                                <div style={{borderTop:'1px dashed var(--border)',margin:'8px 0'}}></div>
                                <div className="flex justify-between"><span style={{color:'var(--text-secondary)'}}>Jumlah Barang (Stok)</span><span className="font-bold" style={{color:'var(--text-primary)'}}>{selectedRequest.barang?.stok ?? 0} {selectedRequest.barang?.satuan?.nama || ''}</span></div>
                                <div className="flex justify-between"><span style={{color:'var(--text-secondary)'}}>Jumlah Pengajuan</span><span className="font-bold" style={{color:'var(--amber)'}}>{selectedRequest.jumlah} {selectedRequest.barang?.satuan?.nama || ''}</span></div>
                                <div className="flex justify-between pt-2 border-t mt-1" style={{borderTopColor:'var(--border)'}}><span style={{color:'var(--text-primary)',fontWeight:600}}>Sisa Stok (setelah disetujui)</span><span className="font-bold" style={{color:((selectedRequest.barang?.stok ?? 0) - selectedRequest.jumlah)<0 ? 'var(--danger)' : 'var(--teal)'}}>{(selectedRequest.barang?.stok ?? 0) - selectedRequest.jumlah} {selectedRequest.barang?.satuan?.nama || ''}</span></div>
                            </div>
                            {((selectedRequest.barang?.stok ?? 0) - selectedRequest.jumlah) < 0 && (
                                <div className="flex items-start gap-2 p-3 rounded-xl text-xs" style={{background:'var(--danger-light)',border:'1px solid var(--danger-light)',color:'var(--danger)'}}>
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>Stok tidak mencukupi! Sisa stok akan negatif jika disetujui.</span>
                                </div>
                            )}
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Catatan (opsional)</label>
                                <textarea value={approvalNote} onChange={e => setApprovalNote(e.target.value)} rows={3} className="w-full px-3 py-2.5 text-sm rounded-lg outline-none resize-none" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-primary)',fontFamily:'inherit'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--teal)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(20,184,166,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}} placeholder="Catatan tambahan..." />
                            </div>
                            <div className="flex gap-2 pt-2" style={{borderTop:'1px solid var(--border)'}}>
                                <button type="button" onClick={() => { setIsApproveModalOpen(false); setSelectedRequest(null); }} className="flex-1 py-2 text-sm font-medium rounded-lg" style={{background:'var(--bg)',color:'var(--text-secondary)',border:'1px solid var(--border)',cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--border)')} onMouseLeave={e=>(e.currentTarget.style.background='var(--bg)')}>Batal</button>
                                <button type="button" disabled={isSaving} onClick={() => handleUpdateStatus(selectedRequest.id, 'disetujui')} className="flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2" style={{background:isSaving?'#99f6e4':'var(--teal)',color:'#fff',border:'none',cursor:isSaving?'not-allowed':'pointer'}}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin"/> : 'Setujui'}</button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}
