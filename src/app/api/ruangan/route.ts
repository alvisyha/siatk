import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

// GET: List all ruangan
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('ruangan')
            .select('*')
            .order('nama', { ascending: true });

        if (error) {
            console.error('Error fetching ruangan:', error);
            return NextResponse.json({ error: 'Gagal mengambil data ruangan' }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// POST: Create new ruangan
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { nama, lokasi, deskripsi } = body;

        if (!nama) {
            return NextResponse.json({ error: 'Nama ruangan harus diisi' }, { status: 400 });
        }

        const { data, error } = await supabase
            .from('ruangan')
            .insert({ nama, lokasi, deskripsi })
            .select()
            .single();

        if (error) {
            console.error('Error creating ruangan:', error);
            return NextResponse.json({ error: 'Gagal menambah ruangan' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Ruangan berhasil ditambahkan', data }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
