-- ============================================================
-- FIFO dengan Row Lock: create_pengajuan_fifo
-- Jalan di Supabase SQL Editor
-- ============================================================
-- Fungsi ini memastikan:
-- 1. Hanya 1 transaksi yang bisa "cek stok + insert" sekaligus per barang
-- 2. Stok TIDAK berkurang saat pending (hanya virtual reservation)
-- 3. Siapa submit duluan → dilayani duluan (FIFO)
-- ============================================================

CREATE OR REPLACE FUNCTION create_pengajuan_fifo(
    p_user_id      UUID,
    p_sub_bagian_id UUID,
    p_tanggal      DATE,
    p_pemohon      TEXT,
    p_keterangan   TEXT,
    p_items        JSONB   -- [{barang_id, jumlah, satuan_id}]
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    v_pengajuan_id  UUID;
    v_item          JSONB;
    v_barang        RECORD;
    v_total_pending INTEGER;
    v_available     INTEGER;
BEGIN
    -- ── Validasi setiap item dengan ROW LOCK ────────────────────────────────
    -- FOR UPDATE membuat request ke barang yang sama ANTRI (tidak bisa paralel)
    -- Ini yang membuat FIFO terjamin: yang masuk duluan, dapat giliran duluan.

    FOR v_item IN SELECT * FROM jsonb_array_elements(p_items)
    LOOP
        -- Kunci baris barang ini → request lain ke barang sama harus TUNGGU
        SELECT id, stok, nama
        INTO v_barang
        FROM barang
        WHERE id = (v_item->>'barang_id')::UUID
        FOR UPDATE;

        IF NOT FOUND THEN
            RAISE EXCEPTION 'Barang tidak ditemukan: %', v_item->>'barang_id';
        END IF;

        -- Hitung total yang sedang pending untuk barang ini
        SELECT COALESCE(SUM(pi.jumlah), 0)
        INTO v_total_pending
        FROM pengajuan_items pi
        WHERE pi.barang_id = (v_item->>'barang_id')::UUID
          AND pi.status = 'pending';

        -- Stok tersedia = stok fisik - total yang sudah di-reserve (pending lain)
        v_available := v_barang.stok - v_total_pending;

        IF (v_item->>'jumlah')::INTEGER > v_available THEN
            RAISE EXCEPTION 'Stok "%" tidak mencukupi. Tersedia: % | Gudang: % | Terpesan (pending): %',
                v_barang.nama,
                v_available,
                v_barang.stok,
                v_total_pending;
        END IF;
    END LOOP;

    -- ── Semua item valid → Insert header pengajuan ──────────────────────────
    INSERT INTO pengajuan (user_id, sub_bagian_id, tanggal, pemohon, keterangan)
    VALUES (p_user_id, p_sub_bagian_id, p_tanggal, p_pemohon, p_keterangan)
    RETURNING id INTO v_pengajuan_id;

    -- ── Insert semua items sekaligus ────────────────────────────────────────
    INSERT INTO pengajuan_items (pengajuan_id, barang_id, jumlah, satuan_id, status)
    SELECT
        v_pengajuan_id,
        (item->>'barang_id')::UUID,
        (item->>'jumlah')::INTEGER,
        NULLIF(item->>'satuan_id', '')::UUID,
        'pending'
    FROM jsonb_array_elements(p_items) AS item;

    RETURN json_build_object(
        'id',      v_pengajuan_id,
        'message', 'Pengajuan berhasil dibuat'
    );

EXCEPTION
    WHEN OTHERS THEN
        RAISE;  -- bubble up error ke caller (Next.js API)
END;
$$;
