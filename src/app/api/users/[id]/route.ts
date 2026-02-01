import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

interface RouteParams {
    params: Promise<{ id: string }>;
}

// PUT: Update user
export async function PUT(request: Request, { params }: RouteParams) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;
        const body = await request.json();

        // Remove sensitive or immutable fields if they are passed
        const { id: _, created_at: __, ...updates } = body;

        const { data, error } = await supabase
            .from('users')
            // @ts-ignore
            .update(updates)
            .eq('id', id)
            .select()
            .single();

        if (error) {
            console.error('Error updating user:', error);
            return NextResponse.json({ error: 'Gagal mengupdate user' }, { status: 500 });
        }

        return NextResponse.json({ message: 'User berhasil diupdate', data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// DELETE: Delete user
export async function DELETE(request: Request, { params }: RouteParams) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { id } = await params;

        const { error } = await supabase
            .from('users')
            .delete()
            .eq('id', id);

        if (error) {
            console.error('Error deleting user:', error);
            return NextResponse.json({ error: 'Gagal menghapus user' }, { status: 500 });
        }

        return NextResponse.json({ message: 'User berhasil dihapus' });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
