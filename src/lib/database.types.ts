// Database types for Supabase tables
// Update these types according to your actual table structure

export interface User {
    id: string;
    email: string;
    password: string;
    name: string;
    role: string;
    avatar?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Barang {
    id: string;
    nama: string;
    deskripsi?: string;
    kategori_id: string;
    ruangan_id: string;
    jumlah: number;
    kondisi?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Kategori {
    id: string;
    nama: string;
    deskripsi?: string;
    created_at?: string;
    updated_at?: string;
}

export interface Ruangan {
    id: string;
    nama: string;
    lokasi?: string;
    deskripsi?: string;
    created_at?: string;
    updated_at?: string;
}

// Type-safe database schema for Supabase
export interface Database {
    public: {
        Tables: {
            user: {
                Row: User;
                Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
            };
            barang: {
                Row: Barang;
                Insert: Omit<Barang, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Barang, 'id' | 'created_at' | 'updated_at'>>;
            };
            kategori: {
                Row: Kategori;
                Insert: Omit<Kategori, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Kategori, 'id' | 'created_at' | 'updated_at'>>;
            };
            ruangan: {
                Row: Ruangan;
                Insert: Omit<Ruangan, 'id' | 'created_at' | 'updated_at'>;
                Update: Partial<Omit<Ruangan, 'id' | 'created_at' | 'updated_at'>>;
            };
        };
    };
}
