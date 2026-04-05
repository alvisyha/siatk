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
        stok_minimum: '',
        stok: ''
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
                stok_minimum: '',
                stok: ''
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

        // Check for duplicate name
        const isDuplicate = barangList.some(
            b => b.nama.toLowerCase().trim() === formData.nama.toLowerCase().trim() && b.id !== editingItem?.id
        );

        if (isDuplicate) {
            alert('Nama barang sudah terdaftar! Gunakan nama lain.');
            return;
        }

        const parsedStokMinimum = parseInt(formData.stok_minimum);
        if (isNaN(parsedStokMinimum) || parsedStokMinimum <= 0) {
            alert('Stok minimal harus berupa angka dan lebih dari 0');
            return;
        }

        if (!editingItem) {
            const parsedStok = parseInt(formData.stok);
            if (isNaN(parsedStok) || parsedStok <= 0) {
                alert('Stok awal harus berupa angka dan lebih dari 0');
                return;
            }
        }

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
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{color:'var(--text-primary)'}}>Data Barang</h1>
                    <p className="text-sm mt-1" style={{color:'var(--text-secondary)'}}>Kelola data master barang dan pantau stok</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <input type="file" accept=".xlsx, .xls" className="hidden" id="import-excel" onChange={handleFileUpload} />
                    {isAdmin && (
                        <div className="relative">
                            <button
                                onClick={() => setIsImportDropdownOpen(!isImportDropdownOpen)}
                                className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all"
                                style={{background:'var(--primary)',color:'#fff',boxShadow:'0 2px 8px rgba(99,102,241,0.25)',border:'none',cursor:'pointer'}}
                            >
                                Import Excel
                                <ChevronDown className={`w-4 h-4 transition-transform ${isImportDropdownOpen ? 'rotate-180' : ''}`} />
                            </button>
                            {isImportDropdownOpen && (
                                <>
                                    <div className="fixed inset-0 z-10" onClick={() => setIsImportDropdownOpen(false)} />
                                    <div className="absolute left-0 mt-2 w-44 rounded-xl z-20 py-1 overflow-hidden animate-scale-in" style={{background:'var(--surface)',border:'1px solid var(--border)',boxShadow:'var(--shadow-lg)'}}>
                                        <button onClick={() => { document.getElementById('import-excel')?.click(); setIsImportDropdownOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors" style={{color:'var(--text-secondary)'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--primary-light)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>Upload Excel</button>
                                        <button onClick={() => { downloadExcelTemplate(); setIsImportDropdownOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left transition-colors" style={{color:'var(--text-secondary)'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--primary-light)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>Download Template</button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                    <div className="relative">
                        <button
                            onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)}
                            className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg transition-all"
                            style={{background:'var(--danger)',color:'#fff',boxShadow:'0 2px 8px rgba(220,38,38,0.2)',border:'none',cursor:'pointer'}}
                        >
                            Export
                            <ChevronDown className={`w-4 h-4 transition-transform ${isExportDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isExportDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsExportDropdownOpen(false)} />
                                <div className="absolute right-0 mt-2 w-44 rounded-xl z-20 py-1 overflow-hidden animate-scale-in" style={{background:'var(--surface)',border:'1px solid var(--border)',boxShadow:'var(--shadow-lg)'}}>
                                    <button onClick={() => { exportToPDF(); setIsExportDropdownOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left" style={{color:'var(--text-secondary)'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--danger-light)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>Export PDF</button>
                                    <button onClick={() => { exportToExcel(); setIsExportDropdownOpen(false); }} className="w-full flex items-center gap-2 px-4 py-2 text-sm text-left" style={{color:'var(--text-secondary)'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--teal-light)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>Export Excel</button>
                                </div>
                            </>
                        )}
                    </div>
                    {isAdmin && (
                        <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg" style={{background:'var(--primary)',color:'#fff',boxShadow:'0 2px 8px rgba(99,102,241,0.25)',border:'none',cursor:'pointer'}}>
                            <Plus className="w-4 h-4" />
                            Tambah Barang
                        </button>
                    )}
                </div>
            </div>

            {/* Table Card */}
            <div className="rounded-xl overflow-hidden" style={{background:'var(--surface)',border:'1px solid var(--border)',boxShadow:'var(--shadow-sm)'}}>
                <div className="p-4 flex flex-col sm:flex-row gap-3 items-start sm:items-center" style={{borderBottom:'1px solid var(--border)',background:'var(--bg)'}}>
                    <div className="relative flex-1 max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'var(--text-muted)'}} />
                        <input
                            type="text"
                            placeholder="Cari barang..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none transition-all"
                            style={{background:'var(--surface)',border:'1.5px solid var(--border)',color:'var(--text-primary)'}}
                            onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}}
                            onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}}
                        />
                    </div>
                </div>

                <div className="overflow-x-auto min-h-[400px]">
                    <table className="w-full text-left text-sm min-w-[800px]">
                        <thead style={{background:'var(--bg)',borderBottom:'1px solid var(--border)'}}>
                            <tr>
                                <th className="px-4 py-3 text-center w-14" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>No</th>
                                <th className="px-4 py-3 cursor-pointer transition-colors" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}} onClick={() => handleSort('kode')}>
                                    <div className="flex items-center gap-1">Kode {sortConfig.key==='kode'&&sortConfig.direction?(sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>):<ArrowUpDown className="w-3 h-3"/>}</div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer transition-colors" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}} onClick={() => handleSort('nama')}>
                                    <div className="flex items-center gap-1">Nama Barang {sortConfig.key==='nama'&&sortConfig.direction?(sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>):<ArrowUpDown className="w-3 h-3"/>}</div>
                                </th>
                                <th className="px-4 py-3 cursor-pointer" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}} onClick={() => handleSort('satuan.nama')}>
                                    <div className="flex items-center gap-1">Satuan {sortConfig.key==='satuan.nama'&&sortConfig.direction?(sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>):<ArrowUpDown className="w-3 h-3"/>}</div>
                                </th>
                                <th className="px-4 py-3 text-center cursor-pointer" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}} onClick={() => handleSort('stok')}>
                                    <div className="flex items-center justify-center gap-1">Stok {sortConfig.key==='stok'&&sortConfig.direction?(sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>):<ArrowUpDown className="w-3 h-3"/>}</div>
                                </th>
                                <th className="px-4 py-3 text-center cursor-pointer" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}} onClick={() => handleSort('stok_minimum')}>
                                    <div className="flex items-center justify-center gap-1">Min {sortConfig.key==='stok_minimum'&&sortConfig.direction?(sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>):<ArrowUpDown className="w-3 h-3"/>}</div>
                                </th>
                                <th className="px-4 py-3 text-center cursor-pointer" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}} onClick={() => handleSort('status')}>
                                    <div className="flex items-center justify-center gap-1">Status {sortConfig.key==='status'&&sortConfig.direction?(sortConfig.direction==='asc'?<ArrowUp className="w-3 h-3"/>:<ArrowDown className="w-3 h-3"/>):<ArrowUpDown className="w-3 h-3"/>}</div>
                                </th>
                                {isAdmin && <th className="px-4 py-3 text-center w-20" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Aksi</th>}
                            </tr>
                        </thead>
                        <tbody style={{color:'var(--text-primary)'}}>
                            {isLoading ? (
                                <tr><td colSpan={isAdmin ? 8 : 7} className="py-14 text-center" style={{color:'var(--text-muted)'}}>
                                    <Loader2 className="w-7 h-7 animate-spin mx-auto mb-2" style={{color:'var(--primary)'}} />
                                    <p className="text-sm">Memuat data...</p>
                                </td></tr>
                            ) : filteredBarang.length === 0 ? (
                                <tr><td colSpan={isAdmin ? 8 : 7} className="py-14 text-center" style={{color:'var(--text-muted)'}}>
                                    <Info className="w-8 h-8 mx-auto mb-2" style={{color:'var(--text-muted)'}} />
                                    <p className="text-sm">Data barang kosong.</p>
                                </td></tr>
                            ) : (
                                sortedBarang.map((item, index) => (
                                    <tr key={item.id} className="transition-colors" style={{borderTop:'1px solid var(--border)',opacity:item.status===false?0.55:1,background:item.status===false?'var(--bg)':'transparent'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--bg)')} onMouseLeave={e=>(e.currentTarget.style.background=item.status===false?'var(--bg)':'transparent')}>
                                        <td className="px-4 py-3.5 text-center text-xs" style={{color:'var(--text-muted)'}}>{index + 1}</td>
                                        <td className="px-4 py-3.5 font-mono text-xs font-semibold" style={{color:'var(--primary)'}}>{item.kode || '-'}</td>
                                        <td className="px-4 py-3.5">
                                            <div className="font-medium text-sm" style={{color:'var(--text-primary)'}}>{item.nama}</div>
                                            {item.deskripsi && <div className="text-xs mt-0.5" style={{color:'var(--text-muted)'}}>{item.deskripsi}</div>}
                                        </td>
                                        <td className="px-4 py-3.5 text-sm" style={{color:'var(--text-secondary)'}}>{item.satuan?.nama || '-'}</td>
                                        <td className="px-4 py-3.5 text-center">
                                            <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${getStokBadge(item)}`}>{item.stok}</span>
                                        </td>
                                        <td className="px-4 py-3.5 text-center text-sm" style={{color:'var(--text-secondary)'}}>{item.stok_minimum}</td>
                                        <td className="px-4 py-3.5 text-center">
                                            {item.status === false ? (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{background:'var(--bg)',color:'var(--text-muted)',border:'1px solid var(--border)'}}>
                                                    <Ban className="w-3 h-3" /> Nonaktif
                                                </span>
                                            ) : (
                                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium" style={{background:'var(--teal-light)',color:'var(--teal)'}}>
                                                    Aktif
                                                </span>
                                            )}
                                        </td>
                                        {isAdmin && (
                                            <td className="px-4 py-3.5 text-center">
                                                <div className="flex items-center justify-center gap-1">
                                                    {item.status === false ? (
                                                        <button onClick={() => handleReactivate(item)} className="px-2.5 py-1 text-xs font-semibold rounded-lg transition-all" style={{color:'var(--primary)',background:'var(--primary-light)',border:'none',cursor:'pointer'}}>Aktifkan</button>
                                                    ) : (
                                                        <>
                                                            <button onClick={() => handleOpenModal(item)} className="p-1.5 rounded-lg transition-all" style={{color:'var(--text-muted)',background:'transparent',border:'none',cursor:'pointer'}} title="Edit" onMouseEnter={e=>{(e.currentTarget as any).style.background='var(--primary-light)';(e.currentTarget as any).style.color='var(--primary)'}} onMouseLeave={e=>{(e.currentTarget as any).style.background='transparent';(e.currentTarget as any).style.color='var(--text-muted)'}}><Edit className="w-4 h-4" /></button>
                                                            <button onClick={() => handleDeleteClick(item)} className="p-1.5 rounded-lg transition-all" style={{color:'var(--text-muted)',background:'transparent',border:'none',cursor:'pointer'}} title="Hapus" onMouseEnter={e=>{(e.currentTarget as any).style.background='var(--danger-light)';(e.currentTarget as any).style.color='var(--danger)'}} onMouseLeave={e=>{(e.currentTarget as any).style.background='transparent';(e.currentTarget as any).style.color='var(--text-muted)'}}><Trash2 className="w-4 h-4" /></button>
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
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-16 md:pt-4 pointer-events-none">
                    <div className="w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto animate-scale-in pointer-events-auto" style={{background:'var(--surface)',borderRadius:'16px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--border)'}}>
                        <div className="px-6 py-4 flex items-center justify-between sticky top-0 z-10" style={{borderBottom:'1px solid var(--border)',background:'var(--surface)'}}>
                            <h3 className="text-base font-bold flex items-center gap-2" style={{color:'var(--text-primary)'}}>
                                <Box className="w-4 h-4" style={{color:'var(--primary)'}} />
                                {editingItem ? 'Edit Barang' : 'Tambah Barang'}
                            </h3>
                            <button onClick={handleCloseModal} className="p-1.5 rounded-lg transition-colors" style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--text-muted)'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--bg)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                                <X className="w-4 h-4" />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Nama Barang <span style={{color:'var(--danger)'}}>*</span></label>
                                <input type="text" required value={formData.nama} onChange={e=>setFormData({...formData,nama:e.target.value})} className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-primary)',fontFamily:'inherit'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Kode Barang</label>
                                    <input type="text" readOnly={!!editingItem} value={formData.kode} onChange={e=>setFormData({...formData,kode:e.target.value})} placeholder="Otomatis" title={editingItem?'Kode tidak bisa diubah':''} className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all" style={{border:'1.5px solid var(--border)',background:editingItem?'var(--bg)':'var(--surface)',color:editingItem?'var(--text-muted)':'var(--text-primary)',cursor:editingItem?'not-allowed':'text',fontFamily:'monospace'}} />
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Satuan</label>
                                    {editingItem ? (
                                        <input type="text" readOnly value={editingItem.satuan?.nama||'-'} className="w-full px-3 py-2.5 text-sm rounded-lg" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-muted)',cursor:'not-allowed',outline:'none'}} />
                                    ) : (
                                        <select value={formData.satuan_id} onChange={e=>setFormData({...formData,satuan_id:e.target.value})} className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-primary)',fontFamily:'inherit'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';}}>
                                            <option value="">-- Pilih Satuan --</option>
                                            {satuanList.map(s=>(<option key={s.id} value={s.id}>{s.nama}</option>))}
                                        </select>
                                    )}
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Stok Awal <span style={{color:'var(--danger)'}}>*</span></label>
                                    {editingItem ? (
                                        <input type="text" readOnly value={formData.stok} title="Ubah melalui transaksi" className="w-full px-3 py-2.5 text-sm rounded-lg" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-muted)',cursor:'not-allowed',outline:'none'}} />
                                    ) : (
                                        <input type="number" min="1" required value={formData.stok} onChange={e=>setFormData({...formData,stok:e.target.value})} className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-primary)',fontFamily:'inherit'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}} />
                                    )}
                                </div>
                                <div>
                                    <label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Stok Minimal <span style={{color:'var(--danger)'}}>*</span></label>
                                    <input type="number" min="1" required value={formData.stok_minimum} onChange={e=>setFormData({...formData,stok_minimum:e.target.value})} className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-primary)',fontFamily:'inherit'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}} />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Deskripsi</label>
                                <textarea rows={3} value={formData.deskripsi} onChange={e=>setFormData({...formData,deskripsi:e.target.value})} className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all resize-none" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-primary)',fontFamily:'inherit'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}} />
                            </div>
                            <div className="flex justify-end gap-2 pt-3" style={{borderTop:'1px solid var(--border)'}}>
                                <button type="button" onClick={handleCloseModal} className="px-4 py-2 text-sm font-medium rounded-lg transition-all" style={{background:'var(--bg)',color:'var(--text-secondary)',border:'1px solid var(--border)',cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--border)')} onMouseLeave={e=>(e.currentTarget.style.background='var(--bg)')}>Batal</button>
                                <button type="submit" disabled={isSaving} className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2 transition-all" style={{background:isSaving?'#a5b4fc':'var(--primary)',color:'#fff',border:'none',cursor:isSaving?'not-allowed':'pointer',boxShadow:'0 2px 8px rgba(99,102,241,0.25)'}}>
                                    {isSaving&&<Loader2 className="w-4 h-4 animate-spin"/>}Simpan
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Delete Confirmation Modal */}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-16 md:pt-4 pointer-events-none">
                    <div className="w-full max-w-sm p-6 text-center animate-scale-in pointer-events-auto" style={{background:'var(--surface)',borderRadius:'16px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--border)'}}>
                        <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4" style={{background:'var(--danger-light)'}}>
                            <AlertCircle className="w-5 h-5" style={{color:'var(--danger)'}} />
                        </div>
                        <h3 className="text-base font-bold mb-2" style={{color:'var(--text-primary)'}}>Hapus Barang?</h3>
                        {deleteMessage ? (
                            <div className="mb-5 p-3 rounded-lg text-sm" style={{background:'var(--amber-light)',border:'1px solid #fde68a',color:'var(--amber)'}}>{deleteMessage}</div>
                        ) : (
                            <p className="text-sm mb-5" style={{color:'var(--text-secondary)'}}>
                                Yakin hapus <span className="font-semibold" style={{color:'var(--text-primary)'}}>{itemToDelete?.nama}</span>? Jika sudah dipakai dalam transaksi, status akan diubah menjadi nonaktif.
                            </p>
                        )}
                        {!deleteMessage && (
                            <div className="flex justify-center gap-2">
                                <button onClick={()=>setIsDeleteModalOpen(false)} className="px-4 py-2 text-sm font-medium rounded-lg transition-all" style={{background:'var(--bg)',color:'var(--text-secondary)',border:'1px solid var(--border)',cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--border)')} onMouseLeave={e=>(e.currentTarget.style.background='var(--bg)')}>Batal</button>
                                <button onClick={handleDeleteConfirm} disabled={isSaving} className="px-4 py-2 text-sm font-medium rounded-lg flex items-center gap-2" style={{background:isSaving?'#fca5a5':'var(--danger)',color:'#fff',border:'none',cursor:isSaving?'not-allowed':'pointer',boxShadow:'0 2px 8px rgba(220,38,38,0.2)'}}>
                                    {isSaving&&<Loader2 className="w-4 h-4 animate-spin"/>}Hapus
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
