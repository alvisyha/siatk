'use client';

import { useState, useEffect } from 'react';
import { 
    FileText, 
    Download, 
    Filter, 
    Calendar, 
    Building2,
    Loader2,
    Search,
    ChevronLeft,
    ChevronRight,
    SearchX,
    Database,
    ArrowDownLeft,
    ArrowUpRight,
    ClipboardList,
    RefreshCw,
    Box,
    PackageCheck
} from 'lucide-react';
import { sb } from '@/lib/supabase';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface SubBagian {
    id: string;
    nama: string;
}

type ReportType = 'STOK' | 'MASUK' | 'KELUAR' | 'NILAI_PERSEDIAAN' | 'REKAP_USER';

interface LaporanData {
    id: string;
    tanggal?: string;
    barang_nama: string;
    jumlah: number;
    satuan: string;
    sub_bagian_nama?: string;
    penerima_pemasok?: string;
    status?: string;
    harga?: number;
    total_harga?: number;
    satuan_id?: string;
    sumber?: string;
    stok_awal?: number;
    masuk?: number;
    keluar?: number;
    stok_akhir?: number;
    // User Recap specifics
    diminta?: number;
    disetujui?: number;
    pending?: number;
    ditolak?: number;
}

export default function LaporanPage() {
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState(false);
    const [data, setData] = useState<LaporanData[]>([]);
    const [subBagianList, setSubBagianList] = useState<SubBagian[]>([]);
    const [role, setRole] = useState<string | null>(null);
    const [userSubBagianId, setUserSubBagianId] = useState<string | null>(null);

    // Filters
    const [reportType, setReportType] = useState<ReportType>('STOK');
    const [selectedMonth, setSelectedMonth] = useState<string>(new Date().getMonth().toString());
    const [selectedYear, setSelectedYear] = useState<string>(new Date().getFullYear().toString());
    const [filterMode, setFilterMode] = useState<'month' | 'range'>('month');
    const [customStartDate, setCustomStartDate] = useState<string>(new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0]);
    const [customEndDate, setCustomEndDate] = useState<string>(new Date().toISOString().split('T')[0]);
    const [selectedSubBagian, setSelectedSubBagian] = useState<string>('all');
    const [searchTerm, setSearchTerm] = useState('');

    const years = Array.from({ length: 5 }, (_, i) => (new Date().getFullYear() - i).toString());

    const months = [
        'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
        'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
    ];

    const reportTypes = [
        { id: 'REKAP_USER', label: 'Laporan Rekap', icon: ClipboardList, roles: ['user'] },
        { id: 'STOK', label: 'Stok ATK', icon: Box, roles: ['admin'] },
        { id: 'MASUK', label: 'Barang Masuk', icon: ArrowDownLeft, roles: ['admin'] },
        { id: 'KELUAR', label: 'Barang Keluar', icon: ArrowUpRight, roles: ['admin'] },
        { id: 'NILAI_PERSEDIAAN', label: 'Nilai Persediaan', icon: Database, roles: ['admin'] },
    ];

    useEffect(() => {
        const init = async () => {
            await fetchUserRole();
            await fetchSubBagian();
        };
        init();
    }, []);

    useEffect(() => {
        if (role) {
            fetchData();
        }
    }, [role, reportType, selectedMonth, selectedYear, filterMode, customStartDate, customEndDate, selectedSubBagian]);

    const fetchUserRole = async () => {
        try {
            const res = await fetch('/api/auth/me');
            if (!res.ok) throw new Error('Failed to fetch user');
            const data = await res.json();
            const user = data.user;
            
            if (user) {
                setRole(user.role);
                setUserSubBagianId(user.sub_bagian_id);
                if (user.role === 'user') {
                    setSelectedSubBagian(user.sub_bagian_id || 'all');
                    setReportType('REKAP_USER');
                }
            }
        } catch (error) {
            console.error('Error fetching user role:', error);
            setRole('guest');
        }
    };

    const fetchSubBagian = async () => {
        try {
            const { data, error } = await sb.from('sub_bagian').select('id, nama').order('nama');
            if (error) throw error;
            setSubBagianList(data || []);
        } catch (error) {
            console.error('Error fetching sub bagian:', error);
        }
    };

    const fetchData = async () => {
        setLoading(true);
        try {
            let startDate: string;
            let endDate: string;

            if (filterMode === 'month') {
                const year = parseInt(selectedYear);
                const month = parseInt(selectedMonth) + 1;
                startDate = `${year}-${month.toString().padStart(2, '0')}-01`;
                const lastDay = new Date(year, month, 0).getDate();
                endDate = `${year}-${month.toString().padStart(2, '0')}-${lastDay.toString().padStart(2, '0')}`;
            } else {
                startDate = customStartDate;
                endDate = customEndDate;
            }

            let formattedData: LaporanData[] = [];

            if (reportType === 'STOK') {
                const [resBarang, resSatuan] = await Promise.all([
                    sb.from('barang').select('id, nama, satuan_id, stok').order('nama'),
                    sb.from('satuan').select('id, nama')
                ]);
                
                if (resBarang.error) throw resBarang.error;

                formattedData = (resBarang.data || []).map((item: any) => {
                    const s = (resSatuan.data || []).find((x: any) => x.id === item.satuan_id);
                    return {
                        id: item.id,
                        barang_nama: item.nama,
                        jumlah: item.stok || 0,
                        satuan: s?.nama || '-'
                    };
                });
            } 
            else if (reportType === 'MASUK') {
                const [resMasuk, resBarang, resSatuan] = await Promise.all([
                    sb.from('barang_masuk').select('id, tanggal, jumlah, harga, pemasok, barang_id').gte('tanggal', startDate).lte('tanggal', endDate).order('tanggal', { ascending: false }),
                    sb.from('barang').select('id, nama, satuan_id'),
                    sb.from('satuan').select('id, nama')
                ]);

                if (resMasuk.error) throw resMasuk.error;

                formattedData = (resMasuk.data || []).map((item: any) => {
                    const b = (resBarang.data || []).find((x: any) => x.id === item.barang_id);
                    const s = b ? (resSatuan.data || []).find((x: any) => x.id === b.satuan_id) : null;
                    return {
                        id: item.id,
                        tanggal: new Date(item.tanggal).toLocaleDateString('id-ID'),
                        barang_nama: b?.nama || '-',
                        jumlah: item.jumlah,
                        satuan: s?.nama || '-',
                        penerima_pemasok: item.pemasok || '-',
                        harga: item.harga || 0,
                        total_harga: (item.jumlah || 0) * (item.harga || 0)
                    };
                });
            }
            else if (reportType === 'KELUAR') {
                const [resKeluar, resPgItems, resBarang, resSatuan, resSubBagian] = await Promise.all([
                    sb.from('barang_keluar').select('id, tanggal, jumlah, penerima, barang_id').gte('tanggal', startDate).lte('tanggal', endDate).order('tanggal', { ascending: false }),
                    sb.from('pengajuan_items')
                        .select('id, jumlah, barang_id, satuan_id, pengajuan:pengajuan_id(id, tanggal, pemohon, sub_bagian_id)')
                        .eq('status', 'disetujui'),
                    sb.from('barang').select('id, nama, satuan_id'),
                    sb.from('satuan').select('id, nama'),
                    sb.from('sub_bagian').select('id, nama')
                ]);

                if (resKeluar.error) throw resKeluar.error;
                if (resPgItems.error) throw resPgItems.error;

                const directKeluar = (resKeluar.data || []).map((item: any) => {
                    const b = (resBarang.data || []).find((x: any) => x.id === item.barang_id);
                    const s = b ? (resSatuan.data || []).find((x: any) => x.id === b.satuan_id) : null;
                    return {
                        id: item.id,
                        tanggal: new Date(item.tanggal).toLocaleDateString('id-ID'),
                        barang_nama: b?.nama || '-',
                        jumlah: item.jumlah,
                        satuan: s?.nama || '-',
                        penerima_pemasok: item.penerima || '-',
                        sumber: 'Langsung'
                    };
                });

                // Flatten pengajuan_items disetujui dalam rentang tanggal
                const requestKeluar = (resPgItems.data || [])
                    .filter((item: any) => {
                        const pg = item.pengajuan as any;
                        if (!pg?.tanggal) return false;
                        return pg.tanggal >= startDate && pg.tanggal <= endDate;
                    })
                    .map((item: any) => {
                        const pg = item.pengajuan as any;
                        const b = (resBarang.data || []).find((x: any) => x.id === item.barang_id);
                        const s = b ? (resSatuan.data || []).find((x: any) => x.id === b.satuan_id) : null;
                        const sbeg = (resSubBagian.data || []).find((x: any) => x.id === pg?.sub_bagian_id);
                        return {
                            id: item.id,
                            tanggal: pg?.tanggal ? new Date(pg.tanggal).toLocaleDateString('id-ID') : '-',
                            barang_nama: b?.nama || '-',
                            jumlah: item.jumlah,
                            satuan: s?.nama || '-',
                            penerima_pemasok: `${pg?.pemohon || '-'} (${sbeg?.nama || 'No Dept'})`,
                            sumber: 'Permintaan'
                        };
                    });

                formattedData = [...directKeluar, ...requestKeluar].sort((a, b) => {
                    const dateA = new Date(a.tanggal.split('/').reverse().join('-'));
                    const dateB = new Date(b.tanggal.split('/').reverse().join('-'));
                    return dateB.getTime() - dateA.getTime();
                });
            }
            else if (reportType === 'NILAI_PERSEDIAAN') {
                const [resBarang, resSatuan, resMasuk] = await Promise.all([
                    sb.from('barang').select('id, nama, satuan_id, stok').order('nama'),
                    sb.from('satuan').select('id, nama'),
                    sb.from('barang_masuk').select('barang_id, harga, tanggal').order('tanggal', { ascending: false })
                ]);

                if (resBarang.error) throw resBarang.error;

                const priceMap: Record<string, number> = {};
                (resMasuk.data as any[])?.forEach(m => {
                    if (!priceMap[m.barang_id] && m.harga > 0) {
                        priceMap[m.barang_id] = m.harga;
                    }
                });

                formattedData = (resBarang.data || []).map((item: any) => {
                    const s = (resSatuan.data || []).find((x: any) => x.id === item.satuan_id);
                    const latestPrice = priceMap[item.id] || 0;
                    const stock = item.stok || 0;
                    return {
                        id: item.id,
                        barang_nama: item.nama,
                        jumlah: stock,
                        satuan: s?.nama || '-',
                        harga: latestPrice,
                        total_harga: stock * latestPrice
                    };
                });
            }
            else if (reportType === 'REKAP_USER') {
                const subId = userSubBagianId;
                if (!subId) {
                    formattedData = [];
                } else {
                    // Query pengajuan header + items untuk sub_bagian user
                    const [resPengajuan, resBarang, resSatuan] = await Promise.all([
                        sb.from('pengajuan')
                            .select('id, tanggal, pengajuan_items(id, barang_id, jumlah, satuan_id, status)')
                            .eq('sub_bagian_id', subId)
                            .gte('tanggal', startDate)
                            .lte('tanggal', endDate),
                        sb.from('barang').select('id, nama, satuan_id'),
                        sb.from('satuan').select('id, nama')
                    ]);

                    if (resPengajuan.error) throw resPengajuan.error;

                    // Flatten semua items dari semua pengajuan
                    const flatItems: any[] = [];
                    (resPengajuan.data || []).forEach((pg: any) => {
                        (pg.pengajuan_items || []).forEach((item: any) => {
                            flatItems.push({ ...item, tanggal: pg.tanggal });
                        });
                    });

                    formattedData = flatItems.map((item: any) => {
                        const b = (resBarang.data || []).find((x: any) => x.id === item.barang_id);
                        const s = b ? (resSatuan.data || []).find((x: any) => x.id === b.satuan_id) : null;
                        const qty = Number(item.jumlah) || 0;
                        return {
                            id: item.id,
                            tanggal: new Date(item.tanggal).toLocaleDateString('id-ID'),
                            barang_nama: b?.nama || 'Unknown',
                            jumlah: qty,
                            satuan: s?.nama || '-',
                            diminta: qty,
                            disetujui: item.status === 'disetujui' ? qty : 0,
                            pending: item.status === 'pending' ? qty : 0,
                            ditolak: item.status === 'ditolak' ? qty : 0,
                            status: item.status
                        };
                    });
                }
            }

            setData(formattedData);
        } catch (error) {
            console.error('Error fetching data:', error);
        } finally {
            setLoading(false);
        }
    };

    const exportToPDF = () => {
        setExporting(true);
        try {
            const doc = new jsPDF();
            const currentLabel = reportTypes.find(t => t.id === reportType)?.label || 'Laporan';
            const monthLabel = months[parseInt(selectedMonth)];
            const periodLabel = filterMode === 'month' 
                ? `${monthLabel} ${selectedYear}`
                : `${new Date(customStartDate).toLocaleDateString('id-ID')} - ${new Date(customEndDate).toLocaleDateString('id-ID')}`;

            // Branding
            doc.setFontSize(22);
            doc.setTextColor(37, 99, 235);
            doc.text('ATKIS', 14, 20);
            doc.setFontSize(10);
            doc.setTextColor(100);
            doc.text('ATK INFORMATION SYSTEM', 14, 26);
            doc.line(14, 30, 196, 30);

            // Title
            doc.setFontSize(16);
            doc.setTextColor(31, 41, 55);
            doc.text(`LAPORAN ${currentLabel.toUpperCase()}`, 14, 45);
            
            if (reportType !== 'STOK') {
                doc.setFontSize(10);
                doc.text(`Periode: ${periodLabel}`, 14, 52);
            }

            // Define Table Config based on Type
            let head: string[][] = [];
            let body: (string | number)[][] = [];
            let foot: string[][] | undefined = undefined;

            if (reportType === 'STOK') {
                head = [['No', 'Nama Barang', 'Stok Saat Ini', 'Satuan']];
                body = filteredData.map((item, i) => [
                    i + 1, item.barang_nama, item.jumlah, item.satuan
                ]);
            } else if (reportType === 'REKAP_USER') {
                head = [['No', 'Tanggal', 'Nama Barang', 'Satuan', 'Jumlah', 'Status']];
                body = filteredData.map((item, i) => [
                    i + 1, item.tanggal || '-', item.barang_nama, item.satuan, item.diminta || 0, (item.status || 'pending').toUpperCase()
                ]);
            } else if (reportType === 'MASUK') {
                const grandTotal = filteredData.reduce((sum, item) => sum + (item.total_harga || 0), 0);
                
                head = [['No', 'Tanggal', 'Nama Barang', 'Jumlah', 'Satuan', 'Harga', 'Total Harga', 'Pemasok']];
                body = filteredData.map((item, i) => [
                    i + 1, item.tanggal || '-', item.barang_nama, item.jumlah, item.satuan, 
                    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.harga || 0),
                    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.total_harga || 0),
                    item.penerima_pemasok || '-'
                ]);

                foot = [['', '', '', '', '', 'GRAND TOTAL', new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(grandTotal), '']];
            } else if (reportType === 'KELUAR') {
                head = [['No', 'Tanggal', 'Nama Barang', 'Jumlah', 'Satuan', 'Tujuan / Penerima', 'Sumber']];
                body = filteredData.map((item, i) => [
                    i + 1, item.tanggal || '-', item.barang_nama, item.jumlah, item.satuan, item.penerima_pemasok || '-', item.sumber || '-'
                ]);
            } else if (reportType === 'NILAI_PERSEDIAAN') {
                const grandTotal = filteredData.reduce((sum, item) => sum + (item.total_harga || 0), 0);
                
                head = [['No', 'Nama Barang', 'Satuan', 'Stok', 'Harga Satuan', 'Total Nilai']];
                body = filteredData.map((item, i) => [
                    i + 1, item.barang_nama, item.satuan, item.jumlah,
                    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.harga || 0),
                    new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.total_harga || 0)
                ]);

                foot = [['', '', '', '', 'GRAND TOTAL', new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(grandTotal)]];
            }

            autoTable(doc, {
                startY: 60,
                head: head,
                body: body,
                foot: foot,
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235], textColor: 255 },
                footStyles: { fillColor: [243, 244, 246], textColor: [31, 41, 55], fontStyle: 'bold' },
                styles: { fontSize: 9 }
            });

            doc.save(`Laporan_ATKIS_${currentLabel.replace(' ', '_')}_${reportType === 'STOK' ? 'Current' : periodLabel.replace(/ /g, '_').replace(/\//g, '-')}.pdf`);
        } catch (error) {
            console.error('PDF error:', error);
        } finally {
            setExporting(false);
        }
    };

    const filteredData = data.filter(item => 
        item.barang_nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (item.sub_bagian_nama?.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (item.penerima_pemasok?.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-black tracking-tight text-gray-900 flex items-center gap-3">
                        <div className="w-12 h-12 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-xl shadow-blue-200 ring-4 ring-blue-50">
                            <FileText className="w-6 h-6" />
                        </div>
                        <div className="flex flex-col">
                            <span>LAPORAN</span>
                            <span className="text-xs text-gray-400 font-bold uppercase tracking-widest mt-0.5">Report Management</span>
                        </div>
                    </h1>
                </div>
                
                <div className="flex items-center gap-2">
                    <button
                        onClick={fetchData}
                        disabled={loading}
                        className="p-2.5 text-gray-400 hover:text-blue-600 hover:bg-white rounded-xl transition-all border border-transparent hover:border-gray-100"
                    >
                        <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
                    </button>
                    <button
                        onClick={exportToPDF}
                        disabled={loading || data.length === 0 || exporting}
                        className="flex items-center justify-center gap-2 px-5 py-2.5 bg-red-600 text-white rounded-xl font-bold text-sm shadow-md hover:bg-red-700 disabled:opacity-50 transition-all active:scale-95 shadow-red-200"
                    >
                        {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                        Export PDF
                    </button>
                </div>
            </div>

            {/* Type Selector Tabs */}
            <div className="flex flex-wrap gap-2">
                {reportTypes.filter(t => !t.roles || (role && t.roles.includes(role))).map((type) => (
                    <button
                        key={type.id}
                        onClick={() => setReportType(type.id as ReportType)}
                        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold transition-all border-2 ${
                            reportType === type.id 
                            ? `border-blue-600 bg-blue-50 text-blue-600 shadow-sm` 
                            : 'border-transparent bg-white text-gray-500 hover:bg-gray-50'
                        }`}
                    >
                        <type.icon className={`w-4 h-4 ${reportType === type.id ? 'text-blue-600' : 'text-gray-400'}`} />
                        {type.label}
                    </button>
                ))}
            </div>

            {/* Filters Section */}
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-6">
                {reportType !== 'STOK' && reportType !== 'NILAI_PERSEDIAAN' && (
                    <div className="flex flex-col md:flex-row md:items-center gap-4 border-b border-gray-50 pb-6">
                        <div className="flex p-1 bg-gray-100 rounded-xl w-fit">
                            <button
                                onClick={() => setFilterMode('month')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                    filterMode === 'month' 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Per Bulan
                            </button>
                            <button
                                onClick={() => setFilterMode('range')}
                                className={`px-4 py-1.5 rounded-lg text-sm font-bold transition-all ${
                                    filterMode === 'range' 
                                    ? 'bg-white text-blue-600 shadow-sm' 
                                    : 'text-gray-500 hover:text-gray-700'
                                }`}
                            >
                                Rentang Tanggal
                            </button>
                        </div>
                        <p className="text-xs text-gray-400 font-medium italic">Pilih mode filter tanggal untuk laporan</p>
                    </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {reportType !== 'STOK' && reportType !== 'NILAI_PERSEDIAAN' && filterMode === 'month' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" /> Periode Bulan
                                </label>
                                <select
                                    value={selectedMonth}
                                    onChange={(e) => setSelectedMonth(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                >
                                    {months.map((month, index) => (
                                        <option key={index} value={index}>{month}</option>
                                    ))}
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" /> Periode Tahun
                                </label>
                                <select
                                    value={selectedYear}
                                    onChange={(e) => setSelectedYear(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                >
                                    {years.map((year) => (
                                        <option key={year} value={year}>{year}</option>
                                    ))}
                                </select>
                            </div>
                        </>
                    )}

                    {reportType !== 'STOK' && reportType !== 'NILAI_PERSEDIAAN' && filterMode === 'range' && (
                        <>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" /> Tanggal Mulai
                                </label>
                                <input
                                    type="date"
                                    value={customStartDate}
                                    onChange={(e) => setCustomStartDate(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                                    <Calendar className="w-3.5 h-3.5" /> Tanggal Selesai
                                </label>
                                <input
                                    type="date"
                                    value={customEndDate}
                                    onChange={(e) => setCustomEndDate(e.target.value)}
                                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                                />
                            </div>
                        </>
                    )}



                    <div className={`space-y-2 ${(reportType === 'STOK' || reportType === 'NILAI_PERSEDIAAN') ? 'md:col-span-3' : 'md:col-span-1'}`}>
                    <label className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-2">
                        <Search className="w-3.5 h-3.5" /> Cari Data
                    </label>
                    <input
                        type="text"
                        placeholder="Nama barang / kata kunci lainnya..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 outline-none transition-all font-medium"
                    />
                </div>
                </div>

                {reportType === 'REKAP_USER' && (
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-50">
                        <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100">
                            <p className="text-[10px] font-bold text-blue-600 uppercase tracking-widest mb-1">Total Tipe Barang</p>
                            <p className="text-xl font-black text-blue-900">{filteredData.length}</p>
                        </div>
                        <div className="bg-emerald-50/50 p-4 rounded-xl border border-emerald-100">
                            <p className="text-[10px] font-bold text-emerald-600 uppercase tracking-widest mb-1">Total Disetujui</p>
                            <p className="text-xl font-black text-emerald-900">
                                {filteredData.reduce((sum, item) => sum + (item.disetujui || 0), 0)}
                            </p>
                        </div>
                        <div className="bg-yellow-50/50 p-4 rounded-xl border border-yellow-100">
                            <p className="text-[10px] font-bold text-yellow-600 uppercase tracking-widest mb-1">Total Menunggu</p>
                            <p className="text-xl font-black text-yellow-900">
                                {filteredData.reduce((sum, item) => sum + (item.pending || 0), 0)}
                            </p>
                        </div>
                        <div className="bg-red-50/50 p-4 rounded-xl border border-red-100">
                            <p className="text-[10px] font-bold text-red-600 uppercase tracking-widest mb-1">Total Ditolak</p>
                            <p className="text-xl font-black text-red-900">
                                {filteredData.reduce((sum, item) => sum + (item.ditolak || 0), 0)}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {/* Table Section */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left min-w-[800px]">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider w-16">No</th>
                                {reportType !== 'STOK' && reportType !== 'NILAI_PERSEDIAAN' && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Tanggal</th>}
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Barang</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Jumlah</th>
                                <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Satuan</th>
                                {reportType === 'MASUK' && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Harga</th>}
                                {reportType === 'MASUK' && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Total Harga</th>}
                                {reportType === 'MASUK' && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Pemasok</th>}
                                {reportType === 'NILAI_PERSEDIAAN' && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Harga Satuan</th>}
                                {reportType === 'NILAI_PERSEDIAAN' && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-right">Total Nilai</th>}
                                {reportType === 'KELUAR' && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Penerima</th>}
                                {reportType === 'KELUAR' && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider">Sumber</th>}
                                {reportType === 'REKAP_USER' && <th className="px-6 py-4 text-xs font-bold text-gray-400 uppercase tracking-wider text-center">Status</th>}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {loading ? (
                                Array.from({ length: 5 }).map((_, i) => (
                                    <tr key={i} className="animate-pulse">
                                        {Array.from({ length: 7 }).map((_, j) => (
                                            <td key={j} className="px-6 py-4"><div className="h-4 bg-gray-100 rounded w-full"></div></td>
                                        ))}
                                    </tr>
                                ))
                            ) : filteredData.length > 0 ? (
                                filteredData.map((item, index) => (
                                    <tr key={`${item.id}-${index}`} className="hover:bg-blue-50/30 transition-colors">
                                        <td className="px-6 py-4 text-sm text-gray-500">{index + 1}</td>
                                        {reportType !== 'STOK' && reportType !== 'NILAI_PERSEDIAAN' && <td className="px-6 py-4 text-sm font-medium text-gray-900">{item.tanggal}</td>}
                                        <td className="px-6 py-4 text-sm font-bold text-blue-700">{item.barang_nama}</td>
                                        {reportType !== 'REKAP_USER' && <td className="px-6 py-4 text-sm font-black text-gray-900 text-center">{item.jumlah}</td>}
                                        <td className="px-6 py-4 text-sm text-gray-600 font-medium">{item.satuan}</td>
                                        {reportType === 'MASUK' && (
                                            <td className="px-6 py-4 text-sm font-mono font-medium">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.harga || 0)}
                                            </td>
                                        )}
                                        {reportType === 'NILAI_PERSEDIAAN' && (
                                            <td className="px-6 py-4 text-sm font-mono font-medium">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.harga || 0)}
                                            </td>
                                        )}
                                        {reportType === 'MASUK' && (
                                            <td className="px-6 py-4 text-sm font-mono font-bold text-right text-blue-800">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.total_harga || 0)}
                                            </td>
                                        )}
                                        {reportType === 'NILAI_PERSEDIAAN' && (
                                            <td className="px-6 py-4 text-sm font-mono font-bold text-right text-blue-800">
                                                {new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(item.total_harga || 0)}
                                            </td>
                                        )}
                                        {(reportType === 'MASUK' || reportType === 'KELUAR') && (
                                            <td className="px-6 py-4 text-sm text-gray-600">{item.penerima_pemasok}</td>
                                        )}
                                        {reportType === 'KELUAR' && (
                                            <td className="px-6 py-4 text-sm">
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                                    item.sumber === 'Langsung' ? 'bg-blue-100 text-blue-700' : 'bg-purple-100 text-purple-700'
                                                }`}>
                                                    {item.sumber}
                                                </span>
                                            </td>
                                        )}
                                        {reportType === 'REKAP_USER' && (
                                            <td className="px-6 py-4 text-sm text-center" colSpan={3}>
                                                <span className={`px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider ${
                                                    item.status === 'disetujui' ? 'bg-emerald-100 text-emerald-700' : 
                                                    item.status === 'ditolak' ? 'bg-red-100 text-red-700' : 'bg-yellow-100 text-yellow-700'
                                                }`}>
                                                    {item.status}
                                                </span>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan={8} className="px-6 py-20 text-center">
                                        <div className="flex flex-col items-center justify-center space-y-3">
                                            <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center">
                                                <SearchX className="w-8 h-8 text-gray-300" />
                                            </div>
                                            <p className="text-gray-900 font-bold">Tidak ada data untuk laporan ini</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}
