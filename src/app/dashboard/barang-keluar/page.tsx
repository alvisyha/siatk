'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    X,
    Loader2,
    ArrowUpRight,
    Info,
    Calendar,
    Package,
    Edit,
    Trash2,
    AlertCircle
} from 'lucide-react';

interface Barang {
    id: string;
    nama: string;
    kode: string | null;
}

interface SubBagian {
    id: string;
    nama: string;
}

interface BarangKeluar {
    id: string;
    barang_id: string;
    kode_transaksi: string | null;
    jumlah: number;
    tanggal: string;
    penerima: string | null;
    keterangan: string | null;
    stok: number | null;
    barang?: {
        nama: string;
        kode: string | null;
        satuan: string | null;
    };
}

export default function BarangKeluarPage() {
    const [transaksiList, setTransaksiList] = useState<BarangKeluar[]>([]);
    const [barangList, setBarangList] = useState<Barang[]>([]);
    const [subBagianList, setSubBagianList] = useState<SubBagian[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingTransaksi, setEditingTransaksi] = useState<BarangKeluar | null>(null);
    const [transaksiToDelete, setTransaksiToDelete] = useState<BarangKeluar | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        barang_id: '',
        jumlah: '',
        tanggal: new Date().toISOString().split('T')[0],
        penerima: '',
        keterangan: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [resTransaksi, resBarang, resSubBagian] = await Promise.all([
                fetch('/api/barang-keluar'),
                fetch('/api/barang'),
                fetch('/api/sub-bagian')
            ]);

            if (resTransaksi.ok) {
                const data = await resTransaksi.json();
                setTransaksiList(data.data);
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
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (transaksi?: BarangKeluar) => {
        if (transaksi) {
            setEditingTransaksi(transaksi);
            setFormData({
                barang_id: transaksi.barang_id,
                jumlah: transaksi.jumlah.toString(),
                tanggal: transaksi.tanggal.split('T')[0],
                penerima: transaksi.penerima || '',
                keterangan: transaksi.keterangan || ''
            });
        } else {
            setEditingTransaksi(null);
            setFormData({
                barang_id: '',
                jumlah: '',
                tanggal: new Date().toISOString().split('T')[0],
                penerima: '',
                keterangan: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleDeleteClick = (transaksi: BarangKeluar) => {
        setTransaksiToDelete(transaksi);
        setIsDeleteModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const url = editingTransaksi ? `/api/barang-keluar/${editingTransaksi.id}` : '/api/barang-keluar';
            const method = editingTransaksi ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchData();
                setIsModalOpen(false);
            } else {
                const errorData = await res.json();
                alert(`${errorData.error}${errorData.details ? `: ${errorData.details}` : ''}`);
            }
        } catch (error) {
            console.error('Error saving transaction:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!transaksiToDelete) return;
        setIsSaving(true);

        try {
            const res = await fetch(`/api/barang-keluar/${transaksiToDelete.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                fetchData();
                setIsDeleteModalOpen(false);
                setTransaksiToDelete(null);
            } else {
                const errorData = await res.json();
                alert(`Gagal menghapus: ${errorData.error}`);
            }
        } catch (error) {
            console.error('Error deleting transaction:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredTransaksi = transaksiList.filter(t =>
        t.barang?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.penerima?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.barang?.kode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Barang Keluar</h1>
                    <p className="text-gray-500 text-sm mt-1">Catat dan pantau pengeluaran stok barang</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-sm shadow-red-200 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Barang Keluar
                </button>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-gray-900">
                <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari transaksi atau penerima..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Kode</th>
                                <th className="px-6 py-4">Tanggal</th>
                                <th className="px-6 py-4">Barang</th>
                                <th className="px-6 py-4">Jumlah</th>
                                <th className="px-6 py-4">Stok</th>
                                <th className="px-6 py-4">Penerima</th>
                                <th className="px-6 py-4 text-center">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-red-500" />
                                        <p>Memuat data transaksi...</p>
                                    </td>
                                </tr>
                            ) : filteredTransaksi.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-6 py-10 text-center text-gray-500">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Info className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p>Tidak ada riwayat barang keluar.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredTransaksi.map((tr) => (
                                    <tr key={tr.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-xs text-blue-600 font-semibold">
                                            {tr.kode_transaksi || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {new Date(tr.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{tr.barang?.nama}</div>
                                            <div className="text-xs text-gray-500 font-mono">{tr.barang?.kode || '-'}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-red-100 text-red-800 border-none">
                                                -{tr.jumlah} {tr.barang?.satuan || ''}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="font-medium text-blue-600">
                                                {tr.stok ?? '-'} {tr.barang?.satuan || ''}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">{tr.penerima || '-'}</td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="flex items-center justify-center gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(tr)}
                                                    className="p-1.5 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Edit Transaksi"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(tr)}
                                                    className="p-1.5 text-gray-500 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Hapus Transaksi"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Add/Edit Transaksi */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <ArrowUpRight className="w-5 h-5 text-red-600" />
                                {editingTransaksi ? 'Edit Barang Keluar' : 'Tambah Barang Keluar'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2">
                                    <Package className="w-4 h-4" /> Pilih Barang
                                </label>
                                <select
                                    required
                                    disabled={!!editingTransaksi}
                                    value={formData.barang_id}
                                    onChange={e => setFormData({ ...formData, barang_id: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all border-none shadow-none disabled:bg-gray-100 disabled:cursor-not-allowed"
                                >
                                    <option value="">-- Pilih Barang --</option>
                                    {barangList.map(b => (
                                        <option key={b.id} value={b.id}>
                                            {b.nama} {b.kode ? `(${b.kode})` : ''}
                                        </option>
                                    ))}
                                </select>
                                {editingTransaksi && (
                                    <p className="mt-1 text-xs text-gray-500">Barang tidak dapat diubah pada transaksi yang sudah ada.</p>
                                )}
                                {formData.barang_id && (() => {
                                    const selectedBarang = barangList.find(b => b.id === formData.barang_id);
                                    if (selectedBarang && selectedBarang.stok != null) {
                                        return (
                                            <p className="mt-2 text-sm text-gray-600 flex items-center gap-1.5">
                                                <Info className="w-4 h-4 text-blue-500" />
                                                Sisa Stok: <strong className="text-gray-900">{selectedBarang.stok} {selectedBarang.satuan || ''}</strong>
                                            </p>
                                        );
                                    }
                                    return null;
                                })()}
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 ">Jumlah</label>
                                    <input
                                        type="number"
                                        required
                                        min="1"
                                        value={formData.jumlah}
                                        onChange={e => setFormData({ ...formData, jumlah: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all border-none"
                                        placeholder="0"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 ">Unit</label>
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

                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5 flex items-center gap-2 border-none">
                                        <Calendar className="w-4 h-4" /> Tanggal
                                    </label>
                                    <input
                                        type="date"
                                        required
                                        value={formData.tanggal}
                                        onChange={e => setFormData({ ...formData, tanggal: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all border-none"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 border-none">Penerima / Tujuan</label>
                                <select
                                    value={formData.penerima}
                                    onChange={e => setFormData({ ...formData, penerima: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all border-none"
                                >
                                    <option value="">-- Pilih Penerima --</option>
                                    {subBagianList.map(s => (
                                        <option key={s.id} value={s.nama}>{s.nama}</option>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5 border-none">Keterangan</label>
                                <textarea
                                    value={formData.keterangan}
                                    onChange={e => setFormData({ ...formData, keterangan: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-red-500 transition-all min-h-[80px] border-none"
                                    placeholder="Alasan pengeluaran barang..."
                                />
                            </div>

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
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-sm shadow-red-100 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? (
                                        <>
                                            <Loader2 className="w-4 h-4 animate-spin" />
                                            Menyimpan...
                                        </>
                                    ) : (
                                        'Simpan'
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center animate-in zoom-in duration-300">
                        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-8 h-8" />
                        </div>
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Hapus Transaksi?</h3>
                        <p className="text-gray-500 mb-6">
                            Apakah Anda yakin ingin menghapus transaksi <span className="font-semibold text-gray-900">{transaksiToDelete?.kode_transaksi}</span>?
                            <br />Stok barang akan dikembalikan (bertambah) secara otomatis.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isSaving}
                                className="flex-1 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-sm shadow-red-100 font-medium flex items-center justify-center gap-2"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Hapus'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
