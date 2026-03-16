'use client';

import { useState, useEffect } from 'react';
import {
    Search,
    Loader2,
    PackageCheck,
    Info,
    ChevronRight,
    SearchX
} from 'lucide-react';

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
                            satuan: r.barang?.satuan || '-',
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

    const filteredSummary = summary.filter(item =>
        item.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.kode?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        item.sub_bagian_nama?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        {user?.role === 'admin' ? 'Barang Terkirim' : 'Barang Diterima'}
                    </h1>
                    <p className="text-gray-500 text-sm mt-1">
                        {user?.role === 'admin' 
                            ? 'Daftar akumulasi stok barang yang telah terkirim ke masing-masing sub bagian'
                            : 'Daftar akumulasi stok barang yang telah Anda terima'}
                    </p>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl border border-emerald-100">
                    <PackageCheck className="w-5 h-5" />
                    <span className="text-sm font-semibold">Total Tipe Barang: {summary.length}</span>
                </div>
            </div>

            {/* Content Card */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50/30">
                    <div className="relative max-w-md">
                        <Search className="absolute left-3 top-2.5 w-5 h-5 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Cari nama barang atau kode..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2.5 bg-white border border-gray-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-gray-900"
                        />
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="bg-gray-50 text-gray-600 font-medium border-b border-gray-200">
                                <th className="px-6 py-4 w-16">No</th>
                                {user?.role === 'admin' && <th className="px-6 py-4">Sub Bagian</th>}
                                <th className="px-6 py-4">Nama Barang</th>
                                <th className="px-6 py-4">Kode</th>
                                <th className="px-6 py-4 text-center">Jumlah</th>
                                <th className="px-6 py-4">Unit</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {isLoading ? (
                                <tr>
                                    <td colSpan={user?.role === 'admin' ? 6 : 5} className="px-6 py-12 text-center">
                                        <Loader2 className="w-8 h-8 animate-spin mx-auto text-blue-500 mb-3" />
                                        <p className="text-gray-500">Mengkalkulasi data barang...</p>
                                    </td>
                                </tr>
                            ) : filteredSummary.length === 0 ? (
                                <tr>
                                    <td colSpan={user?.role === 'admin' ? 6 : 5} className="px-6 py-12 text-center">
                                        <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto mb-4">
                                            <SearchX className="w-8 h-8 text-gray-300" />
                                        </div>
                                        <p className="text-gray-900 font-medium">Tidak ada data ditemukan</p>
                                        <p className="text-gray-500 text-sm mt-1">Coba gunakan kata kunci pencarian lain atau pastikan pengajuan Anda telah disetujui.</p>
                                    </td>
                                </tr>
                            ) : (
                                filteredSummary.map((item, index) => (
                                    <tr key={index} className="hover:bg-gray-50/50 transition-colors group">
                                        <td className="px-6 py-4 text-gray-500">{index + 1}</td>
                                        {user?.role === 'admin' && (
                                            <td className="px-6 py-4 text-gray-600 font-medium">{item.sub_bagian_nama}</td>
                                        )}
                                        <td className="px-6 py-4">
                                            <div className="font-semibold text-gray-900">{item.nama}</div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="px-2 py-1 bg-gray-100 text-gray-600 rounded text-xs font-mono border border-gray-200">
                                                {item.kode}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-center">
                                            <div className="inline-flex items-center justify-center min-w-[60px] px-3 py-1 bg-blue-50 text-blue-700 rounded-lg font-bold text-base border border-blue-100">
                                                {item.total}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-gray-600 font-medium">
                                            {item.satuan}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                <div className="p-4 bg-gray-50/50 border-t border-gray-100">
                    <div className="flex items-start gap-3 text-xs text-gray-500">
                        <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                        <p>
                            Data di atas merupakan akumulasi seluruh permintaan barang yang telah berstatus <strong>Disetujui</strong> oleh Admin.
                            Gunakan ini sebagai referensi stok barang yang saat ini seharusnya tersedia {user?.role === 'admin' ? 'di masing-masing sub bagian' : 'di sub bagian Anda'}.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
