-- SQL Script untuk Insert Data Dummy (Kategori, Ruangan, Barang)

-- 1. Insert Kategori
INSERT INTO public.kategori (nama, deskripsi)
VALUES 
    ('Elektronik', 'Peralatan elektronik dan komputer'),
    ('Furniture', 'Meja, kursi, dan perabot lainnya'),
    ('ATK', 'Alat Tulis Kantor')
ON CONFLICT DO NOTHING; -- Mencegah error jika data sudah ada (tapi id mungkin beda jika tidak diset, jadi hati-hati)

-- 2. Insert Ruangan
INSERT INTO public.ruangan (nama, lokasi, deskripsi)
VALUES 
    ('Ruang Staff', 'Lantai 1', 'Ruang kerja staff umum'),
    ('Gudang Utama', 'Lantai Dasar', 'Tempat penyimpanan barang invetaris'),
    ('Ruang Server', 'Lantai 2', 'Ruang khusus server dan jaringan')
ON CONFLICT DO NOTHING;

-- 3. Insert Barang
-- Menggunakan subquery untuk mendapatkan ID kategori dan ruangan secara otomatis berdasarkan nama

-- Barang 1: Laptop (Elektronik, Ruang Staff)
INSERT INTO public.barang (nama, deskripsi, kategori_id, ruangan_id, jumlah, kondisi)
VALUES (
    'MacBook Pro M1',
    'Laptop inventaris untuk Senior Developer',
    (SELECT id FROM public.kategori WHERE nama = 'Elektronik' LIMIT 1),
    (SELECT id FROM public.ruangan WHERE nama = 'Ruang Staff' LIMIT 1),
    2,
    'baik'
);

-- Barang 2: Meja Kerja (Furniture, Ruang Staff)
INSERT INTO public.barang (nama, deskripsi, kategori_id, ruangan_id, jumlah, kondisi)
VALUES (
    'Meja Kerja Minimalis',
    'Meja kerja kayu ukuran 120x60cm',
    (SELECT id FROM public.kategori WHERE nama = 'Furniture' LIMIT 1),
    (SELECT id FROM public.ruangan WHERE nama = 'Ruang Staff' LIMIT 1),
    10,
    'baik'
);

-- Barang 3: Kursi Ergonomis (Furniture, Ruang Staff)
INSERT INTO public.barang (nama, deskripsi, kategori_id, ruangan_id, jumlah, kondisi)
VALUES (
    'Kursi Ergonomis Herman Miller kw',
    'Kursi kerja nyaman warna hitam',
    (SELECT id FROM public.kategori WHERE nama = 'Furniture' LIMIT 1),
    (SELECT id FROM public.ruangan WHERE nama = 'Ruang Staff' LIMIT 1),
    10,
    'rusak_ringan'
);

-- Barang 4: Printer (Elektronik, Gudang Utama)
INSERT INTO public.barang (nama, deskripsi, kategori_id, ruangan_id, jumlah, kondisi)
VALUES (
    'Printer Epson L3110',
    'Printer ink tank untuk cadangan',
    (SELECT id FROM public.kategori WHERE nama = 'Elektronik' LIMIT 1),
    (SELECT id FROM public.ruangan WHERE nama = 'Gudang Utama' LIMIT 1),
    1,
    'baik'
);

-- Barang 5: Kertas A4 (ATK, Gudang Utama)
INSERT INTO public.barang (nama, deskripsi, kategori_id, ruangan_id, jumlah, kondisi)
VALUES (
    'Kertas HVS A4 80gsm',
    'Stok kertas untuk operasional bulanan',
    (SELECT id FROM public.kategori WHERE nama = 'ATK' LIMIT 1),
    (SELECT id FROM public.ruangan WHERE nama = 'Gudang Utama' LIMIT 1),
    50,
    'baik'
);

-- Barang 6: Rak Server (Elektronik, Ruang Server)
INSERT INTO public.barang (nama, deskripsi, kategori_id, ruangan_id, jumlah, kondisi)
VALUES (
    'Wallmount Rack 8U',
    'Rak server dinding',
    (SELECT id FROM public.kategori WHERE nama = 'Elektronik' LIMIT 1),
    (SELECT id FROM public.ruangan WHERE nama = 'Ruang Server' LIMIT 1),
    1,
    'baik'
);
