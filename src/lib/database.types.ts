export type Json =
    | string
    | number
    | boolean
    | null
    | { [key: string]: Json | undefined }
    | Json[]

export interface User {
    id: string
    email: string
    password: string
    name: string
    role: string
    avatar: string | null
    sub_bagian_id: string | null
    created_at: string
    updated_at: string | null
}

export interface BarangMasuk {
    id: string
    barang_id: string
    satuan_id: string | null
    kode_transaksi: string | null
    jumlah: number
    harga: number
    stok: number | null
    tanggal: string
    pemasok: string | null
    keterangan: string | null
    created_at: string
    updated_at: string | null
}

export interface Supplier {
    id: string
    nama: string
    alamat: string | null
    telepon: string | null
    created_at: string
}

export interface PermintaanBarang {
    id: string
    user_id: string
    barang_id: string
    jumlah: number
    satuan_id: string
    sub_bagian_id: string | null
    tanggal: string
    status: string
    pemohon: string | null
    keterangan: string | null
    created_at: string
}

export interface SubBagian {
    id: string
    nama: string
    deskripsi: string | null
    created_at: string
}

export interface BarangKeluar {
    id: string
    barang_id: string
    satuan_id: string | null
    kode_transaksi: string | null
    jumlah: number
    stok: number | null
    tanggal: string
    penerima: string | null
    keterangan: string | null
    created_at: string
    updated_at: string | null
}

export interface Barang {
    id: string
    nama: string
    kode: string | null
    deskripsi: string | null
    kategori_id: string
    ruangan_id: string
    satuan_id: string | null
    jumlah: number
    harga: number
    kondisi: string | null
    created_at: string
    updated_at: string | null
}

export interface Kategori {
    id: string
    nama: string
    deskripsi: string | null
    created_at: string
    updated_at: string | null
}

export interface Ruangan {
    id: string
    nama: string
    lokasi: string | null
    deskripsi: string | null
    created_at: string
    updated_at: string | null
}

export type Database = {
    public: {
        Tables: {
            users: {
                Row: User
                Insert: {
                    id?: string
                    email: string
                    password: string
                    name: string
                    role: string
                    avatar?: string | null
                    sub_bagian_id?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    email?: string
                    password?: string
                    name?: string
                    role?: string
                    avatar?: string | null
                    sub_bagian_id?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            barang: {
                Row: Barang
                Insert: {
                    id?: string
                    nama: string
                    kode?: string | null
                    deskripsi?: string | null
                    kategori_id: string
                    ruangan_id: string
                    satuan_id?: string | null
                    jumlah?: number
                    harga?: number
                    kondisi?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    nama?: string
                    kode?: string | null
                    deskripsi?: string | null
                    kategori_id?: string
                    ruangan_id?: string | null
                    satuan_id?: string | null
                    jumlah?: number
                    harga?: number
                    kondisi?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            barang_masuk: {
                Row: BarangMasuk
                Insert: {
                    id?: string
                    barang_id: string
                    satuan_id?: string | null
                    kode_transaksi?: string | null
                    jumlah: number
                    harga?: number
                    stok?: number | null
                    tanggal: string
                    pemasok?: string | null
                    keterangan?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    barang_id?: string
                    satuan_id?: string | null
                    kode_transaksi?: string | null
                    jumlah?: number
                    harga?: number
                    stok?: number | null
                    tanggal?: string
                    pemasok?: string | null
                    keterangan?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            barang_keluar: {
                Row: BarangKeluar
                Insert: {
                    id?: string
                    barang_id: string
                    satuan_id?: string | null
                    kode_transaksi?: string | null
                    jumlah: number
                    stok?: number | null
                    tanggal: string
                    penerima?: string | null
                    keterangan?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    barang_id?: string
                    satuan_id?: string | null
                    kode_transaksi?: string | null
                    jumlah?: number
                    stok?: number | null
                    tanggal?: string
                    penerima?: string | null
                    keterangan?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            satuan: {
                Row: { id: string; nama: string; deskripsi: string | null; created_at: string; updated_at: string | null }
                Insert: { id?: string; nama: string; deskripsi?: string | null; created_at?: string; updated_at?: string | null }
                Update: { id?: string; nama?: string; deskripsi?: string | null; created_at?: string; updated_at?: string | null }
                Relationships: []
            }
            kategori: {
                Row: Kategori
                Insert: {
                    id?: string
                    nama: string
                    deskripsi?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    nama?: string
                    deskripsi?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            ruangan: {
                Row: Ruangan
                Insert: {
                    id?: string
                    nama: string
                    lokasi?: string | null
                    deskripsi?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    nama?: string
                    lokasi?: string | null
                    deskripsi?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Relationships: []
            }
            supplier: {
                Row: Supplier
                Insert: {
                    id?: string
                    nama: string
                    alamat?: string | null
                    telepon?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    nama?: string
                    alamat?: string | null
                    telepon?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            sub_bagian: {
                Row: SubBagian
                Insert: {
                    id?: string
                    nama: string
                    deskripsi?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    nama?: string
                    deskripsi?: string | null
                    created_at?: string
                }
                Relationships: []
            }
            permintaan_barang: {
                Row: PermintaanBarang
                Insert: {
                    id?: string
                    user_id?: string
                    barang_id: string
                    jumlah: number
                    satuan_id: string
                    sub_bagian_id?: string | null
                    tanggal?: string
                    status?: string
                    pemohon?: string | null
                    keterangan?: string | null
                    created_at?: string
                }
                Update: {
                    id?: string
                    user_id?: string
                    barang_id?: string
                    jumlah?: number
                    satuan_id?: string
                    sub_bagian_id?: string | null
                    tanggal?: string
                    status?: string
                    pemohon?: string | null
                    keterangan?: string | null
                    created_at?: string
                }
                Relationships: []
            }
        }
        Views: {
            [_ in never]: never
        }
        Functions: {
            [_ in never]: never
        }
        Enums: {
            [_ in never]: never
        }
        CompositeTypes: {
            [_ in never]: never
        }
    }
}

export type Tables<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Row']
export type Enums<T extends keyof Database['public']['Enums']> = Database['public']['Enums'][T]
export type TablesInsert<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Insert']
export type TablesUpdate<T extends keyof Database['public']['Tables']> = Database['public']['Tables'][T]['Update']
