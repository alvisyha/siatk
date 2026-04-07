-- Migration: 1 Pengajuan = Banyak Barang (dengan status per item)
-- Jalankan di Supabase SQL Editor

-- 1. Buat tabel pengajuan (header, tanpa status — status ada di items)
CREATE TABLE IF NOT EXISTS pengajuan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    sub_bagian_id UUID REFERENCES sub_bagian(id) ON DELETE SET NULL,
    tanggal DATE NOT NULL DEFAULT CURRENT_DATE,
    pemohon TEXT,
    keterangan TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Buat tabel pengajuan_items (detail per barang, masing-masing punya status sendiri)
CREATE TABLE IF NOT EXISTS pengajuan_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    pengajuan_id UUID NOT NULL REFERENCES pengajuan(id) ON DELETE CASCADE,
    barang_id UUID REFERENCES barang(id) ON DELETE SET NULL,
    jumlah INTEGER NOT NULL DEFAULT 1,
    satuan_id UUID REFERENCES satuan(id) ON DELETE SET NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'disetujui', 'ditolak'))
);

-- 3. Migrasi data lama dari permintaan_barang ke tabel baru
-- (jalankan hanya jika tabel permintaan_barang sudah ada & berisi data)
INSERT INTO pengajuan (id, user_id, sub_bagian_id, tanggal, pemohon, keterangan, created_at)
SELECT id, user_id, sub_bagian_id, tanggal::DATE, pemohon, keterangan, created_at
FROM permintaan_barang
ON CONFLICT (id) DO NOTHING;

INSERT INTO pengajuan_items (pengajuan_id, barang_id, jumlah, satuan_id, status)
SELECT id, barang_id, jumlah, satuan_id, status
FROM permintaan_barang
ON CONFLICT DO NOTHING;
