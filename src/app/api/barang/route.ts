import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

// GET: List all barang
export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { data, error } = await supabase
            .from('barang')
            .select(`
                *,
                kategori:kategori_id (id, nama),
                ruangan:ruangan_id (id, nama)
            `)
            .order('created_at', { ascending: false });

        if (error) {
            console.error('Error fetching barang:', error);
            return NextResponse.json({ error: 'Gagal mengambil data barang' }, { status: 500 });
        }

        return NextResponse.json({ data });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}

// POST: Create new barang
export async function POST(request: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { nama, deskripsi, kategori_id, ruangan_id, jumlah, kondisi } = body;

        if (!nama || !kategori_id || !ruangan_id) {
            return NextResponse.json(
                { error: 'Nama, kategori, dan ruangan harus diisi' },
                { status: 400 }
            );
        }

        const { data, error } = await supabase
            .from('barang')
            .insert({
                nama,
                deskripsi,
                kategori_id,
                ruangan_id,
                jumlah: jumlah || 1,
                kondisi: kondisi || 'baik'
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating barang:', error);
            return NextResponse.json({ error: 'Gagal menambah barang' }, { status: 500 });
        }

        return NextResponse.json({ message: 'Barang berhasil ditambahkan', data }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
