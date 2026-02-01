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
            .select(`
                *,
                kategori:kategori_id (id, nama),
                ruangan:ruangan_id (id, nama)
            `)
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

        const { error } = await supabase
            .from('barang')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting barang:', error);
            return NextResponse.json({ error: 'Gagal menghapus barang' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Barang berhasil dihapus' });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
