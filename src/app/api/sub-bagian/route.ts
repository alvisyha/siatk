import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

// GET: List all sub-bagian
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('sub_bagian')
            .select('*')
            .order('nama', { ascending: true });

        if (error) {
            console.error('SUPABASE ERROR (Sub Bagian GET):', error);
            return NextResponse.json({ 
                error: 'Gagal mengambil data sub bagian', 
                details: error.message,
                hint: error.hint,
                code: error.code
            }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// POST: Create new sub-bagian
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { nama, deskripsi, pagu } = body;

        if (!nama) {
            return NextResponse.json({ error: 'Nama sub bagian harus diisi' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('sub_bagian')
            // @ts-ignore
            .insert({ nama, deskripsi, pagu: pagu || 0 })
            .select()
            .single();

        if (error) {
            console.error('SUPABASE ERROR (Sub Bagian POST):', error);
            return NextResponse.json({ 
                error: 'Gagal menambah sub bagian', 
                details: error.message,
                hint: error.hint,
                code: error.code
            }, { status: 500 });
        }

        return NextResponse.json({ message: 'Sub bagian berhasil ditambahkan', data }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
