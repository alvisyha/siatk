'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    X,
    Loader2,
    Briefcase,
    AlertCircle,
    Info
} from 'lucide-react';

interface SubBagian {
    id: string;
    nama: string;
    deskripsi: string | null;
    created_at: string;
}

export default function SubBagianPage() {
    const [subBagianList, setSubBagianList] = useState<SubBagian[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingSubBagian, setEditingSubBagian] = useState<SubBagian | null>(null);
    const [subBagianToDelete, setSubBagianToDelete] = useState<SubBagian | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nama: '',
        deskripsi: ''
    });

    useEffect(() => {
        fetchSubBagian();
    }, []);

    const fetchSubBagian = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/sub-bagian');
            if (res.ok) {
                const data = await res.json();
                setSubBagianList(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch sub-bagian:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (subBagian?: SubBagian) => {
        if (subBagian) {
            setEditingSubBagian(subBagian);
            setFormData({
                nama: subBagian.nama,
                deskripsi: subBagian.deskripsi || ''
            });
        } else {
            setEditingSubBagian(null);
            setFormData({
                nama: '',
                deskripsi: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSubBagian(null);
    };

    const handleDeleteClick = (subBagian: SubBagian) => {
        setSubBagianToDelete(subBagian);
        setIsDeleteModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const url = editingSubBagian ? `/api/sub-bagian/${editingSubBagian.id}` : '/api/sub-bagian';
            const method = editingSubBagian ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchSubBagian();
                handleCloseModal();
            } else {
                const errorData = await res.json();
                alert(`Gagal menyimpan data sub bagian: ${errorData.error || 'Terjadi kesalahan'}\nDetail: ${errorData.details || 'Tidak ada detail'}`);
            }
        } catch (error) {
            console.error('Error saving sub-bagian:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!subBagianToDelete) return;
        setIsSaving(true);

        try {
            const res = await fetch(`/api/sub-bagian/${subBagianToDelete.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setSubBagianList(prev => prev.filter(s => s.id !== subBagianToDelete.id));
                setIsDeleteModalOpen(false);
                setSubBagianToDelete(null);
            } else {
                const errorData = await res.json();
                alert(`Gagal menghapus sub bagian: ${errorData.error || 'Terjadi kesalahan'}\nDetail: ${errorData.details || 'Tidak ada detail'}`);
            }
        } catch (error) {
            console.error('Error deleting sub-bagian:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredSubBagian = (subBagianList || []).filter(s =>
        s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.deskripsi && s.deskripsi.toLowerCase().includes(searchTerm.toLowerCase()))
    );



    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Master Sub Bagian</h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola data sub bagian organisasi</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Sub Bagian
                </button>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-gray-900">
                <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari sub bagian..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-4">Nama Sub Bagian</th>
                                <th className="px-6 py-4">Deskripsi</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                                        <p>Memuat data sub bagian...</p>
                                    </td>
                                </tr>
                            ) : filteredSubBagian.length === 0 ? (
                                <tr>
                                    <td colSpan={3} className="px-6 py-10 text-center text-gray-500">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Info className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p>Tidak ada data sub bagian.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredSubBagian.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                    <Briefcase className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium text-gray-900">{item.nama}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 font-medium text-gray-700">
                                            {/* Pagu column removed */}
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            {item.deskripsi || '-'}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleOpenModal(item)}
                                                    className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                    title="Edit"
                                                >
                                                    <Edit className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteClick(item)}
                                                    className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
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

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden animate-in zoom-in duration-300">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white">
                            <h3 className="text-lg font-semibold text-gray-900">
                                {editingSubBagian ? 'Edit Sub Bagian' : 'Tambah Sub Bagian'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Sub Bagian</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nama}
                                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Contoh: Kepegawaian, Keuangan, Tata Usaha"
                                />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Deskripsi (Opsional)</label>
                                <textarea
                                    value={formData.deskripsi}
                                    onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px]"
                                    placeholder="Keterangan mengenai sub bagian ini..."
                                />
                            </div>
                            <div className="flex items-center gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={handleCloseModal}
                                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                                >
                                    Batal
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-100 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
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

            {/* Modal Delete */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-6 animate-in zoom-in duration-300">
                        <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Hapus Sub Bagian?</h3>
                        <p className="text-gray-500 text-center text-sm mb-6">
                            Apakah Anda yakin ingin menghapus sub bagian <span className="font-semibold text-gray-900">"{subBagianToDelete?.nama}"</span>? Tindakan ini tidak dapat dibatalkan.
                        </p>
                        <div className="flex flex-col gap-2">
                            <button
                                onClick={handleDeleteConfirm}
                                disabled={isSaving}
                                className="w-full py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all font-medium flex items-center justify-center gap-2"
                            >
                                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Hapus'}
                            </button>
                            <button
                                onClick={() => setIsDeleteModalOpen(false)}
                                className="w-full py-2.5 border border-gray-200 text-gray-700 rounded-xl hover:bg-gray-50 transition-all font-medium"
                            >
                                Batal
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
