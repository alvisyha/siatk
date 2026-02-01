import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

// GET: List all users
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('users')
            .select('*')
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({ error: 'Gagal mengambil data user' }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// POST: Create new user
export async function POST(request: Request) {
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { email, password, name, role, avatar } = body;

        if (!email || !password || !name || !role) {
            return NextResponse.json(
                { error: 'Email, password, nama, dan role harus diisi' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('users')
            // @ts-ignore
            .insert({
                email,
                password, // Note: In a real app, hash this!
                name,
                role,
                avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating user:', error);
            return NextResponse.json({ error: 'Gagal menambah user' }, { status: 500 });
        }

        return NextResponse.json({ message: 'User berhasil ditambahkan', data }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
