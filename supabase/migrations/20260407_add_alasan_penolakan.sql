-- Tambahkan kolom alasan_penolakan pada tabel pengajuan_items
ALTER TABLE pengajuan_items ADD COLUMN IF NOT EXISTS alasan_penolakan TEXT;
