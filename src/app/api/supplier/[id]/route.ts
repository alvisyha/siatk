import { NextResponse } from 'next/server';
import { supabase, sb } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function PUT(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();
        const { nama, alamat, telepon } = body;

        const { data, error } = await sb
            .from('supplier')
            .update({ nama, alamat, telepon })
            .eq('id', id)
            .select()
            .single();

        if (error) throw error;

        if (!data) {
            return NextResponse.json({ error: 'Supplier tidak ditemukan' }, { status: 404 });
        }

        return NextResponse.json({ data, message: 'Supplier berhasil diperbarui' });
    } catch (error: any) {
        console.error('Error updating supplier:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(
    request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { error } = await sb
            .from('supplier')
            .delete()
            .eq('id', id);

        if (error) throw error;

        return NextResponse.json({ message: 'Supplier berhasil dihapus' });
    } catch (error: any) {
        console.error('Error deleting supplier:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
