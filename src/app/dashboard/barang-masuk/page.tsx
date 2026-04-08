'use client';

import { useState, useEffect } from 'react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import {
    Search,
    Plus,
    X,
    Loader2,
    ArrowDownLeft,
    Info,
    Calendar,
    Package,
    Edit,
    Trash2,
    AlertCircle,
    Banknote,
    ChevronDown
} from 'lucide-react';

interface Barang {
    id: string;
    nama: string;
    kode: string | null;
    stok?: number | null;
    satuan?: { id: string, nama: string } | null;
    status?: boolean;
}

interface Supplier {
    id: string;
    nama: string;
}

interface BarangMasuk {
    id: string;
    barang_id: string;
    kode_transaksi: string | null;
    jumlah: number;
    harga: number;
    tanggal: string;
    pemasok: string | null;
    keterangan: string | null;
    stok: number | null;
    barang?: {
        nama: string;
        kode: string | null;
        satuan: { nama: string } | null;
    };
}

export default function BarangMasukPage() {
    const [transaksiList, setTransaksiList] = useState<BarangMasuk[]>([]);
    const [barangList, setBarangList] = useState<Barang[]>([]);
    const [supplierList, setSupplierList] = useState<Supplier[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [editingTransaksi, setEditingTransaksi] = useState<BarangMasuk | null>(null);
    const [transaksiToDelete, setTransaksiToDelete] = useState<BarangMasuk | null>(null);
    const [isExportDropdownOpen, setIsExportDropdownOpen] = useState(false);
    const [isImportDropdownOpen, setIsImportDropdownOpen] = useState(false);

    // Form State
    const [formData, setFormData] = useState({
        barang_id: '',
        jumlah: '',
        harga: '',
        tanggal: new Date().toISOString().split('T')[0],
        pemasok: '',
        keterangan: ''
    });

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            const [resTransaksi, resBarang, resSupplier] = await Promise.all([
                fetch('/api/barang-masuk'),
                fetch('/api/barang'),
                fetch('/api/supplier')
            ]);

            if (resTransaksi.ok) {
                const data = await resTransaksi.json();
                setTransaksiList(data.data);
            }
            if (resBarang.ok) {
                const data = await resBarang.json();
                setBarangList(data.data);
            }
            if (resSupplier.ok) {
                const data = await resSupplier.json();
                setSupplierList(data.data);
            }
        } catch (error) {
            console.error('Failed to fetch data:', error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleOpenModal = (transaksi?: BarangMasuk) => {
        if (transaksi) {
            setEditingTransaksi(transaksi);
            setFormData({
                barang_id: transaksi.barang_id,
                jumlah: transaksi.jumlah.toString(),
                harga: (transaksi.harga || 0).toString(),
                tanggal: transaksi.tanggal.split('T')[0],
                pemasok: transaksi.pemasok || '',
                keterangan: transaksi.keterangan || ''
            });
        } else {
            setEditingTransaksi(null);
            setFormData({
                barang_id: '',
                jumlah: '',
                harga: '',
                tanggal: new Date().toISOString().split('T')[0],
                pemasok: '',
                keterangan: ''
            });
        }
        setIsModalOpen(true);
    };

    const handleDeleteClick = (transaksi: BarangMasuk) => {
        setTransaksiToDelete(transaksi);
        setIsDeleteModalOpen(true);
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);

        try {
            const url = editingTransaksi ? `/api/barang-masuk/${editingTransaksi.id}` : '/api/barang-masuk';
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
            const res = await fetch(`/api/barang-masuk/${transaksiToDelete.id}`, {
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

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('id-ID', {
            style: 'currency',
            currency: 'IDR',
            minimumFractionDigits: 0
        }).format(amount);
    };

    const filteredTransaksi = transaksiList.filter(t =>
        t.barang?.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.pemasok?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.barang?.kode?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const exportToPDF = () => {
        const doc = new jsPDF();

        doc.setFontSize(16);
        doc.text('Laporan Barang Masuk', 14, 15);
        doc.setFontSize(10);
        doc.text(`Dicetak pada: ${new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}`, 14, 22);

        const tableColumn = ["Kode", "Tanggal", "Nama Barang", "Jumlah", "Harga", "Total", "Supplier"];
        const tableRows: any[] = [];

        filteredTransaksi.forEach(tr => {
            const rowData = [
                tr.kode_transaksi || '-',
                new Date(tr.tanggal).toLocaleDateString('id-ID', { day: '2-digit', month: '2-digit', year: 'numeric' }),
                tr.barang?.nama || '-',
                `${tr.jumlah} ${tr.barang?.satuan?.nama || ''}`,
                formatCurrency(tr.harga || 0),
                formatCurrency((tr.jumlah || 0) * (tr.harga || 0)),
                tr.pemasok || '-'
            ];
            tableRows.push(rowData);
        });

        autoTable(doc, {
            head: [tableColumn],
            body: tableRows,
            startY: 28,
            theme: 'grid',
            styles: { fontSize: 8 },
            headStyles: { fillColor: [39, 174, 96], textColor: 255 }
        });

        doc.save(`barang_masuk_${new Date().getTime()}.pdf`);
    };

    const exportToExcel = () => {
        const worksheetData = filteredTransaksi.map((tr) => ({
            "Kode Transaksi": tr.kode_transaksi || '-',
            "Tanggal": new Date(tr.tanggal).toLocaleDateString('id-ID'),
            "Kode Barang": tr.barang?.kode || '-',
            "Nama Barang": tr.barang?.nama || '-',
            "Jumlah": tr.jumlah,
            "Satuan": tr.barang?.satuan?.nama || '-',
            "Harga Satuan": tr.harga,
            "Total Harga": (tr.jumlah || 0) * (tr.harga || 0),
            "Supplier": tr.pemasok || '-',
            "Keterangan": tr.keterangan || '-'
        }));

        const worksheet = XLSX.utils.json_to_sheet(worksheetData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Barang Masuk");
        XLSX.writeFile(workbook, `barang_masuk_${new Date().getTime()}.xlsx`);
    };

    const downloadExcelTemplate = () => {
        const templateData = [
            {
                "Kode": "ATK-001",
                "Nama Barang": "Kertas A4",
                "Jumlah": 10,
                "Harga": 50000,
                "Tanggal": new Date().toISOString().split('T')[0],
                "Supplier": "PT ATK Sejahtera",
                "Keterangan": "Stok bulanan"
            }
        ];

        const worksheet = XLSX.utils.json_to_sheet(templateData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Template Import Masuk");
        XLSX.writeFile(workbook, `template_import_masuk.xlsx`);
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

                const res = await fetch('/api/barang-masuk/import', {
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
                if (e.target) e.target.value = '';
            }
        };
        reader.readAsBinaryString(file);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>Barang Masuk</h1>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>Catat dan pantau stok barang yang masuk</p>
                </div>
                <div className="flex flex-wrap gap-2">
                    <input type="file" accept=".xlsx, .xls" className="hidden" id="import-excel" onChange={handleFileUpload} />
                    <div className="relative">
                        <button onClick={() => setIsImportDropdownOpen(!isImportDropdownOpen)} className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg" style={{ background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}>
                            Import Excel <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isImportDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isImportDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsImportDropdownOpen(false)} />
                                <div className="absolute left-0 mt-1.5 w-44 z-20 py-1 overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}>
                                    <button onClick={() => { document.getElementById('import-excel')?.click(); setIsImportDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm" style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Upload Excel</button>
                                    <button onClick={() => { downloadExcelTemplate(); setIsImportDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm" style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Download Template</button>
                                </div>
                            </>
                        )}
                    </div>
                    <div className="relative">
                        <button onClick={() => setIsExportDropdownOpen(!isExportDropdownOpen)} className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg" style={{ background: 'var(--danger)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(239,68,68,0.2)' }}>
                            Export <ChevronDown className={`w-3.5 h-3.5 transition-transform ${isExportDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        {isExportDropdownOpen && (
                            <>
                                <div className="fixed inset-0 z-10" onClick={() => setIsExportDropdownOpen(false)} />
                                <div className="absolute right-0 mt-1.5 w-44 z-20 py-1 overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', boxShadow: 'var(--shadow-lg)' }}>
                                    <button onClick={() => { exportToPDF(); setIsExportDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm" style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Export PDF</button>
                                    <button onClick={() => { exportToExcel(); setIsExportDropdownOpen(false); }} className="w-full text-left px-4 py-2.5 text-sm" style={{ color: 'var(--text-secondary)', background: 'transparent', border: 'none', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>Export Excel</button>
                                </div>
                            </>
                        )}
                    </div>
                    <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg" style={{ background: 'var(--primary)', color: '#fff', border: 'none', cursor: 'pointer', boxShadow: '0 2px 8px rgba(99,102,241,0.25)' }}>
                        <Plus className="w-4 h-4" /> Tambah Barang Masuk
                    </button>
                </div>
            </div>

            <div className="rounded-xl overflow-hidden" style={{ background: 'var(--surface)', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}>
                <div className="p-4" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg)' }}>
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--text-muted)' }} />
                        <input type="text" placeholder="Cari transaksi atau supplier..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none" style={{ border: '1.5px solid var(--border)', background: 'var(--surface)', color: 'var(--text-primary)' }} onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm min-w-[800px]">
                        <thead style={{ background: 'var(--bg)', borderBottom: '1px solid var(--border)' }}>
                            <tr>
                                <th className="px-4 py-3" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Kode</th>
                                <th className="px-4 py-3" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tanggal</th>
                                <th className="px-4 py-3" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Barang</th>
                                <th className="px-4 py-3 text-center" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Jumlah</th>
                                <th className="px-4 py-3 text-right" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Harga</th>
                                <th className="px-4 py-3 text-right" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Total</th>
                                <th className="px-4 py-3" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stok</th>
                                <th className="px-4 py-3" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Supplier</th>
                                <th className="px-4 py-3 text-center w-20" style={{ fontSize: '12px', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (<tr><td colSpan={9} className="py-14 text-center" style={{ color: 'var(--text-muted)' }}><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{ color: 'var(--primary)' }} /><p className="text-sm">Memuat data...</p></td></tr>
                            ) : filteredTransaksi.length === 0 ? (<tr><td colSpan={9} className="py-14 text-center" style={{ color: 'var(--text-muted)' }}><Info className="w-7 h-7 mx-auto mb-2" /><p className="text-sm">Tidak ada riwayat barang masuk.</p></td></tr>
                            ) : filteredTransaksi.map((tr) => (
                                <tr key={tr.id} className="transition-colors" style={{ borderTop: '1px solid var(--border)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}>
                                    <td className="px-4 py-3.5 font-mono text-xs font-semibold" style={{ color: 'var(--primary)' }}>{tr.kode_transaksi || '-'}</td>
                                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{new Date(tr.tanggal).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}</td>
                                    <td className="px-4 py-3.5"><div className="font-medium text-sm" style={{ color: 'var(--text-primary)' }}>{tr.barang?.nama}</div><div className="text-xs font-mono" style={{ color: 'var(--text-muted)' }}>{tr.barang?.kode || '-'}</div></td>
                                    <td className="px-4 py-3.5 text-center"><span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold" style={{ background: 'var(--teal-light)', color: 'var(--teal)' }}>+{tr.jumlah} {tr.barang?.satuan?.nama || ''}</span></td>
                                    <td className="px-4 py-3.5 text-right text-sm font-medium" style={{ color: 'var(--text-primary)' }}>{formatCurrency(tr.harga || 0)}</td>
                                    <td className="px-4 py-3.5 text-right text-sm font-bold" style={{ color: 'var(--primary)' }}>{formatCurrency((tr.jumlah || 0) * (tr.harga || 0))}</td>
                                    <td className="px-4 py-3.5 text-sm font-medium" style={{ color: 'var(--primary)' }}>{tr.stok ?? '-'} {tr.barang?.satuan?.nama || ''}</td>
                                    <td className="px-4 py-3.5 text-sm" style={{ color: 'var(--text-secondary)' }}>{tr.pemasok || '-'}</td>
                                    <td className="px-4 py-3.5"><div className="flex items-center justify-center gap-1">
                                        <button onClick={() => handleOpenModal(tr)} title="Edit" className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }} onMouseEnter={e => { (e.currentTarget as any).style.background = 'var(--primary-light)'; (e.currentTarget as any).style.color = 'var(--primary)'; }} onMouseLeave={e => { (e.currentTarget as any).style.background = 'transparent'; (e.currentTarget as any).style.color = 'var(--text-muted)'; }}>  <Edit className="w-4 h-4" /></button>
                                        <button onClick={() => handleDeleteClick(tr)} title="Hapus" className="p-1.5 rounded-lg transition-all" style={{ color: 'var(--text-muted)', background: 'transparent', border: 'none', cursor: 'pointer' }} onMouseEnter={e => { (e.currentTarget as any).style.background = 'var(--danger-light)'; (e.currentTarget as any).style.color = 'var(--danger)'; }} onMouseLeave={e => { (e.currentTarget as any).style.background = 'transparent'; (e.currentTarget as any).style.color = 'var(--text-muted)'; }}>  <Trash2 className="w-4 h-4" /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-16 md:pt-4 pointer-events-none">
                    <div className="w-full max-w-md overflow-hidden animate-scale-in pointer-events-auto" style={{ background: 'var(--surface)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
                        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
                            <h3 className="text-base font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
                                <ArrowDownLeft className="w-4 h-4" style={{ color: 'var(--teal)' }} />
                                {editingTransaksi ? 'Edit Barang Masuk' : 'Tambah Barang Masuk'}
                            </h3>
                            <button onClick={() => setIsModalOpen(false)} className="p-1.5 rounded-lg" style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--bg)')} onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}><Package className="w-3.5 h-3.5" /> Pilih Barang <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <select required disabled={!!editingTransaksi} value={formData.barang_id} onChange={e => setFormData({ ...formData, barang_id: e.target.value })} className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={{ border: '1.5px solid var(--border)', background: editingTransaksi ? 'var(--bg)' : 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'inherit', cursor: editingTransaksi ? 'not-allowed' : 'pointer' }} onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}>
                                    <option value="">-- Pilih Barang --</option>
                                    {barangList.filter(b => b.status !== false).map(b => (<option key={b.id} value={b.id}>{b.nama} {b.kode ? `(${b.kode})` : ''}</option>))}
                                </select>
                                {editingTransaksi && <p className="mt-1 text-xs" style={{ color: 'var(--text-muted)' }}>Barang tidak dapat diubah pada transaksi yang sudah ada.</p>}
                                {formData.barang_id && (() => { const sel = barangList.find(b => b.id === formData.barang_id); if (sel && sel.stok != null) return <p className="mt-2 text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}><Info className="w-3.5 h-3.5" style={{ color: 'var(--primary)' }} /> Sisa Stok: <strong style={{ color: 'var(--text-primary)' }}>{sel.stok} {sel.satuan?.nama || ''}</strong></p>; return null; })()}
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Jumlah <span style={{ color: 'var(--danger)' }}>*</span></label><input type="number" required min="1" value={formData.jumlah} onChange={e => setFormData({ ...formData, jumlah: e.target.value })} placeholder="0" className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={{ border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'inherit' }} onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }} /></div>
                                <div><label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Satuan</label><input type="text" readOnly disabled value={barangList.find(b => b.id === formData.barang_id)?.satuan?.nama || ''} placeholder="Satuan" className="w-full px-3 py-2.5 text-sm rounded-lg" style={{ border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text-muted)', fontFamily: 'inherit', cursor: 'not-allowed' }} /></div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}><Banknote className="w-3.5 h-3.5" /> Harga Satuan <span style={{ color: 'var(--danger)' }}>*</span></label>
                                <div className="relative"><span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm" style={{ color: 'var(--text-muted)' }}>Rp</span><input type="number" required min="0" value={formData.harga} onChange={e => setFormData({ ...formData, harga: e.target.value })} placeholder="0" className="w-full pl-9 pr-3 py-2.5 text-sm rounded-lg outline-none" style={{ border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'inherit' }} onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }} /></div>
                                {formData.barang_id && (() => { const last = transaksiList.find(t => t.barang_id === formData.barang_id); if (last) return <p className="mt-1 text-xs flex items-center gap-1" style={{ color: 'var(--text-secondary)' }}><Banknote className="w-3 h-3" /> Harga Terakhir: <strong style={{ color: 'var(--text-primary)' }}>{formatCurrency(last.harga || 0)}</strong></p>; return null; })()}
                            </div>
                            <div><label className="block text-xs font-semibold mb-1.5 flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}><Calendar className="w-3.5 h-3.5" /> Tanggal <span style={{ color: 'var(--danger)' }}>*</span></label><input type="date" required value={formData.tanggal} onChange={e => setFormData({ ...formData, tanggal: e.target.value })} className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={{ border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'inherit' }} onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }} /></div>
                            <div><label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Supplier / Sumber</label><select value={formData.pemasok} onChange={e => setFormData({ ...formData, pemasok: e.target.value })} className="w-full px-3 py-2.5 text-sm rounded-lg outline-none" style={{ border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'inherit' }} onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }}><option value="">-- Pilih Supplier --</option>{supplierList.map(s => (<option key={s.id} value={s.nama}>{s.nama}</option>))}</select></div>
                            <div><label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text-primary)' }}>Keterangan</label><textarea value={formData.keterangan} onChange={e => setFormData({ ...formData, keterangan: e.target.value })} rows={3} placeholder="Catatan tambahan..." className="w-full px-3 py-2.5 text-sm rounded-lg outline-none resize-none" style={{ border: '1.5px solid var(--border)', background: 'var(--bg)', color: 'var(--text-primary)', fontFamily: 'inherit' }} onFocus={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.boxShadow = '0 0 0 3px rgba(99,102,241,0.1)'; }} onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none'; }} /></div>
                            <div className="flex gap-2 pt-2" style={{ borderTop: '1px solid var(--border)' }}>
                                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-2 text-sm font-medium rounded-lg" style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg)')}>Batal</button>
                                <button type="submit" disabled={isSaving} className="flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2" style={{ background: isSaving ? '#a5b4fc' : 'var(--primary)', color: '#fff', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer' }}>{isSaving ? <><Loader2 className="w-4 h-4 animate-spin" />Menyimpan...</> : 'Simpan'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-16 md:pt-4 pointer-events-none">
                    <div className="w-full max-w-sm p-6 text-center animate-scale-in pointer-events-auto" style={{ background: 'var(--surface)', borderRadius: '16px', boxShadow: 'var(--shadow-lg)', border: '1px solid var(--border)' }}>
                        <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4" style={{ background: 'var(--danger-light)' }}><AlertCircle className="w-5 h-5" style={{ color: 'var(--danger)' }} /></div>
                        <h3 className="text-base font-bold mb-2" style={{ color: 'var(--text-primary)' }}>Hapus Transaksi?</h3>
                        <p className="text-sm mb-5" style={{ color: 'var(--text-secondary)' }}>Yakin hapus transaksi <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{transaksiToDelete?.kode_transaksi}</span>? Stok barang akan berkurang otomatis.</p>
                        <div className="flex gap-2">
                            <button onClick={() => setIsDeleteModalOpen(false)} className="flex-1 py-2 text-sm font-medium rounded-lg" style={{ background: 'var(--bg)', color: 'var(--text-secondary)', border: '1px solid var(--border)', cursor: 'pointer' }} onMouseEnter={e => (e.currentTarget.style.background = 'var(--border)')} onMouseLeave={e => (e.currentTarget.style.background = 'var(--bg)')}>Batal</button>
                            <button onClick={handleDeleteConfirm} disabled={isSaving} className="flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2" style={{ background: isSaving ? '#fca5a5' : 'var(--danger)', color: '#fff', border: 'none', cursor: isSaving ? 'not-allowed' : 'pointer' }}>{isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Ya, Hapus'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
