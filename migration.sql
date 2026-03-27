-- Migration: Add stok column and update status to boolean in barang table
-- Run this in Supabase SQL Editor

-- 1. Add stok column (integer, default 0)
ALTER TABLE barang ADD COLUMN IF NOT EXISTS stok INTEGER DEFAULT 0;

-- 2. Add stok_minimum column if not exists
ALTER TABLE barang ADD COLUMN IF NOT EXISTS stok_minimum INTEGER DEFAULT 0;

-- 3. Ensure status column exists and convert to boolean
-- First check if status is text type and convert
DO $$
BEGIN
    -- Check if status column is text type
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'barang' AND column_name = 'status' AND data_type IN ('text', 'character varying')
    ) THEN
        -- Convert text to boolean: 'aktif' -> true, anything else -> false
        ALTER TABLE barang ALTER COLUMN status TYPE BOOLEAN USING (COALESCE(status, 'aktif') = 'aktif');
        ALTER TABLE barang ALTER COLUMN status SET DEFAULT true;
    END IF;
    
    -- If status column doesn't exist at all, create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_name = 'barang' AND column_name = 'status'
    ) THEN
        ALTER TABLE barang ADD COLUMN status BOOLEAN DEFAULT true;
    END IF;
END $$;

-- 4. Populate stok field from existing transactions
UPDATE barang SET stok = COALESCE(
    (SELECT SUM(jumlah) FROM barang_masuk WHERE barang_masuk.barang_id = barang.id), 0
) - COALESCE(
    (SELECT SUM(jumlah) FROM barang_keluar WHERE barang_keluar.barang_id = barang.id), 0
);

-- 5. Create satuan table if it does not exist (and ensure deskripsi column exists)
CREATE TABLE IF NOT EXISTS satuan (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nama TEXT NOT NULL,
    deskripsi TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure deskripsi column exists if the table already existed
ALTER TABLE satuan ADD COLUMN IF NOT EXISTS deskripsi TEXT;
