import { NextResponse } from 'next/server';
import { supabase, sb } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await sb
            .from('supplier')
            .select('*')
            .order('nama', { ascending: true });

        if (error) throw error;

        return NextResponse.json({ data });
    } catch (error: any) {
        console.error('Error fetching suppliers:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { nama, alamat, telepon } = body;

        const { data, error } = await sb
            .from('supplier')
            .insert([{ nama, alamat, telepon }] as any)
            .select()
            .single();

        if (error) throw error;

        return NextResponse.json({ data, message: 'Supplier berhasil ditambahkan' });
    } catch (error: any) {
        console.error('Error creating supplier:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
