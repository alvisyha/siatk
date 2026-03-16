'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Loader2,
    Info,
    MoreVertical,
    Eye,
    Edit3,
    ExternalLink,
    ArrowDownLeft,
    ArrowUpRight,
    Edit,
    Trash2,
    AlertCircle,
    X
} from 'lucide-react';
import Link from 'next/link';

interface DataATK {
    id: string;
    kode: string | null;
    nama: string;
    harga: number;
    satuan: string;
    masuk: number;
    keluar: number;
    sisa: number;
    keterangan: string;
}

export default function DataATKPage() {
    const [dataList, setDataList] = useState<DataATK[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [activeMenuId, setActiveMenuId] = useState<string | null>(null);

    // Auth & Modals State
    const [user, setUser] = useState<any>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<DataATK | null>(null);
    const [itemToDelete, setItemToDelete] = useState<DataATK | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [formData, setFormData] = useState({
        nama: '',
        kode: '',
        satuan: '',
        deskripsi: ''
    });

    useEffect(() => {
        fetchUser();
        fetchData();
        // Close menus on click outside
        const handleClick = () => setActiveMenuId(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (res.ok) {
                const data = await res.json();
                setUser(data.user);
            }
        } catch (error) {
            console.error('Failed to fetch user:', error);
        }
    };

    const handleOpenModal = (item: DataATK) => {
        setEditingItem(item);
        setFormData({
            nama: item.nama,
            kode: item.kode || '',
            satuan: item.satuan || '',
            deskripsi: item.keterangan || ''
        });
        setIsModalOpen(true);
        setActiveMenuId(null);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleDeleteClick = (item: DataATK) => {
        setItemToDelete(item);
        setIsDeleteModalOpen(true);
        setActiveMenuId(null);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = `/api/barang/${editingItem?.id}`;
            const res = await fetch(url, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(formData)
            });
            if (res.ok) {
                fetchData();
                handleCloseModal();
            } else {
                alert('Gagal menyimpan data');
            }
        } catch (error) {
            console.error('Error saving:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleDeleteConfirm = async () => {
        if (!itemToDelete) return;
        setIsSaving(true);
        try {
            const res = await fetch(`/api/barang/${itemToDelete.id}`, {
                method: 'DELETE'
            });
            if (res.ok) {
                fetchData();
                setIsDeleteModalOpen(false);
                setItemToDelete(null);
            } else {
                const errorData = await res.json();
                console.error('Delete failed:', errorData);
                alert(`Gagal menghapus data: ${errorData.error || 'Terjadi kesalahan'}`);
            }
        } catch (error) {
            console.error('Error deleting:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const res = await fetch('/api/data-atk', { cache: 'no-store' });
            if (res.ok) {
                const data = await res.json();
                setDataList(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch data ATK:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const filteredData = dataList.filter(item =>
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Data ATK</h1>
                    <p className="text-gray-500 text-sm mt-1">Stok dan ringkasan mutasi Alat Tulis Kantor</p>
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-gray-900">
                <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari barang atau kode..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                            <tr>
                                <th className="px-4 py-4 text-center w-16">No</th>
                                <th className="px-4 py-4 w-[20%]">Kode Barang</th>
                                <th className="px-6 py-4 w-[50%]">Nama Barang</th>
                                <th className="px-4 py-4 text-center">Sisa</th>
                                <th className="px-4 py-4 text-center w-24">Aksi</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                                        <p>Memuat data summary ATK...</p>
                                    </td>
                                </tr>
                            ) : filteredData.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-10 text-center text-gray-500">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Info className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p>Tidak ada data barang.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredData.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                                        <td className="px-4 py-4 text-center text-gray-500">{index + 1}</td>
                                        <td className="px-4 py-4 font-mono text-xs text-blue-600 font-semibold">{item.kode || '-'}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{item.nama}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                                                item.sisa > 10 ? 'bg-blue-100 text-blue-700' : 
                                                item.sisa > 0 ? 'bg-yellow-100 text-yellow-700' : 
                                                'bg-red-100 text-red-700'
                                            }`}>
                                                {item.sisa} {item.satuan}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center relative">
                                            <button 
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setActiveMenuId(activeMenuId === item.id ? null : item.id);
                                                }}
                                                className="p-1.5 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600"
                                            >
                                                <MoreVertical className="w-4 h-4" />
                                            </button>

                                            {activeMenuId === item.id && (
                                                <div className="absolute right-4 top-10 w-40 bg-white rounded-xl shadow-lg border border-gray-100 z-50 py-1 overflow-hidden animate-in fade-in zoom-in duration-150">
                                                    <Link 
                                                        href={`/dashboard/barang-masuk?search=${item.nama}`}
                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-emerald-50 hover:text-emerald-700 transition-colors"
                                                    >
                                                        <ArrowDownLeft className="w-4 h-4" />
                                                        Riwayat Masuk
                                                    </Link>
                                                    <Link 
                                                        href={`/dashboard/barang-keluar?search=${item.nama}`}
                                                        className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-orange-50 hover:text-orange-700 transition-colors"
                                                    >
                                                        <ArrowUpRight className="w-4 h-4" />
                                                        Riwayat Keluar
                                                    </Link>
                                                    
                                                    {user?.role === 'admin' ? (
                                                        <>
                                                            <div className="border-t border-gray-50 my-1"></div>
                                                            <button 
                                                                onClick={() => handleOpenModal(item)}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                                Edit Barang
                                                            </button>
                                                            <button 
                                                                onClick={() => handleDeleteClick(item)}
                                                                className="w-full flex items-center gap-2 px-4 py-2 text-sm text-red-600 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                                Hapus Barang
                                                            </button>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <div className="border-t border-gray-50 my-1"></div>
                                                            <Link 
                                                                href="/dashboard/barang"
                                                                className="flex items-center gap-2 px-4 py-2 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                                Edit Master
                                                            </Link>
                                                        </>
                                                    )}
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Edit Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-semibold text-gray-900">
                                Edit Barang
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4 text-left">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Barang</label>
                                    <input
                                        type="text"
                                        value={formData.kode}
                                        onChange={e => setFormData({ ...formData, kode: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Deskripsi / Keterangan</label>
                                <textarea
                                    rows={3}
                                    value={formData.deskripsi}
                                    onChange={e => setFormData({ ...formData, deskripsi: e.target.value })}
                                    className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                                    Simpan Perubahan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm overflow-hidden p-6 text-center">
                        <div className="w-12 h-12 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
                            <AlertCircle className="w-6 h-6" />
                        </div>
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Data ATK?</h3>
                        <p className="text-gray-500 text-sm mb-6">
                            Apakah Anda yakin ingin menghapus <span className="font-semibold text-gray-900">{itemToDelete?.nama}</span>? Tindakan ini tidak dapat dibatalkan.
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
