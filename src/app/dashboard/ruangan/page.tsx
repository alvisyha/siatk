'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    X,
    Loader2,
    DoorOpen,
    MapPin,
    AlertCircle,
    Info
} from 'lucide-react';

interface Ruangan {
    id: string;
    nama: string;
    lokasi: string | null;
    deskripsi: string | null;
    created_at: string;
}

export default function RuanganPage() {
    const [ruanganList, setRuanganList] = useState<Ruangan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingRuangan, setEditingRuangan] = useState<Ruangan | null>(null);
    const [ruanganToDelete, setRuanganToDelete] = useState<Ruangan | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nama: '',
        lokasi: '',
        deskripsi: ''
    });

    useEffect(() => {
        fetchRuangan();
    }, []);

    const fetchRuangan = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/ruangan');
            if (res.ok) {
                const data = await res.json();
                setRuanganList(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch ruangan:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (ruangan?: Ruangan) => {
        if (ruangan) {
            setEditingRuangan(ruangan);
            setFormData({
                nama: ruangan.nama,
                lokasi: ruangan.lokasi || '',
                deskripsi: ruangan.deskripsi || ''
            });
        } else {
            setEditingRuangan(null);
            setFormData({
                nama: '',
                lokasi: '',
                deskripsi: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingRuangan(null);
    };

    const handleDeleteClick = (ruangan: Ruangan) => {
        setRuanganToDelete(ruangan);
        setIsDeleteModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const url = editingRuangan ? `/api/ruangan/${editingRuangan.id}` : '/api/ruangan';
            const method = editingRuangan ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                await fetchRuangan();
                handleCloseModal();
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Gagal menyimpan data ruangan');
            }
        } catch (error) {
            console.error('Error saving ruangan:', error);
            alert('Terjadi kesalahan saat menyimpan');
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!ruanganToDelete) return;
        setIsSaving(true);

        try {
            const res = await fetch(`/api/ruangan/${ruanganToDelete.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setRuanganList(prev => prev.filter(r => r.id !== ruanganToDelete.id));
                setIsDeleteModalOpen(false);
                setRuanganToDelete(null);
            } else {
                const errorData = await res.json();
                alert(errorData.error || 'Gagal menghapus ruangan');
            }
        } catch (error) {
            console.error('Error deleting ruangan:', error);
            alert('Terjadi kesalahan saat menghapus');
        } finally {
            setIsSaving(false);
        }
    };

    const filteredRuangan = ruanganList.filter(ruangan =>
        ruangan.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (ruangan.lokasi && ruangan.lokasi.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (ruangan.deskripsi && ruangan.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Manajemen Ruangan</h1>
                    <p className="text-gray-500 mt-1">Kelola data ruangan dan lokasi inventaris.</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-sm"
                >
                    <Plus className="w-5 h-5" />
                    <span>Tambah Ruangan</span>
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
                            placeholder="Cari ruangan..."
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
                                <th className="px-6 py-3">Nama Ruangan</th>
                                <th className="px-6 py-3">Lokasi</th>
                                <th className="px-6 py-3">Deskripsi</th>
                                <th className="px-6 py-3 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-blue-600" />
                                        Memuat data ruangan...
                                    </td>
                                </tr>
                            ) : filteredRuangan.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-8 text-center text-gray-500">
                                        Tidak ada data ruangan ditemukan.
                                    </td>
                                </tr>
                            ) : (
                                filteredRuangan.map((ruangan) => (
                                    <tr key={ruangan.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                    <DoorOpen className="w-4 h-4" />
                                                </div>
                                                <p className="font-medium text-gray-900">{ruangan.nama}</p>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <MapPin className="w-3.5 h-3.5 text-gray-400" />
                                                <span>{ruangan.lokasi || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Info className="w-3.5 h-3.5 text-gray-400" />
                                                <span className="truncate max-w-[250px]">{ruangan.deskripsi || '-'}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(ruangan)}
                                                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(ruangan)}
                                                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                    title="Hapus"
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
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingRuangan ? 'Edit Ruangan' : 'Tambah Ruangan Baru'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Ruangan</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nama}
                                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Contoh: Ruang Lab Komputer"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Lokasi</label>
                                <input
                                    type="text"
                                    value={formData.lokasi}
                                    onChange={e => setFormData({ ...formData, lokasi: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Contoh: Gedung A, Lantai 2"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi</label>
                                <textarea
                                    rows={3}
                                    value={formData.deskripsi}
                                    onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
                                    placeholder="Deskripsi tambahan tentang ruangan..."
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
                                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
                                >
                                    {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                                    {editingRuangan ? 'Simpan Perubahan' : 'Tambah Ruangan'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center animate-in fade-in zoom-in duration-200">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Ruangan?</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Apakah Anda yakin ingin menghapus <span className="font-semibold text-gray-900">{ruanganToDelete?.nama}</span>? Ruangan yang dihapus mungkin masih terhubung dengan data barang.
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
                                className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
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
