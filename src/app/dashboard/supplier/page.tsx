'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    X,
    Loader2,
    Truck,
    AlertCircle,
    Info,
    Phone,
    MapPin
} from 'lucide-react';

interface Supplier {
    id: string;
    nama: string;
    alamat: string | null;
    telepon: string | null;
    created_at: string;
}

export default function SupplierPage() {
    const [supplierList, setSupplierList] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingSupplier, setEditingSupplier] = useState<Supplier | null>(null);
    const [supplierToDelete, setSupplierToDelete] = useState<Supplier | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        nama: '',
        alamat: '',
        telepon: ''
    });

    useEffect(() => {
        fetchSuppliers();
    }, []);

    const fetchSuppliers = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/supplier');
            if (res.ok) {
                const data = await res.json();
                setSupplierList(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch suppliers:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (supplier?: Supplier) => {
        if (supplier) {
            setEditingSupplier(supplier);
            setFormData({
                nama: supplier.nama,
                alamat: supplier.alamat || '',
                telepon: supplier.telepon || ''
            });
        } else {
            setEditingSupplier(null);
            setFormData({
                nama: '',
                alamat: '',
                telepon: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingSupplier(null);
    };

    const handleDeleteClick = (supplier: Supplier) => {
        setSupplierToDelete(supplier);
        setIsDeleteModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const url = editingSupplier ? `/api/supplier/${editingSupplier.id}` : '/api/supplier';
            const method = editingSupplier ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });

            if (res.ok) {
                fetchSuppliers();
                handleCloseModal();
            } else {
                const errorData = await res.json();
                alert(`Gagal menyimpan: ${errorData.error || 'Terjadi kesalahan'}`);
            }
        } catch (error) {
            console.error('Error saving supplier:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!supplierToDelete) return;
        setIsSaving(true);

        try {
            const res = await fetch(`/api/supplier/${supplierToDelete.id}`, {
                method: 'DELETE'
            });

            if (res.ok) {
                setSupplierList(prev => prev.filter(s => s.id !== supplierToDelete.id));
                setIsDeleteModalOpen(false);
                setSupplierToDelete(null);
            } else {
                const errorData = await res.json();
                alert(`Gagal menghapus: ${errorData.error || 'Terjadi kesalahan'}`);
            }
        } catch (error) {
            console.error('Error deleting supplier:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const filteredSuppliers = (supplierList || []).filter(s =>
        s.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (s.alamat && s.alamat.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Master Supplier</h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola data vendor dan pemasok barang</p>
                </div>
                <button
                    onClick={() => handleOpenModal()}
                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 font-medium"
                >
                    <Plus className="w-4 h-4" />
                    Tambah Supplier
                </button>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-gray-900">
                <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari supplier..."
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
                                <th className="px-6 py-4">Nama Supplier</th>
                                <th className="px-6 py-4">Telepon</th>
                                <th className="px-6 py-4">Alamat</th>
                                <th className="px-6 py-4 text-right">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                                        <p>Memuat data supplier...</p>
                                    </td>
                                </tr>
                            ) : filteredSuppliers.length === 0 ? (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-gray-500">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Info className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p>Tidak ada data supplier.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredSuppliers.map((item) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600 shrink-0">
                                                    <Truck className="w-4 h-4" />
                                                </div>
                                                <span className="font-medium text-gray-900">{item.nama}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-center gap-2">
                                                <Phone className="w-3.5 h-3.5" />
                                                {item.telepon || '-'}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600">
                                            <div className="flex items-start gap-2 max-w-xs">
                                                <MapPin className="w-3.5 h-3.5 mt-0.5" />
                                                <span className="truncate">{item.alamat || '-'}</span>
                                            </div>
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
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between bg-white text-gray-900">
                            <h3 className="text-lg font-semibold">
                                {editingSupplier ? 'Edit Supplier' : 'Tambah Supplier'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-5">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Nama Supplier</label>
                                <input
                                    type="text"
                                    required
                                    value={formData.nama}
                                    onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="Contoh: PT. ATK Jaya Mandiri"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Telepon</label>
                                <input
                                    type="text"
                                    value={formData.telepon}
                                    onChange={e => setFormData({ ...formData, telepon: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                                    placeholder="0812xxxxxxxx"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">Alamat</label>
                                <textarea
                                    value={formData.alamat}
                                    onChange={e => setFormData({ ...formData, alamat: e.target.value })}
                                    className="w-full px-4 py-2.5 bg-gray-50 border border-gray-300 rounded-xl text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all min-h-[100px]"
                                    placeholder="Alamat lengkap supplier..."
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
                                    className="flex-1 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-100 font-medium disabled:opacity-50 flex items-center justify-center gap-2"
                                >
                                    {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : editingSupplier ? 'Simpan' : 'Tambah'}
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
                        <h3 className="text-lg font-bold text-gray-900 text-center mb-2">Hapus Supplier?</h3>
                        <p className="text-gray-500 text-center text-sm mb-6">
                            Apakah Anda yakin ingin menghapus supplier <span className="font-semibold text-gray-900">"{supplierToDelete?.nama}"</span>? Tindakan ini tidak dapat dibatalkan.
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
