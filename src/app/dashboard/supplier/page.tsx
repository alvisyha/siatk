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
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-xl font-bold" style={{color:'var(--text-primary)'}}>Master Supplier</h1>
                    <p className="text-sm mt-1" style={{color:'var(--text-secondary)'}}>Kelola data vendor dan pemasok barang</p>
                </div>
                <button onClick={() => handleOpenModal()} className="flex items-center gap-2 px-3.5 py-2 text-sm font-medium rounded-lg" style={{background:'var(--primary)',color:'#fff',boxShadow:'0 2px 8px rgba(99,102,241,0.25)',border:'none',cursor:'pointer'}}>
                    <Plus className="w-4 h-4" />Tambah Supplier
                </button>
            </div>

            <div className="rounded-xl overflow-hidden" style={{background:'var(--surface)',border:'1px solid var(--border)',boxShadow:'var(--shadow-sm)'}}>
                <div className="p-4" style={{borderBottom:'1px solid var(--border)',background:'var(--bg)'}}>
                    <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{color:'var(--text-muted)'}} />
                        <input type="text" placeholder="Cari supplier..." value={searchTerm} onChange={e=>setSearchTerm(e.target.value)} className="w-full pl-9 pr-4 py-2 text-sm rounded-lg outline-none" style={{border:'1.5px solid var(--border)',background:'var(--surface)',color:'var(--text-primary)'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}} />
                    </div>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm">
                        <thead style={{background:'var(--bg)',borderBottom:'1px solid var(--border)'}}>
                            <tr>
                                <th className="px-5 py-3" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Nama Supplier</th>
                                <th className="px-5 py-3" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Telepon</th>
                                <th className="px-5 py-3" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Alamat</th>
                                <th className="px-5 py-3 text-center w-24" style={{fontSize:'12px',fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>Aksi</th>
                            </tr>
                        </thead>
                        <tbody>
                            {isLoading ? (<tr><td colSpan={4} className="py-14 text-center" style={{color:'var(--text-muted)'}}><Loader2 className="w-6 h-6 animate-spin mx-auto mb-2" style={{color:'var(--primary)'}} /><p className="text-sm">Memuat data...</p></td></tr>
                            ) : filteredSuppliers.length === 0 ? (<tr><td colSpan={4} className="py-14 text-center" style={{color:'var(--text-muted)'}}><Info className="w-7 h-7 mx-auto mb-2" /><p className="text-sm">Tidak ada data supplier.</p></td></tr>
                            ) : filteredSuppliers.map(item => (
                                <tr key={item.id} className="transition-colors" style={{borderTop:'1px solid var(--border)'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--bg)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}>
                                    <td className="px-5 py-3.5"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{background:'var(--primary-light)'}}><Truck className="w-4 h-4" style={{color:'var(--primary)'}} /></div><span className="font-medium text-sm" style={{color:'var(--text-primary)'}}>{item.nama}</span></div></td>
                                    <td className="px-5 py-3.5 text-sm" style={{color:'var(--text-secondary)'}}><div className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5" style={{color:'var(--text-muted)'}} />{item.telepon||<span style={{color:'var(--text-muted)'}}>—</span>}</div></td>
                                    <td className="px-5 py-3.5 text-sm" style={{color:'var(--text-secondary)'}}><div className="flex items-start gap-1.5 max-w-xs"><MapPin className="w-3.5 h-3.5 mt-0.5 shrink-0" style={{color:'var(--text-muted)'}} /><span className="truncate">{item.alamat||<span style={{color:'var(--text-muted)'}}>—</span>}</span></div></td>
                                    <td className="px-5 py-3.5"><div className="flex items-center justify-center gap-1">
                                        <button onClick={()=>handleOpenModal(item)} title="Edit" className="p-1.5 rounded-lg transition-all" style={{color:'var(--text-muted)',background:'transparent',border:'none',cursor:'pointer'}} onMouseEnter={e=>{(e.currentTarget as any).style.background='var(--primary-light)';(e.currentTarget as any).style.color='var(--primary)';}} onMouseLeave={e=>{(e.currentTarget as any).style.background='transparent';(e.currentTarget as any).style.color='var(--text-muted)';}}>  <Edit className="w-4 h-4" /></button>
                                        <button onClick={()=>handleDeleteClick(item)} title="Hapus" className="p-1.5 rounded-lg transition-all" style={{color:'var(--text-muted)',background:'transparent',border:'none',cursor:'pointer'}} onMouseEnter={e=>{(e.currentTarget as any).style.background='var(--danger-light)';(e.currentTarget as any).style.color='var(--danger)';}} onMouseLeave={e=>{(e.currentTarget as any).style.background='transparent';(e.currentTarget as any).style.color='var(--text-muted)';}}>  <Trash2 className="w-4 h-4" /></button>
                                    </div></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>

            {isModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-16 md:pt-4 pointer-events-none">
                    <div className="w-full max-w-md overflow-hidden animate-scale-in pointer-events-auto" style={{background:'var(--surface)',borderRadius:'16px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--border)'}}>
                        <div className="px-6 py-4 flex items-center justify-between" style={{borderBottom:'1px solid var(--border)'}}>
                            <h3 className="text-base font-bold" style={{color:'var(--text-primary)'}}>{editingSupplier?'Edit Supplier':'Tambah Supplier'}</h3>
                            <button onClick={handleCloseModal} className="p-1.5 rounded-lg" style={{background:'transparent',border:'none',cursor:'pointer',color:'var(--text-muted)'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--bg)')} onMouseLeave={e=>(e.currentTarget.style.background='transparent')}><X className="w-4 h-4" /></button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div><label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Nama Supplier <span style={{color:'var(--danger)'}}>*</span></label><input type="text" required value={formData.nama} onChange={e=>setFormData({...formData,nama:e.target.value})} placeholder="Contoh: PT. ATK Jaya Mandiri" className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-primary)',fontFamily:'inherit'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}} /></div>
                            <div><label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Telepon</label><input type="text" value={formData.telepon} onChange={e=>setFormData({...formData,telepon:e.target.value})} placeholder="0812xxxxxxxx" className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-primary)',fontFamily:'inherit'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}} /></div>
                            <div><label className="block text-xs font-semibold mb-1.5" style={{color:'var(--text-primary)'}}>Alamat</label><textarea value={formData.alamat} onChange={e=>setFormData({...formData,alamat:e.target.value})} rows={3} placeholder="Alamat lengkap supplier..." className="w-full px-3 py-2.5 text-sm rounded-lg outline-none transition-all resize-none" style={{border:'1.5px solid var(--border)',background:'var(--bg)',color:'var(--text-primary)',fontFamily:'inherit'}} onFocus={e=>{e.currentTarget.style.borderColor='var(--primary)';e.currentTarget.style.boxShadow='0 0 0 3px rgba(99,102,241,0.1)';}} onBlur={e=>{e.currentTarget.style.borderColor='var(--border)';e.currentTarget.style.boxShadow='none';}} /></div>
                            <div className="flex gap-2 pt-2" style={{borderTop:'1px solid var(--border)'}}>
                                <button type="button" onClick={handleCloseModal} className="flex-1 py-2 text-sm font-medium rounded-lg" style={{background:'var(--bg)',color:'var(--text-secondary)',border:'1px solid var(--border)',cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--border)')} onMouseLeave={e=>(e.currentTarget.style.background='var(--bg)')}>Batal</button>
                                <button type="submit" disabled={isSaving} className="flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2" style={{background:isSaving?'#a5b4fc':'var(--primary)',color:'#fff',border:'none',cursor:isSaving?'not-allowed':'pointer'}}>{isSaving?<><Loader2 className="w-4 h-4 animate-spin"/>Menyimpan...</>:editingSupplier?'Simpan':'Tambah'}</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
            {isDeleteModalOpen && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 pt-16 md:pt-4 pointer-events-none">
                    <div className="w-full max-w-sm p-6 text-center animate-scale-in pointer-events-auto" style={{background:'var(--surface)',borderRadius:'16px',boxShadow:'var(--shadow-lg)',border:'1px solid var(--border)'}}>
                        <div className="w-11 h-11 rounded-full flex items-center justify-center mx-auto mb-4" style={{background:'var(--danger-light)'}}><AlertCircle className="w-5 h-5" style={{color:'var(--danger)'}} /></div>
                        <h3 className="text-base font-bold mb-2" style={{color:'var(--text-primary)'}}>Hapus Supplier?</h3>
                        <p className="text-sm mb-5" style={{color:'var(--text-secondary)'}}>Yakin hapus <span className="font-semibold" style={{color:'var(--text-primary)'}}>"{supplierToDelete?.nama}"</span>? Tindakan ini tidak dapat dibatalkan.</p>
                        <div className="flex gap-2">
                            <button onClick={()=>setIsDeleteModalOpen(false)} className="flex-1 py-2 text-sm font-medium rounded-lg" style={{background:'var(--bg)',color:'var(--text-secondary)',border:'1px solid var(--border)',cursor:'pointer'}} onMouseEnter={e=>(e.currentTarget.style.background='var(--border)')} onMouseLeave={e=>(e.currentTarget.style.background='var(--bg)')}>Batal</button>
                            <button onClick={handleDeleteConfirm} disabled={isSaving} className="flex-1 py-2 text-sm font-medium rounded-lg flex items-center justify-center gap-2" style={{background:isSaving?'#fca5a5':'var(--danger)',color:'#fff',border:'none',cursor:isSaving?'not-allowed':'pointer'}}>{isSaving?<Loader2 className="w-4 h-4 animate-spin"/>:'Ya, Hapus'}</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
