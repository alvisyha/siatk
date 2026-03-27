// Fixed Satuan API Route - Built-in Next.js App Router
import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: List all satuan
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('satuan')
            .select('*')
            .order('nama', { ascending: true });

        if (error) {
            console.error('SUPABASE ERROR (Satuan):', error);
            return NextResponse.json({ error: 'Gagal mengambil data satuan', details: error.message }, { status: 500 });
        }

        console.log('SUCCESS: Fetched Satuan count:', data?.length || 0);

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// POST: Create new satuan
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { nama, deskripsi } = body;

        if (!nama) {
            return NextResponse.json({ error: 'Nama satuan harus diisi' }, { status: 400 });
        }

        const insertData: any = { nama };
        if (deskripsi) insertData.deskripsi = deskripsi;

        const { data, error } = await supabase
            .from('satuan')
            // @ts-ignore
            .insert(insertData)
            .select()
            .single();

        if (error) {
            console.error('Error creating satuan:', error);
            return NextResponse.json({ error: 'Gagal menambah satuan' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Satuan berhasil ditambahkan', data }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
