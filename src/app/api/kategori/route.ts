import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

// GET: List all kategori
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('kategori')
            .select('*')
            .order('nama', { ascending: true });

        if (error) {
            console.error('Error fetching kategori:', error);
            return NextResponse.json({ error: 'Gagal mengambil data kategori' }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// POST: Create new kategori
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { nama, deskripsi } = body;

        if (!nama) {
            return NextResponse.json({ error: 'Nama kategori harus diisi' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('kategori')
            .insert({ nama, deskripsi })
            .select()
            .single();

        if (error) {
            console.error('Error creating kategori:', error);
            return NextResponse.json({ error: 'Gagal menambah kategori' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Kategori berhasil ditambahkan', data }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
