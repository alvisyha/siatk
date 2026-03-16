'use client';

import { useState, useEffect } from 'react';
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
    Filter
} from 'lucide-react';

interface Barang {
    id: string;
    nama: string;
    kode: string | null;
    jumlah?: number;
    satuan?: string | null;
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
        satuan: string | null;
        jumlah?: number;
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
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Permintaan Barang</h1>
                    <p className="text-gray-500 text-sm mt-1">Ajukan dan pantau permintaan Alat Tulis Kantor</p>
                </div>
                {userRole === 'user' && (
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 font-medium"
                    >
                        <Plus className="w-4 h-4" />
                        Buat Pengajuan
                    </button>
                )}
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-gray-900">
                <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                    <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                        <div className="relative w-full max-w-md">
                            <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Cari barang atau pemohon..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900"
                            />
                        </div>

                        <div className="flex items-center gap-3 w-full md:w-auto">
                            <label className="text-sm font-medium text-gray-600 flex items-center gap-2 whitespace-nowrap">
                                <Filter className="w-4 h-4" /> Filter Status:
                            </label>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                className="bg-white border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900 min-w-[140px]"
                            >
                                <option value="semua">Semua Status</option>
                                <option value="pending">⏳ Pending</option>
                                <option value="disetujui">✅ Disetujui</option>
                                <option value="ditolak">❌ Ditolak</option>
                            </select>
                        </div>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">No</th>
                                <th className="px-6 py-4">Pemohon</th>
                                <th className="px-6 py-4">Sub Bagian</th>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4 w-[30%]">Barang</th>
                                <th className="px-6 py-4 text-center">Jumlah</th>
                                <th className="px-6 py-4">Unit</th>
                                <th className="px-6 py-4">Status</th>
                                <th className="px-6 py-4">Keterangan</th>
                                {userRole === 'admin' && <th className="px-6 py-4 text-center">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={10} className="px-6 py-10 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                                        <p>Memuat data permintaan...</p>
                                    </td>
                                </tr>
                            ) : filteredRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={9} className="px-6 py-10 text-center text-gray-500">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Info className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p>Belum ada pengajuan permintaan.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredRequests.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.pemohon || '-'}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.sub_bagian?.nama || '-'}</td>
                                        <td className="px-6 py-4 text-gray-700">
                                            {new Date(item.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{item.barang?.nama}</div>
                                            <div className="text-xs text-gray-500 font-mono">{item.barang?.kode || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4 text-center font-bold text-gray-900">{item.jumlah}</td>
                                        <td className="px-6 py-4 text-gray-600">{item.barang?.satuan || '-'}</td>
                                        <td className="px-6 py-4">
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider border ${getStatusStyle(item.status)}`}>
                                                {item.status === 'pending' && <Clock className="w-3 h-3" />}
                                                {item.status === 'disetujui' && <CheckCircle2 className="w-3 h-3" />}
                                                {item.status === 'ditolak' && <XCircle className="w-3 h-3" />}
                                                {item.status}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-500 text-xs max-w-[150px] truncate">{item.keterangan || '-'}</td>
                                        {userRole === 'admin' && (
                                            <td className="px-6 py-4 text-center">
                                                {item.status === 'pending' ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            onClick={() => handleOpenApproveModal(item)}
                                                            className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-all"
                                                        >
                                                            Setujui
                                                        </button>
                                                        <button
                                                            onClick={() => handleUpdateStatus(item.id, 'ditolak')}
                                                            className="px-3 py-1.5 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-all"
                                                        >
                                                            Tolak
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <span className="text-gray-400 text-xs italic">Selesai</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Create Request */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white text-gray-900">
                            <h3 className="text-lg font-semibold">Buat Pengajuan Permintaan</h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            {userRole === 'admin' && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Pemohon</label>
                                        <input
                                            type="text"
                                            required
                                            value={formData.pemohon}
                                            onChange={e => setFormData({ ...formData, pemohon: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                            placeholder="Nama pemohon..."
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Sub Bagian</label>
                                        <select
                                            required
                                            value={formData.sub_bagian_id}
                                            onChange={e => setFormData({ ...formData, sub_bagian_id: e.target.value })}
                                            className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-none"
                                        >
                                            <option value="">-- Pilih Sub Bagian --</option>
                                            {subBagianList.map(sb => (
                                                <option key={sb.id} value={sb.id}>{sb.nama}</option>
                                            ))}
                                        </select>
                                    </div>
                                </>
                            )}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Pilih Barang</label>
                                <select
                                    required
                                    value={formData.barang_id}
                                    onChange={e => setFormData({ ...formData, barang_id: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all shadow-none"
                                >
                                    <option value="">-- Pilih Barang --</option>
                                    {barangList.map(b => (
                                        <option key={b.id} value={b.id}>{b.nama}</option>
                                    ))}
                                </select>
                                {formData.barang_id && (() => {
                                    const selectedBarang = barangList.find(b => b.id === formData.barang_id);
                                    if (selectedBarang) {
                                        const physicalStock = selectedBarang.jumlah || 0;
                                        const pendingSum = (requestList || [])
                                            .filter(r => r.barang_id === formData.barang_id && r.status === 'pending')
                                            .reduce((sum, r) => sum + (r.jumlah || 0), 0);
                                        const availableStock = physicalStock - pendingSum;

                                        return (
                                            <div className="mt-2 space-y-2">
                                                {availableStock > 0 ? (
                                                    <div className="p-3 bg-blue-50 rounded-xl space-y-1 border border-blue-100">
                                                        <p className="text-xs text-blue-600 font-semibold uppercase tracking-wider">Informasi Stok</p>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-600">Stok di Gudang:</span>
                                                            <span className="font-bold text-gray-900">{physicalStock} {selectedBarang.satuan || ''}</span>
                                                        </div>
                                                        <div className="flex justify-between items-center text-sm">
                                                            <span className="text-gray-600">Terpesan (Pending):</span>
                                                            <span className={`font-bold ${pendingSum > 0 ? 'text-orange-600' : 'text-gray-400'}`}>
                                                                {pendingSum > 0 ? `-${pendingSum}` : '0'} {selectedBarang.satuan || ''}
                                                            </span>
                                                        </div>
                                                        <div className="pt-1 border-t border-blue-200 flex justify-between items-center text-sm">
                                                            <span className="text-blue-700 font-medium">Tersedia (Siap Pesan):</span>
                                                            <span className="font-bold text-blue-700">
                                                                {availableStock} {selectedBarang.satuan || ''}
                                                            </span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="flex items-center gap-2 p-3 bg-red-50 text-red-700 rounded-xl border border-red-100 text-xs font-medium leading-relaxed">
                                                        <AlertCircle className="w-4 h-4 shrink-0" />
                                                        <span>Peringatan: Stok barang saat ini kosong atau masih dalam antrean pesan.</span>
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Jumlah</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.jumlah}
                                        onChange={e => setFormData({ ...formData, jumlah: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all font-bold"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Unit</label>
                                    <input
                                        type="text"
                                        readOnly
                                        disabled
                                        value={barangList.find(b => b.id === formData.barang_id)?.satuan || ''}
                                        className="w-full px-4 py-2.5 bg-gray-100 border border-gray-300 rounded-xl text-gray-500 cursor-not-allowed"
                                        placeholder="Unit"
                                    />
                                </div>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Tanggal Pengajuan</label>
                                <input
                                    type="date"
                                    required
                                    value={formData.tanggal}
                                    onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Keterangan / Keperluan</label>
                                <textarea
                                    value={formData.keterangan}
                                    onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all min-h-[100px]"
                                    placeholder="Alasan permintaan barang..."
                                />
                            </div>
                            {(() => {
                                const selected = barangList.find(b => b.id === formData.barang_id);
                                const physicalStock = selected?.jumlah ?? 0;
                                const pendingSum = (requestList || [])
                                    .filter(r => r.barang_id === formData.barang_id && r.status === 'pending')
                                    .reduce((sum, r) => sum + (r.jumlah || 0), 0);
                                const availableStock = physicalStock - pendingSum;
                                
                                const requestedQty = formData.jumlah !== '' ? parseInt(formData.jumlah) : 0;
                                const exceeded = requestedQty > availableStock && formData.barang_id !== '';
                                
                                return (
                                    <>
                                        {exceeded && (
                                            <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                                <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                                <span>Jumlah pengajuan (<strong>{requestedQty}</strong>) melebihi stok tersedia (<strong>{availableStock}</strong>). Kurangi jumlah atau tunggu antrean lain ditolak.</span>
                                            </div>
                                        )}
                                        <div className="flex items-center gap-3 pt-2">
                                            <button
                                                type="button"
                                                onClick={() => setIsModalOpen(false)}
                                                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                                            >
                                                Batal
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSaving || exceeded || requestedQty <= 0}
                                                className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ajukan Permintaan'}
                                            </button>
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
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                                Konfirmasi Persetujuan
                            </h3>
                            <button onClick={() => { setIsApproveModalOpen(false); setSelectedRequest(null); }} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="bg-gray-50 rounded-xl p-4 space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Pemohon</span>
                                    <span className="font-semibold text-gray-900">{selectedRequest.pemohon || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Sub Bagian</span>
                                    <span className="font-medium text-gray-900">{selectedRequest.sub_bagian?.nama || '-'}</span>
                                </div>
                                <div className="border-t border-gray-200"></div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Tanggal</span>
                                    <span className="font-medium text-gray-900">
                                        {new Date(selectedRequest.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}
                                    </span>
                                </div>
                                <div className="border-t border-gray-200"></div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Nama Barang</span>
                                    <span className="font-semibold text-gray-900">{selectedRequest.barang?.nama || '-'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Kode Barang</span>
                                    <span className="font-mono text-gray-700">{selectedRequest.barang?.kode || '-'}</span>
                                </div>
                                <div className="border-t border-gray-200"></div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Jumlah Barang (Stok)</span>
                                    <span className="font-bold text-blue-600">{selectedRequest.barang?.jumlah ?? 0} {selectedRequest.barang?.satuan || ''}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Jumlah Pengajuan</span>
                                    <span className="font-bold text-orange-600">{selectedRequest.jumlah} {selectedRequest.barang?.satuan || ''}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Sisa Stok (setelah disetujui)</span>
                                    <span className={`font-bold ${((selectedRequest.barang?.jumlah ?? 0) - selectedRequest.jumlah) < 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                                        {(selectedRequest.barang?.jumlah ?? 0) - selectedRequest.jumlah} {selectedRequest.barang?.satuan || ''}
                                    </span>
                                </div>
                            </div>

                            {((selectedRequest.barang?.jumlah ?? 0) - selectedRequest.jumlah) < 0 && (
                                <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-700">
                                    <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
                                    <span>Stok tidak mencukupi! Sisa stok akan menjadi negatif jika disetujui.</span>
                                </div>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Catatan (opsional)</label>
                                <textarea
                                    value={approvalNote}
                                    onChange={e => setApprovalNote(e.target.value)}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 transition-all min-h-[80px]"
                                    placeholder="Catatan tambahan..."
                                />
                            </div>

                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => { setIsApproveModalOpen(false); setSelectedRequest(null); }}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    disabled={isSaving}
                                    onClick={() => handleUpdateStatus(selectedRequest.id, 'disetujui')}
                                    className="flex-1 px-4 py-2.5 bg-emerald-600 text-white rounded-xl hover:bg-emerald-700 transition-all shadow-sm shadow-emerald-100 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disetujui'}
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
