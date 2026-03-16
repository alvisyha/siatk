import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Get single barang by ID
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { data, error } = await supabase
            .from('barang')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: 'Barang tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// PUT: Update barang
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        const { data, error } = await supabase
            .from('barang')
            // @ts-ignore
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating barang:', error);
            return NextResponse.json({ error: 'Gagal mengupdate barang' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Barang berhasil diupdate', data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// DELETE: Delete barang
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        // Delete related transaction records first to handle foreign key constraints
        const { error: masukError } = await supabase
            .from('barang_masuk')
            .delete()
            .eq('barang_id', id);

        if (masukError) {
            console.error('Error deleting related barang_masuk for id:', id, masukError);
            return NextResponse.json({ error: `Gagal menghapus riwayat barang masuk: ${masukError.message}` }, { status: 500 });
        }

        const { error: keluarError } = await supabase
            .from('barang_keluar')
            .delete()
            .eq('barang_id', id);

        if (keluarError) {
            console.error('Error deleting related barang_keluar for id:', id, keluarError);
            return NextResponse.json({ error: `Gagal menghapus riwayat barang keluar: ${keluarError.message}` }, { status: 500 });
        }

        const { error: permintaanError } = await supabase
            .from('permintaan_barang')
            .delete()
            .eq('barang_id', id);

        if (permintaanError) {
            console.error('Error deleting related permintaan_barang for id:', id, permintaanError);
            return NextResponse.json({ error: `Gagal menghapus data permintaan barang: ${permintaanError.message}` }, { status: 500 });
        }

        const { error } = await supabase
            .from('barang')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting main barang for id:', id, error);
            return NextResponse.json({ error: `Gagal menghapus data barang utamanya: ${error.message}` }, { status: 500 });
        }

        return NextResponse.json({ message: 'Barang berhasil dihapus' });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
