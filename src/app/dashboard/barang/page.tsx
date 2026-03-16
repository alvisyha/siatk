'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    X,
    Loader2,
    Box,
    MapPin,
    Tag,
    AlertCircle
} from 'lucide-react';

interface Barang {
    id: string;
    nama: string;
    kode: string | null;
    satuan: string | null;
    deskripsi: string | null;
    created_at: string;
}

interface Ruangan {
    id: string;
    nama: string;
}

interface Satuan {
    id: string;
    nama: string;
}

export default function BarangPage() {
    const [barangList, setBarangList] = useState<Barang[]>([]);

    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingBarang, setEditingBarang] = useState<Barang | null>(null);
    const [barangToDelete, setBarangToDelete] = useState<Barang | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nama: '',
        kode: '',
        satuan: '',
        deskripsi: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const resBarang = await fetch('/api/barang');

            if (resBarang.ok) {
                const data = await resBarang.json();
                setBarangList(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (barang?: Barang) => {
        if (barang) {
            setEditingBarang(barang);
            setFormData({
                nama: barang.nama,
                kode: barang.kode || '',
                satuan: barang.satuan || '',
                deskripsi: barang.deskripsi || ''
            });
        } else {
            setEditingBarang(null);
            setFormData({
                nama: '',
                kode: '',
                satuan: '',
                deskripsi: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingBarang(null);
    };

    const handleDeleteClick = (barang: Barang) => {
        setBarangToDelete(barang);
        setIsDeleteModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const url = editingBarang ? `/api/barang/${editingBarang.id}` : '/api/barang';
            const method = editingBarang ? 'PUT' : 'POST';

        const payload = {
            ...formData
        };
             const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                // Refresh list
                const resBarang = await fetch('/api/barang');
                const data = await resBarang.json();
                setBarangList(data.data);

                handleCloseModal();
            } else {
                alert('Gagal menyimpan data barang');
            }
        } catch (error) {
            console.error('Error saving barang:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!barangToDelete) return;
        setIsSaving(true);

        try {
            const res = await fetch(`/api/barang/${barangToDelete.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                // Refresh list locally or fetch
                setBarangList(prev => prev.filter(b => b.id !== barangToDelete.id));
                setIsDeleteModalOpen(false);
                setBarangToDelete(null);
            } else {
                alert('Gagal menghapus barang');
            }
        } catch (error) {
            console.error('Error deleting barang:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredBarang = barangList.filter(barang =>
        barang.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (barang.kode && barang.kode.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (barang.deskripsi && barang.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Barang</h1>
                    <p className="text-gray-500 mt-1">Kelola data inventaris barang disini.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    <Plus className="w-5 h-5" />
                    <span>Tambah Barang</span>
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                {/* Tools */}
                <div className="p-4 border-b border-gray-200 bg-gray-50/50 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari barang..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 w-32">Kode</th>
                                <th className="px-6 py-3">Nama Barang</th>
                                <th className="px-6 py-3">Satuan</th>
                                <th className="px-6 py-3">Keterangan</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" />
                                        Memuat data barang...
                                    </td>
                                </tr>
                            ) : filteredBarang.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-8 text-center text-gray-500">
                                        Tidak ada data barang ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredBarang.map((barang) => (
                                    <tr key={barang.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-6 py-4 font-mono text-sm text-gray-600">
                                            {barang.kode || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                    <Box className="w-4 h-4" />
                                                </div>
                                                <p className="font-medium text-gray-900">{barang.nama}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {barang.satuan || '-'}
                                        </td>
                                        <td className="px-6 py-4">
                                            <p className="text-gray-500 text-sm truncate max-w-sm">
                                                {barang.deskripsi || '-'}
                                            </p>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => handleOpenModal(barang)}
                                                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(barang)}
                                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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

            {/* Edit/Create Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingBarang ? 'Edit Barang' : 'Tambah Barang Baru'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Barang</label>
                                    <input
                                        type="text"
                                        value={formData.kode}
                                        onChange={e => setFormData({ ...formData, kode: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Contoh: BRG-001"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nama}
                                        onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="Contoh: Laptop Dell"
                                    />
                                </div>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                                <input
                                    type="text"
                                    value={formData.satuan}
                                    onChange={e => setFormData({ ...formData, satuan: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Contoh: Pcs, Rim, Box, Lusin"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <textarea
                                    rows={3}
                                    value={formData.deskripsi}
                                    onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    placeholder="Deskripsi tambahan..."
                                />
                            </div>

                            <div className="pt-4 flex justify-end gap-3 border-t border-gray-100 mt-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2"
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingBarang ? 'Simpan Perubahan' : 'Tambah Barang'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Barang?</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Apakah Anda yakin ingin menghapus <span className="font-semibold text-gray-900">{barangToDelete?.nama}</span>? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex justify-center gap-3">
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                            >
                                Batal
                            </button>
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2"
                            >
                                {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                Hapus
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
