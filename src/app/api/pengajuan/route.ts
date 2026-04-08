import { NextResponse } from 'next/server';
import { sb } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { sendWA } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

// =============================================================================
// GET — Ambil semua pengajuan beserta items-nya
// =============================================================================
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        let query = sb
            .from('pengajuan')
            .select(`
                id, user_id, sub_bagian_id, tanggal, pemohon, keterangan, created_at,
                pengajuan_items (
                    id, barang_id, jumlah, status, alasan_penolakan,
                    barang:barang_id ( id, nama, kode, stok, satuan_id ),
                    satuan:satuan_id ( id, nama )
                ),
                sub_bagian:sub_bagian_id ( id, nama )
            `)
            .order('created_at', { ascending: false });

        if (user.role !== 'admin') {
            if (user.sub_bagian_id) {
                query = query.eq('sub_bagian_id', user.sub_bagian_id);
            } else {
                query = query.eq('user_id', user.id);
            }
        }

        const { data, error } = await query;
        if (error) throw error;

        return NextResponse.json({ data: data || [] });
    } catch (error: any) {
        console.error('GET /api/pengajuan error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

// =============================================================================
// POST — Buat pengajuan baru dengan banyak barang sekaligus (FIFO + row lock)
// =============================================================================
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const body = await request.json();
        const { pemohon, sub_bagian_id, tanggal, keterangan, items } = body;

        // Tentukan sub_bagian_id final
        let finalSubBagianId = sub_bagian_id;
        if (user.role !== 'admin' && user.sub_bagian_id) {
            finalSubBagianId = user.sub_bagian_id;
        }

        if (!finalSubBagianId) {
            return NextResponse.json({ error: 'Sub bagian harus diisi' }, { status: 400 });
        }

        if (!Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'Minimal 1 barang harus diisi' }, { status: 400 });
        }

        // Validasi format dasar + ambil satuan_id dari barang bila belum ada
        for (const item of items) {
            if (!item.barang_id || !item.jumlah || item.jumlah <= 0) {
                return NextResponse.json({
                    error: 'Setiap item harus memiliki barang dan jumlah yang valid'
                }, { status: 400 });
            }
            if (!item.satuan_id) {
                const { data: barang } = await sb
                    .from('barang')
                    .select('satuan_id')
                    .eq('id', item.barang_id)
                    .single();
                item.satuan_id = barang?.satuan_id || null;
            }
        }

        // ── FIFO via SQL function dengan FOR UPDATE row lock ──────────────────
        // Apa yang terjadi di dalam fungsi ini:
        //  1. Setiap barang di-LOCK (FOR UPDATE) → request bersamaan harus ANTRI
        //  2. Cek: stok_fisik - total_pending >= jumlah_diminta
        //  3. Stok TIDAK berkurang saat pending (hanya "virtual reservation")
        //  4. Stok baru benar-benar berkurang saat admin APPROVE (di PATCH)
        // Dengan cara ini, siapa yang submit DULUAN → dilayani DULUAN (FIFO)
        const { data: rpcResult, error: rpcError } = await sb.rpc('create_pengajuan_fifo', {
            p_user_id:       user.id,
            p_sub_bagian_id: finalSubBagianId,
            p_tanggal:       tanggal || new Date().toISOString().split('T')[0],
            p_pemohon:       pemohon || user.name || null,
            p_keterangan:    keterangan || null,
            p_items:         items.map((it: any) => ({
                barang_id: it.barang_id,
                jumlah:    parseInt(it.jumlah),
                satuan_id: it.satuan_id || null,
            }))
        });

        if (rpcError) {
            // Pesan error dari RAISE EXCEPTION di DB langsung diteruskan ke user
            const msg = rpcError.message || 'Gagal membuat pengajuan';
            return NextResponse.json({ error: msg }, { status: 400 });
        }

        const pengajuanId = (rpcResult as any)?.id;

        // Notifikasi WA ke admin
        try {
            const { data: admins } = await sb
                .from('users')
                .select('phone, name')
                .eq('role', 'admin')
                .not('phone', 'is', null);

            if (admins && admins.length > 0) {
                const message =
                    `🔔 *Pengajuan Barang Baru!*\n\n` +
                    `Dari: ${pemohon || user.name}\n` +
                    `Tanggal: ${new Date(tanggal).toLocaleDateString('id-ID')}\n` +
                    `Jumlah Barang: ${items.length} item\n` +
                    `Keterangan: ${keterangan || '-'}\n\n` +
                    `Silakan cek dashboard untuk memproses.`;

                await Promise.all(admins.map((admin: any) =>
                    admin.phone ? sendWA(admin.phone, message).catch((e: any) =>
                        console.error(`WA notify failed for ${admin.name}:`, e)
                    ) : null
                ));
            }
        } catch (waErr) {
            console.error('WA notification error:', waErr);
        }

        return NextResponse.json({
            data: { id: pengajuanId },
            message: `Pengajuan berhasil dibuat dengan ${items.length} barang`
        });
    } catch (error: any) {
        console.error('POST /api/pengajuan error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
