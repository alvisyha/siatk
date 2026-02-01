import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Get single kategori by ID
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { data, error } = await supabase
            .from('kategori')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// PUT: Update kategori
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        const { data, error } = await supabase
            .from('kategori')
            // @ts-ignore
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating kategori:', error);
            return NextResponse.json({ error: 'Gagal mengupdate kategori' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Kategori berhasil diupdate', data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// DELETE: Delete kategori
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { error } = await supabase
            .from('kategori')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting kategori:', error);
            return NextResponse.json({ error: 'Gagal menghapus kategori' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Kategori berhasil dihapus' });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
