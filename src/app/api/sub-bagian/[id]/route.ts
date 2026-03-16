import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// GET: Get single sub-bagian by ID
export async function GET(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { data, error } = await supabase
            .from('sub_bagian')
            .select('*')
            .eq('id', id)
            .single();

        if (error) {
            console.error('SUPABASE ERROR (Sub Bagian GET ID):', error);
            return NextResponse.json({ 
                error: 'Sub bagian tidak ditemukan',
                details: error.message,
                code: error.code
            }, { status: 404 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// PUT: Update sub-bagian
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        const { data, error } = await supabase
            .from('sub_bagian')
            // @ts-ignore
            .update(body)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('SUPABASE ERROR (Sub Bagian PUT):', error);
            return NextResponse.json({ 
                error: 'Gagal mengupdate sub bagian',
                details: error.message,
                hint: error.hint,
                code: error.code
            }, { status: 500 });
        }

        return NextResponse.json({ message: 'Sub bagian berhasil diupdate', data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// DELETE: Delete sub-bagian
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { error } = await supabase
            .from('sub_bagian')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('SUPABASE ERROR (Sub Bagian DELETE):', error);
            return NextResponse.json({ 
                error: 'Gagal menghapus sub bagian',
                details: error.message,
                code: error.code
            }, { status: 500 });
        }

        return NextResponse.json({ message: 'Sub bagian berhasil dihapus' });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
