'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
    Search,
    Plus,
    Edit,
    Trash2,
    X,
    Loader2,
    Info,
    AlertCircle,
    Box,
    Ban,
    ChevronDown,
    ArrowUpDown,
    ArrowUp,
    ArrowDown
} from 'lucide-react';

interface BarangItem {
    id: string;
    kode: string | null;
    nama: string;
    satuan_id: string | null;
    satuan?: {
        id: string;
        nama: string;
    } | null;
    deskripsi: string | null;
    stok_minimum: number;
    status: boolean;
    stok: number;
}

interface Satuan {
    id: string;
    nama: string;
}

export default function DataBarangPage() {
    const [barangList, setBarangList] = useState<BarangItem[]>([]);
    const [satuanList, setSatuanList] = useState<Satuan[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [user, setUser] = useState<any>(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [editingItem, setEditingItem] = useState<BarangItem | null>(null);
    const [itemToDelete, setItemToDelete] = useState<BarangItem | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [deleteMessage, setDeleteMessage] = useState('');
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const [isImportDropdownOpen, setIsImportDropdownOpen] = useState(false);
    const [sortConfig, setSortConfig] = useState<{ key: keyof BarangItem | 'satuan.nama'; direction: 'asc' | 'desc' | null }>({ key: 'nama', direction: 'asc' });
    const fileInputRef = useState<HTMLInputElement | null>(null)[1];
    
    // work around for typing useRef
    const getFileInputRef = (node: HTMLInputElement | null) => {
        if (node) {
            (fileInputRef as any) = node;
        }
    };

    const [formData, setFormData] = useState({
        nama: '',
        kode: '',
        satuan_id: '',
        deskripsi: '',
        stok_minimum: '0',
        stok: '0'
    });

    useEffect(() => {
        fetchUser();
        fetchData();
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

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [resBarang, resSatuan, resAtk] = await Promise.all([
                fetch('/api/barang'),
                fetch('/api/satuan'),
                fetch('/api/data-atk')
            ]);

            let barangData: any[] = [];
            let satuanData: any[] = [];
            let atkData: any[] = [];

            if (resSatuan.ok) {
                const data = await resSatuan.json();
                satuanData = data.data || [];
                setSatuanList(satuanData);
            } else {
                const rawText = await resSatuan.text().catch(() => 'No text body');
                console.error(`API Error (Satuan) - Status: ${resSatuan.status}`, { body: rawText });
            }

            if (resBarang.ok) {
                const data = await resBarang.json();
                barangData = data.data || [];
            } else {
                const rawText = await resBarang.text().catch(() => 'No text body');
                console.error(`API Error (Barang) - Status: ${resBarang.status}`, {
                    status: resBarang.status,
                    statusText: resBarang.statusText,
                    body: rawText
                });
                try {
                    const errJson = JSON.parse(rawText);
                    console.error('API Error (Barang) JSON:', errJson);
                } catch (e) {
                    console.error('API Error (Barang) is NOT JSON');
                }
            }

            if (resAtk.ok) {
                const data = await resAtk.json();
                atkData = data.data || [];
            } else {
                const rawText = await resAtk.text().catch(() => 'No text body');
                console.error(`API Error (Atk) - Status: ${resAtk.status}`, { body: rawText });
            }

            // Map barang to its unit name using the fetched satuan list
            const merged = barangData.map((b: any) => {
                const sName = satuanData.find(s => s.id === b.satuan_id)?.nama || null;
                return {
                    id: b.id,
                    kode: b.kode || null,
                    nama: b.nama || 'Tanpa Nama',
                    satuan_id: b.satuan_id || null,
                    satuan: sName ? { id: b.satuan_id, nama: sName } : null,
                    deskripsi: b.deskripsi || null,
                    stok_minimum: b.stok_minimum || 0,
                    status: b.status !== undefined ? b.status : true,
                    stok: b.stok || 0
                };
            });

            setBarangList(merged);
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const isAdmin = user?.role === 'admin';

    const generateNewKode = () => {
        if (!barangList || barangList.length === 0) return 'ATK-001';
        
        const codes = barangList
            .map(b => b.kode)
            .filter(k => k && k.startsWith('ATK-'))
            .map(k => {
                const numStr = k!.substring(4);
                const num = parseInt(numStr);
                return isNaN(num) ? 0 : num;
            });
            
        if (codes.length === 0) return 'ATK-001';
        
        const maxCode = Math.max(...codes);
        return `ATK-${String(maxCode + 1).padStart(3, '0')}`;
    };

    const handleOpenModal = (item?: BarangItem) => {
        if (item) {
            setEditingItem(item);
            setFormData({
                nama: item.nama,
                kode: item.kode || '',
                satuan_id: item.satuan_id || '',
                deskripsi: item.deskripsi || '',
                stok_minimum: (item.stok_minimum || 0).toString(),
                stok: (item.stok || 0).toString()
            });
        } else {
            setEditingItem(null);
            setFormData({
                nama: '',
                kode: generateNewKode(),
                satuan_id: '',
                deskripsi: '',
                stok_minimum: '0',
                stok: '0'
            });
        }
        setIsModalOpen(true);
    };

    const handleCloseModal = () => {
        setIsModalOpen(false);
        setEditingItem(null);
    };

    const handleDeleteClick = (item: BarangItem) => {
        setItemToDelete(item);
        setDeleteMessage('');
        setIsDeleteModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            const url = editingItem ? `/api/barang/${editingItem.id}` : '/api/barang';
            const method = editingItem ? 'PUT' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    ...formData,
                    stok_minimum: parseInt(formData.stok_minimum) || 0,
                    stok: parseInt(formData.stok) || 0
                })
            });

            if (res.ok) {
                fetchData();
                handleCloseModal();
            } else {
                const errorData = await res.json();
                alert(`Gagal menyimpan: ${errorData.error || 'Terjadi kesalahan'}`);
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

            const data = await res.json();
            if (res.ok) {
                if (data.softDeleted) {
                    setDeleteMessage(data.message);
                    setTimeout(() => {
                        setIsDeleteModalOpen(false);
                        setItemToDelete(null);
                        setDeleteMessage('');
                        fetchData();
                    }, 2000);
                } else {
                    fetchData();
                    setIsDeleteModalOpen(false);
                    setItemToDelete(null);
                }
            } else {
                alert(`Gagal menghapus: ${data.error || 'Terjadi kesalahan'}`);
            }
        } catch (error) {
            console.error('Error deleting:', error);
        } finally {
            setIsSaving(false);
        }
    };

    const handleReactivate = async (item: BarangItem) => {
        try {
            const res = await fetch(`/api/barang/${item.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: true })
            });
            if (res.ok) fetchData();
        } catch (error) {
            console.error('Error reactivating:', error);
        }
    };

    const handleSort = (key: keyof BarangItem | 'satuan.nama') => {
        let direction: 'asc' | 'desc' | null = 'asc';
        if (sortConfig.key === key && sortConfig.direction === 'asc') {
            direction = 'desc';
        } else if (sortConfig.key === key && sortConfig.direction === 'desc') {
            direction = null;
        }
        setSortConfig({ key, direction });
    };

    const exportToPDF = () => {
        const doc = new jsPDF();
        
        doc.setFontSize(16);
        doc.text('Laporan Data Barang', 14, 15);
        doc.setFontSize(10);
        doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 22);
        
        const tableColumn = ["No", "Kode", "Nama Barang", "Satuan", "Stok", "Minimal", "Status"];
        const tableRows: any[] = [];

        sortedBarang.forEach((item, index) => {
            const rowData = [
                index + 1,
                item.kode || '-',
                item.nama,
                item.satuan?.nama || '-',
                item.stok,
                item.stok_minimum,
                item.status === true ? 'Aktif' : 'Nonaktif'
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [41, 128, 185], textColor: 255 }
        });

        doc.save(`data_barang_${new Date().getTime()}.pdf`);
    };

    const exportToExcel = () => {
        const worksheetData = sortedBarang.map((item, index) => ({
            "No": index + 1,
            "Kode": item.kode || '-',
            "Nama Barang": item.nama,
            "Satuan": item.satuan?.nama || '-',
            "Stok": item.stok,
            "Stok Minimal": item.stok_minimum,
            "Status": item.status === true ? 'Aktif' : 'Nonaktif',
            "Deskripsi": item.deskripsi || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Data Barang");
        XLSX.writeFile(workbook, `data_barang_${new Date().getTime()}.xlsx`);
    };

    const downloadExcelTemplate = () => {
        const templateData = [
            {
                "Kode": "ATK-001",
                "Nama Barang": "Kertas A4",
                "Satuan": "Rim",
                "Stok Minimum": 5,
                "Stok": 10,
                "Deskripsi": "Kertas hvs 80gr"
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template Import Barang");
        XLSX.writeFile(workbook, `template_import_barang.xlsx`);
    };

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsLoading(true);
        const reader = new FileReader();
        reader.onload = async (event) => {
            try {
                const data = event.target?.result;
                const workbook = XLSX.read(data, { type: 'binary' });
                const sheetName = workbook.SheetNames[0];
                const worksheet = workbook.Sheets[sheetName];
                const jsonData = XLSX.utils.sheet_to_json(worksheet);

                const res = await fetch('/api/barang/import', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ data: jsonData })
                });

                const result = await res.json();
                if (res.ok) {
                    alert(result.message);
                    fetchData();
                } else {
                    alert(`Gagal import: ${result.error}`);
                }
            } catch (error) {
                console.error('Error parsing excel:', error);
                alert('Gagal membaca file excel. Pastikan format sesuai.');
            } finally {
                setIsLoading(false);
                if (e.target) e.target.value = ''; // reset file input
            }
        };
        reader.readAsBinaryString(file);
    };

    const filteredBarang = barangList
        .filter(item => {
            const nameMatch = (item.nama || '').toLowerCase().includes(searchTerm.toLowerCase());
            const codeMatch = (item.kode || '').toLowerCase().includes(searchTerm.toLowerCase());
            return nameMatch || codeMatch;
        });

    const sortedBarang = [...filteredBarang].sort((a, b) => {
        if (!sortConfig.direction || !sortConfig.key) {
            // Default sort: status then name
            if (a.status !== b.status) return a.status ? -1 : 1;
            return (a.nama || '').localeCompare(b.nama || '', undefined, { numeric: true, sensitivity: 'base' });
        }

        let aValue: any;
        let bValue: any;

        if (sortConfig.key === 'satuan.nama') {
            aValue = a.satuan?.nama || '';
            bValue = b.satuan?.nama || '';
        } else {
            aValue = a[sortConfig.key as keyof BarangItem] ?? '';
            bValue = b[sortConfig.key as keyof BarangItem] ?? '';
        }

        // Use localeCompare for strings (Natural Sort)
        if (typeof aValue === 'string' && typeof bValue === 'string') {
            const comparison = aValue.localeCompare(bValue, undefined, { numeric: true, sensitivity: 'base' });
            return sortConfig.direction === 'asc' ? comparison : -comparison;
        }

        // Standard comparison for numbers/booleans
        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
    });

    const getStokBadge = (item: BarangItem) => {
        if (item.stok <= 0) return 'bg-red-100 text-red-700';
        if (item.stok <= item.stok_minimum) return 'bg-yellow-100 text-yellow-700';
        return 'bg-blue-100 text-blue-700';
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">Data Barang</h1>
                    <p className="text-gray-500 text-sm mt-1">Kelola data master barang dan pantau stok</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <input 
                        type="file" 
                        accept=".xlsx, .xls" 
                        className="hidden" 
                        id="import-excel" 
                        onChange={handleFileUpload}
                    />
                    {isAdmin && (
                        <div className="relative">
                            <button
                                onClick={() => setIsImportDropdownOpen(!isImportDropdownOpen)}
                                className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 font-medium"
                            >
                                Import Excel
                                <ChevronDown className={`w-4 h-4 transition-transform ${isImportDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            
                            {isImportDropdownOpen && (
                                <>
                                    <div 
                                        className="fixed inset-0 z-10" 
                                        onClick={() => setIsImportDropdownOpen(false)}
                                    />
                                    <div className="absolute left-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in duration-150">
                                        <button
                                            onClick={() => {
                                                document.getElementById('import-excel')?.click();
                                                setIsImportDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                                        >
                                            Upload Excel
                                        </button>
                                        <button
                                            onClick={() => {
                                                downloadExcelTemplate();
                                                setIsImportDropdownOpen(false);
                                            }}
                                            className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-blue-50 hover:text-blue-700 transition-colors text-left"
                                        >
                                            Download Template
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    
                    {/* Export Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-all shadow-sm shadow-red-200 font-medium"
                        >
                            Export
                            <ChevronDown className={`w-4 h-4 transition-transform ${isExportDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isExportDropdownOpen && (
                            <>
                                <div 
                                    className="fixed inset-0 z-10" 
                                    onClick={() => setIsExportDropdownOpen(false)}
                                />
                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-xl border border-gray-100 z-20 py-1 overflow-hidden animate-in fade-in zoom-in duration-150">
                                    <button
                                        onClick={() => {
                                            exportToPDF();
                                            setIsExportDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-700 transition-colors text-left"
                                    >
                                        Export PDF
                                    </button>
                                    <button
                                        onClick={() => {
                                            exportToExcel();
                                            setIsExportDropdownOpen(false);
                                        }}
                                        className="w-full flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 hover:bg-green-50 hover:text-green-700 transition-colors text-left"
                                    >
                                        Export Excel
                                    </button>
                                </div>
                            </>
                        )}
                    </div>

                    {isAdmin && (
                        <button
                            onClick={() => handleOpenModal()}
                            className="flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-all shadow-sm shadow-blue-200 font-medium"
                        >
                            <Plus className="w-4 h-4" />
                            Tambah Barang
                        </button>
                    )}
                </div>
            </div>

            {/* Table Card */}
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden text-gray-900">
                <div className="p-4 border-b border-gray-100 bg-gray-50/30 flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari barang..."
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
                                <th className="px-4 py-4 text-center w-14">No</th>
                                <th 
                                    className="px-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('kode')}
                                >
                                    <div className="flex items-center gap-1">
                                        Kode
                                        {sortConfig.key === 'kode' && sortConfig.direction ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                        ) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                                    </div>
                                </th>
                                <th 
                                    className="px-6 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('nama')}
                                >
                                    <div className="flex items-center gap-1">
                                        Nama Barang
                                        {sortConfig.key === 'nama' && sortConfig.direction ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                        ) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                                    </div>
                                </th>
                                <th 
                                    className="px-4 py-4 cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('satuan.nama')}
                                >
                                    <div className="flex items-center gap-1">
                                        Satuan
                                        {sortConfig.key === 'satuan.nama' && sortConfig.direction ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                        ) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                                    </div>
                                </th>
                                <th 
                                    className="px-4 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('stok')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Stok
                                        {sortConfig.key === 'stok' && sortConfig.direction ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                        ) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                                    </div>
                                </th>
                                <th 
                                    className="px-4 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('stok_minimum')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Stok Min.
                                        {sortConfig.key === 'stok_minimum' && sortConfig.direction ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                        ) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                                    </div>
                                </th>
                                <th 
                                    className="px-4 py-4 text-center cursor-pointer hover:bg-gray-100 transition-colors"
                                    onClick={() => handleSort('status')}
                                >
                                    <div className="flex items-center justify-center gap-1">
                                        Status
                                        {sortConfig.key === 'status' && sortConfig.direction ? (
                                            sortConfig.direction === 'asc' ? <ArrowUp className="w-4 h-4" /> : <ArrowDown className="w-4 h-4" />
                                        ) : <ArrowUpDown className="w-3 h-3 text-gray-400" />}
                                    </div>
                                </th>
                                {isAdmin && <th className="px-4 py-4 text-center w-24">Aksi</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={isAdmin ? 8 : 7} className="px-6 py-10 text-center text-gray-500">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-blue-500" />
                                        <p>Memuat data barang...</p>
                                    </td>
                                </tr>
                            ) : filteredBarang.length === 0 ? (
                                <tr>
                                    <td colSpan={isAdmin ? 8 : 7} className="px-6 py-10 text-center text-gray-500">
                                        <div className="w-12 h-12 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Info className="w-6 h-6 text-gray-400" />
                                        </div>
                                        <p>Data barang kosong.</p>
                                    </td>
                                </tr>
                            ) : (
                                sortedBarang.map((item, index) => (
                                    <tr key={item.id} className={`hover:bg-gray-50/50 transition-colors ${item.status === false ? 'opacity-50 bg-gray-100' : ''}`}>
                                        <td className="px-4 py-4 text-center text-gray-500">{index + 1}</td>
                                        <td className="px-4 py-4 font-mono text-xs text-blue-600 font-semibold">{item.kode || '-'}</td>
                                        <td className="px-6 py-4">
                                            <div className="font-medium text-gray-900">{item.nama}</div>
                                            {item.deskripsi && <div className="text-xs text-gray-500 mt-0.5">{item.deskripsi}</div>}
                                        </td>
                                         <td className="px-4 py-4 text-gray-600">{item.satuan?.nama || '-'}</td>
                                        <td className="px-4 py-4 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStokBadge(item)}`}>
                                                {item.stok}
                                            </span>
                                        </td>
                                        <td className="px-4 py-4 text-center text-gray-600">{item.stok_minimum}</td>
                                        <td className="px-4 py-4 text-center">
                                            {item.status === false ? (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500 border border-gray-300">
                                                    <Ban className="w-3 h-3" /> Nonaktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                    Aktif
                                                </span>
                                            )}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-4 py-4 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {item.status === false ? (
                                                        <button
                                                            onClick={() => handleReactivate(item)}
                                                            className="px-2 py-1 text-xs text-blue-600 hover:bg-blue-50 rounded-lg transition-all font-medium"
                                                            title="Aktifkan Kembali"
                                                        >
                                                            Aktifkan
                                                        </button>
                                                    ) : (
                                                        <>
                                                            <button
                                                                onClick={() => handleOpenModal(item)}
                                                                className="p-1.5 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all"
                                                                title="Edit Barang"
                                                            >
                                                                <Edit className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDeleteClick(item)}
                                                                className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all"
                                                                title="Hapus Barang"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Modal Add/Edit */}
            {isModalOpen && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-gray-900/50 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
                        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
                            <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                <Box className="w-5 h-5 text-blue-600" />
                                {editingItem ? 'Edit Barang' : 'Tambah Barang'}
                            </h3>
                            <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600">
                                <X className="w-5 h-5" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4 text-left">
                            <div className="grid grid-cols-1 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Nama Barang <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.nama}
                                        onChange={e => setFormData({ ...formData, nama: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Kode Barang</label>
                                    <input
                                        type="text"
                                        readOnly={!!editingItem}
                                        value={formData.kode}
                                        onChange={e => setFormData({ ...formData, kode: e.target.value })}
                                        className={`w-full px-3 py-2 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                                            editingItem ? 'bg-gray-100 text-gray-500 cursor-not-allowed' : 'bg-gray-50'
                                        }`}
                                        placeholder="Otomatis (ATK-XXX)"
                                        title={editingItem ? 'Kode barang tidak dapat diubah setelah dibuat' : 'Kode barang otomatis atau manual'}
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Satuan</label>
                                    {editingItem ? (
                                        <input
                                            type="text"
                                            readOnly
                                            value={editingItem.satuan?.nama || '-'}
                                            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                                        />
                                    ) : (
                                        <select
                                            value={formData.satuan_id}
                                            onChange={e => setFormData({ ...formData, satuan_id: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="">-- Pilih Satuan --</option>
                                            {satuanList.map(s => (
                                                <option key={s.id} value={s.id}>{s.nama}</option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stok Awal</label>
                                    {editingItem ? (
                                        <input
                                            type="text"
                                            readOnly
                                            value={formData.stok}
                                            className="w-full px-3 py-2 bg-gray-100 border border-gray-300 rounded-lg text-gray-500 cursor-not-allowed"
                                            title="Stok hanya bisa diubah melalui menu transaksi (Barang Masuk/Keluar)"
                                        />
                                    ) : (
                                        <input
                                            type="number"
                                            min="0"
                                            value={formData.stok}
                                            onChange={e => setFormData({ ...formData, stok: e.target.value })}
                                            className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">Stok Minimal</label>
                                    <input
                                        type="number"
                                        min="0"
                                        value={formData.stok_minimum}
                                        onChange={e => setFormData({ ...formData, stok_minimum: e.target.value })}
                                        className="w-full px-3 py-2 bg-gray-50 border border-gray-300 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
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
                                    Simpan
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
                        <h3 className="text-lg font-bold text-gray-900 mb-2">Hapus Barang?</h3>
                        {deleteMessage ? (
                            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg text-sm text-yellow-700">
                                {deleteMessage}
                            </div>
                        ) : (
                            <p className="text-gray-500 text-sm mb-6">
                                Apakah Anda yakin ingin menghapus <span className="font-semibold text-gray-900">{itemToDelete?.nama}</span>?
                                Jika barang sudah digunakan dalam transaksi, statusnya akan diubah menjadi nonaktif.
                            </p>
                        )}
                        {!deleteMessage && (
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
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
