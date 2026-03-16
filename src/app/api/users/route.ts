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

        let { data, error } = await supabase
            .from('users')
            .select(`
                *,
                sub_bagian:sub_bagian_id (
                    id,
                    nama
                )
            `)
            .order('created_at', { ascending: false });

        // Fallback: If error is about missing column, try without join
        if (error && error.message.includes('column') && error.message.includes('sub_bagian_id')) {
            console.log('DEBUG: GET users sub_bagian_id column missing, falling back...');
            const retry = await supabase
                .from('users')
                .select('*')
                .order('created_at', { ascending: false });
            data = retry.data;
            error = retry.error;
        }

        if (error) {
            console.error('Error fetching users:', error);
            return NextResponse.json({ 
                error: 'Gagal mengambil data user',
                details: error.message
            }, { status: 500 });
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
        const { email, password, name, role, avatar, sub_bagian_id } = body;

        if (!email || !password || !name || !role) {
            return NextResponse.json(
                { error: 'Email, password, nama, dan role harus diisi' },
                { status: 400 }
            );
        }

        const userData: any = {
            email,
            password,
            name,
            role,
            avatar: avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=random`
        };

        // Attempt to include sub_bagian_id if provided
        if (sub_bagian_id) {
            userData.sub_bagian_id = sub_bagian_id;
        }

        let { data, error } = await supabase
            .from('users')
            .insert(userData)
            .select()
            .single();

        // Fallback: If error is about missing column, try without sub_bagian_id
        if (error && error.message.includes('column') && error.message.includes('sub_bagian_id')) {
            console.log('DEBUG: sub_bagian_id column missing, falling back...');
            delete userData.sub_bagian_id;
            const retry = await supabase
                .from('users')
                .insert(userData)
                .select()
                .single();
            data = retry.data;
            error = retry.error;
        }

        if (error) {
            console.error('Error creating user:', error);
            return NextResponse.json({ 
                error: 'Gagal menambah user', 
                details: error.message 
            }, { status: 500 });
        }

        return NextResponse.json({ message: 'User berhasil ditambahkan', data }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
