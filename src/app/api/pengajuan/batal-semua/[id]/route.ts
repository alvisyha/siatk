import { NextResponse } from 'next/server';
import { sb } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

        const { id } = await params;

        // Ambil data pengajuan
        const { data: pengajuan, error: pgErr } = await sb
            .from('pengajuan')
            .select('id, user_id')
            .eq('id', id)
            .single();

        if (pgErr || !pengajuan) {
            return NextResponse.json({ error: 'Pengajuan tidak ditemukan' }, { status: 404 });
        }

        // Cek permission: admin, atau user pembuat
        if (user.role !== 'admin' && pengajuan.user_id !== user.id) {
             return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        // Cek status items: Hanya bisa dihapus jika SEMUA item statusnya 'pending'
        const { data: items } = await sb
            .from('pengajuan_items')
            .select('status')
            .eq('pengajuan_id', id);

        const allPending = (items || []).every((i: any) => i.status === 'pending');
        if (!allPending) {
            return NextResponse.json({ error: 'Pengajuan sudah diproses sebagian, tidak dapat dibatalkan seluruhnya.' }, { status: 400 });
        }

        // Hapus pengajuan_items terlebih dahulu (jika tidak ada CASCADE setup di database)
        await sb.from('pengajuan_items').delete().eq('pengajuan_id', id);

        // Hapus pengajuan root
        const { error: delErr } = await sb
            .from('pengajuan')
            .delete()
            .eq('id', id);

        if (delErr) throw delErr;

        return NextResponse.json({ message: 'Pengajuan berhasil dibatalkan dan dihapus.' });
    } catch (error: any) {
        console.error('DELETE /api/pengajuan/batal-semua/[id] error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
