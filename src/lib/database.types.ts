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
    created_at: string
    updated_at: string | null
}

export interface Barang {
    id: string
    nama: string
    deskripsi: string | null
    kategori_id: string
    ruangan_id: string
    jumlah: number
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

export interface Database {
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
                    deskripsi?: string | null
                    kategori_id: string
                    ruangan_id: string
                    jumlah: number
                    kondisi?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
                Update: {
                    id?: string
                    nama?: string
                    deskripsi?: string | null
                    kategori_id?: string
                    ruangan_id?: string | null
                    jumlah?: number
                    kondisi?: string | null
                    created_at?: string
                    updated_at?: string | null
                }
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
