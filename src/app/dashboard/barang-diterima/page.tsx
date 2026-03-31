'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Loader2,
    PackageCheck,
    Info,
    ChevronRight,
    SearchX,
    Download
} from 'lucide-react';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ReceivedSummary {
    barang_id: string;
    sub_bagian_id?: string | null;
    nama: string;
    kode: string | null;
    total: number;
    satuan: string | null;
    sub_bagian_nama?: string;
}

export default function BarangDiterimaPage() {
    const [summary, setSummary] = useState<ReceivedSummary[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isExporting, setIsExporting] = useState(false);
    const [searchTerm, setSearchTerm] = useState('');
    const [user, setUser] = useState<any>(null);

    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        setIsLoading(true);
        try {
            // 1. Fetch User Profile to know who we are
            const userRes = await fetch('/api/auth/me');
            if (!userRes.ok) throw new Error('Unauthorized');
            const userData = await userRes.json();
            setUser(userData.user);

            // 2. Fetch Permintaan Barang (GET API already filters based on user role/sub_bagian)
            const res = await fetch('/api/permintaan-barang');
            if (res.ok) {
                const data = await res.json();
                const requests = data.data || [];

                // 3. Aggregate "disetujui" requests
                const approvedRequests = requests.filter((r: any) => r.status === 'disetujui');

                const aggregation: Record<string, ReceivedSummary> = {};

                approvedRequests.forEach((r: any) => {
                    const bId = r.barang_id;
                    const sbId = r.sub_bagian_id || 'no-dept';
                    const isAdmin = userData.user?.role === 'admin';
                    
                    // Key: if admin, group by barang + sub_bagian. if user, group by barang only
                    const key = isAdmin ? `${bId}-${sbId}` : bId;
                    
                    if (!aggregation[key]) {
                        aggregation[key] = {
                            barang_id: bId,
                            sub_bagian_id: r.sub_bagian_id,
                            nama: r.barang?.nama || 'Unknown',
                            kode: r.barang?.kode || '-',
                            total: 0,
                            satuan: r.barang?.satuan?.nama || '-',
                            sub_bagian_nama: r.sub_bagian?.nama || (r.sub_bagian_id ? `Bagian ID: ${r.sub_bagian_id.substring(0,8)}` : 'Gudang/Umum')
                        };
                    }
                    aggregation[key].total += (r.jumlah || 0);
                });

                setSummary(Object.values(aggregation));
            }
        } catch (error) {
            console.error('Failed to fetch received items:', error);
        } finally {
            setIsLoading(false);
        }
    };
    
    const exportToPDF = () => {
        setIsExporting(true);
        try {
            const doc = new jsPDF();
            const isAdmin = user?.role === 'admin';
            const title = isAdmin ? 'LAPORAN BARANG TERKIRIM' : 'LAPORAN BARANG DITERIMA';
            
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
            doc.text(title, 14, 45);
            doc.setFontSize(10);
            doc.text(`Dicetak pada: ${new Date().toLocaleString('id-ID')}`, 14, 52);

            // Table Data
            const head = isAdmin 
                ? [['No', 'Sub Bagian', 'Nama Barang', 'Kode', 'Jumlah', 'Satuan']]
                : [['No', 'Nama Barang', 'Kode', 'Jumlah', 'Satuan']];
            
            const body = filteredSummary.map((item, i) => {
                const row = [
                    i + 1,
                    item.nama,
                    item.kode || '-',
                    item.total,
                    item.satuan || '-'
                ];
                if (isAdmin) {
                    row.splice(1, 0, item.sub_bagian_nama || '-');
                }
                return row;
            });

            autoTable(doc, {
                startY: 60,
                head: head,
                body: body,
                theme: 'striped',
                headStyles: { fillColor: [37, 99, 235], textColor: 255 },
                styles: { fontSize: 9 }
            });

            doc.save(`${title.replace(/ /g, '_')}_${new Date().getTime()}.pdf`);
        } catch (error) {
            console.error('PDF Export failed:', error);
        } finally {
            setIsExporting(setIsExporting === (false as any) ? false : false); // Safe reset
            setIsExporting(false);
        }
    };

    const filteredSummary = summary.filter(item =>
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sub_bagian_nama?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{color:'var(--text-primary)'}}>
                        {user?.role === 'admin' ? 'Barang Terkirim' : 'Barang Diterima'}
                    </h1>
                    <p className="text-sm mt-1" style={{color:'var(--text-secondary)'}}>
                        {user?.role === 'admin' 
                            ? 'Daftar akumulasi stok barang yang telah terkirim ke masing-masing sub bagian'
                            : 'Daftar akumulasi stok barang yang telah Anda terima'}
                    </p>
                </div>
                <div className="flex flex-col md:flex-row items-center gap-3">
                    <button onClick={exportToPDF} disabled={isLoading || summary.length === 0 || isExporting} className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg" style={{background:(isLoading || summary.length === 0 || isExporting)?'#fca5a5':'var(--danger)',color:'#fff',border:'none',cursor:(isLoading || summary.length === 0 || isExporting)?'not-allowed':'pointer',boxShadow:'0 2px 8px rgba(239,68,68,0.2)'}}>
                        {isExporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />} Export PDF
                    </button>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-semibold" style={{background:'var(--teal-light)',color:'var(--teal)',border:'1px solid var(--teal)'}}>
                        <PackageCheck className="w-5 h-5" />
                        <span className="whitespace-nowrap">Total Tipe Barang: {summary.length}</span>
                    </div>
                </div>
            </div>

            {/* Content Card */}
            <div className="rounded-xl overflow-hidden" style={{background:'var(--surface)',border:'1px solid var(--border)',boxShadow:'var(--shadow-sm)'}}>
                <div className="p-4" style={{borderBottom:'1px solid var(--border)',background:'var(--bg)'}}>
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'var(--text-muted)'}} />
                        <input type="text" placeholder="Cari nama barang atau kode..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none" style={{border:'1.5px solid var(--border)',background:'var(--surface)',color:'var(--text-primary)'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}} />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead style={{background:'var(--bg)',borderBottom:'1px solid var(--border)'}}>
                            <tr>
                                <th className="px-4 py-3 w-16" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>No</th>
                                {user?.role === 'admin' && <th className="px-4 py-3" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Sub Bagian</th>}
                                <th className="px-4 py-3" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Nama Barang</th>
                                <th className="px-4 py-3" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Kode</th>
                                <th className="px-4 py-3 text-center" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Jumlah</th>
                                <th className="px-4 py-3" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Satuan</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (
                                <tr>
                                    <td colSpan={user?.role === 'admin' ? 6 : 5} className="py-14 text-center" style={{color:'var(--text-muted)'}}>
                                        <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{color:'var(--primary)'}} />
                                        <p className="text-sm">Mengkalkulasi data barang...</p>
                                    </td>
                                </tr>
                            ) : filteredSummary.length === 0 ? (
                                <tr>
                                    <td colSpan={user?.role === 'admin' ? 6 : 5} className="py-14 text-center" style={{color:'var(--text-muted)'}}>
                                        <SearchX className="w-7 h-7 mx-auto mb-2" />
                                        <p className="text-sm font-medium">Tidak ada data ditemukan</p>
                                        <p className="text-xs mt-1" style={{color:'var(--text-secondary)'}}>Coba gunakan kata kunci pencarian lain atau pastikan pengajuan Anda telah disetujui.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredSummary.map((item, index) => (
                                    <tr key={index} className="transition-colors" style={{borderTop:'1px solid var(--border)'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--bg)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                                        <td className="px-4 py-3.5 text-xs font-semibold" style={{color:'var(--text-muted)'}}>{index + 1}</td>
                                        {user?.role === 'admin' && (
                                            <td className="px-4 py-3.5 font-medium" style={{color:'var(--text-secondary)'}}>{item.sub_bagian_nama}</td>
                                        )}
                                        <td className="px-4 py-3.5 font-medium" style={{color:'var(--text-primary)'}}>{item.nama}</td>
                                        <td className="px-4 py-3.5"><span className="px-2 py-1 rounded text-xs font-mono" style={{background:'var(--bg)',color:'var(--text-secondary)',border:'1px solid var(--border)'}}>{item.kode}</span></td>
                                        <td className="px-4 py-3.5 text-center"><div className="inline-flex items-center justify-center min-w-[50px] px-2.5 py-1 rounded-lg text-sm font-bold" style={{background:'var(--primary-light)',color:'var(--primary)'}}>{item.total}</div></td>
                                        <td className="px-4 py-3.5" style={{color:'var(--text-secondary)'}}>{item.satuan}</td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-3.5 text-xs" style={{background:'var(--bg)',borderTop:'1px solid var(--border)',color:'var(--text-secondary)'}}>
                    <div className="flex items-start gap-2">
                        <Info className="w-4 h-4 shrink-0 mt-0.5" style={{color:'var(--primary)'}} />
                        <p>
                            Data di atas merupakan akumulasi seluruh permintaan barang yang berstatus <strong style={{color:'var(--text-primary)'}}>Disetujui</strong> oleh Admin.
                            Gunakan ini sebagai referensi stok barang yang tersedia {user?.role === 'admin' ? 'di masing-masing sub bagian' : 'di sub bagian Anda'}.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
