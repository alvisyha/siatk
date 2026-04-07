import { NextResponse } from 'next/server';
import { sb } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';
import { sendWA } from '@/lib/whatsapp';

export const dynamic = 'force-dynamic';

// PATCH /api/pengajuan/[itemId]
// Update status satu pengajuan_items (approve/tolak per barang)
export async function PATCH(
    request: Request,
    { params }: { params: Promise<{ itemId: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        if (user.role !== 'admin') return NextResponse.json({ error: 'Hanya admin yang dapat mengubah status' }, { status: 403 });

        const { itemId } = await params;
        const body = await request.json();
        const { status, alasan_penolakan } = body;

        if (!['pending', 'disetujui', 'ditolak'].includes(status)) {
            return NextResponse.json({ error: 'Status tidak valid' }, { status: 400 });
        }

        // Ambil data item saat ini
        const { data: item, error: itemErr } = await sb
            .from('pengajuan_items')
            .select('id, pengajuan_id, barang_id, jumlah, status, satuan_id')
            .eq('id', itemId)
            .single();

        if (itemErr || !item) {
            return NextResponse.json({ error: 'Item tidak ditemukan' }, { status: 404 });
        }

        // Guard: sudah diproses & mau diproses lagi ke hal yang sama
        if (item.status === status) {
            return NextResponse.json({ error: 'Status sudah sama' }, { status: 400 });
        }

        // ── Jika APPROVE: kurangi stok fisik ──
        if (status === 'disetujui' && item.status !== 'disetujui') {
            const { data: barang, error: bErr } = await sb
                .from('barang')
                .select('stok, nama')
                .eq('id', item.barang_id)
                .single();

            if (bErr || !barang) throw new Error('Barang tidak ditemukan');

            if ((barang.stok || 0) < item.jumlah) {
                return NextResponse.json({
                    error: `Gagal menyetujui: stok fisik ${barang.nama} (${barang.stok}) tidak mencukupi untuk jumlah ${item.jumlah}`
                }, { status: 400 });
            }

            const { error: stockErr } = await sb
                .from('barang')
                .update({ stok: (barang.stok || 0) - item.jumlah })
                .eq('id', item.barang_id);

            if (stockErr) throw stockErr;
        }

        // ── Jika REVERT dari disetujui: kembalikan stok ──
        if (item.status === 'disetujui' && status !== 'disetujui') {
            const { data: barang } = await sb
                .from('barang')
                .select('stok')
                .eq('id', item.barang_id)
                .single();

            if (barang) {
                await sb
                    .from('barang')
                    .update({ stok: (barang.stok || 0) + item.jumlah })
                    .eq('id', item.barang_id);
            }
        }

        // Update status item
        const updatePayload: any = { status };
        if (status === 'ditolak' && alasan_penolakan) {
            updatePayload.alasan_penolakan = alasan_penolakan;
        } else if (status !== 'ditolak') {
            updatePayload.alasan_penolakan = null;
        }

        const { data: updatedItem, error: updateErr } = await sb
            .from('pengajuan_items')
            .update(updatePayload)
            .eq('id', itemId)
            .select()
            .single();

        if (updateErr) throw updateErr;

        // ── Notifikasi WA ke requester ──
        try {
            // Ambil data pengajuan + info barang yang baru diproses
            const [pgResult, barangResult, allItemsResult] = await Promise.all([
                sb.from('pengajuan')
                    .select('user_id, pemohon, tanggal')
                    .eq('id', item.pengajuan_id)
                    .single(),
                sb.from('barang')
                    .select('nama')
                    .eq('id', item.barang_id)
                    .single(),
                sb.from('pengajuan_items')
                    .select('status')
                    .eq('pengajuan_id', item.pengajuan_id),
            ]);

            const pg = pgResult.data;
            const barangNama = barangResult.data?.nama || 'Barang';
            const allItems = allItemsResult.data || [];

            if (pg) {
                const { data: requester } = await sb
                    .from('users')
                    .select('phone, name')
                    .eq('id', pg.user_id)
                    .single();

                if (requester?.phone) {
                    const statusLabel = status === 'disetujui'
                        ? '✅ *DISETUJUI*'
                        : '❌ *DITOLAK*';

                    const allDone = allItems.every((i: any) => i.status !== 'pending');
                    const approvedCount = allItems.filter((i: any) => i.status === 'disetujui').length;
                    const rejectedCount = allItems.filter((i: any) => i.status === 'ditolak').length;
                    const pendingCount = allItems.filter((i: any) => i.status === 'pending').length;

                    let message =
                        `📢 *Update Pengajuan Barang*\n\n` +
                        `Tanggal: ${new Date(pg.tanggal).toLocaleDateString('id-ID')}\n` +
                        `Barang: *${barangNama}* (${item.jumlah} unit)\n` +
                        `Status: ${statusLabel}\n`;

                    if (status === 'ditolak' && alasan_penolakan) {
                        message += `Alasan: ${alasan_penolakan}\n`;
                    }
                    message += `\n`;

                    if (allDone) {
                        message +=
                            `📋 *Semua item telah diproses:*\n` +
                            `✅ Disetujui: ${approvedCount} item\n` +
                            `❌ Ditolak: ${rejectedCount} item\n\n` +
                            `Terima kasih.`;
                    } else {
                        message +=
                            `📋 *Progress pengajuan:*\n` +
                            `✅ Disetujui: ${approvedCount} item\n` +
                            `❌ Ditolak: ${rejectedCount} item\n` +
                            `⏳ Menunggu: ${pendingCount} item`;
                    }

                    await sendWA(requester.phone, message).catch((e: any) =>
                        console.error('WA notify requester failed:', e)
                    );
                } else {
                    console.log(`WA notify skipped: user ${pg.user_id} tidak memiliki nomor HP`);
                }
            }
        } catch (waErr) {
            console.error('WA notification error:', waErr);
        }

        return NextResponse.json({
            data: updatedItem,
            message: `Item berhasil ${status === 'disetujui' ? 'disetujui' : 'ditolak'}`
        });
    } catch (error: any) {
        console.error('PATCH /api/pengajuan/[itemId] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
