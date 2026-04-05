import { NextResponse } from 'next/server';
import { supabase, sb } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        // Fetch barang and satuan separately to avoid ambiguous join errors
        const [barangRes, satuanRes] = await Promise.all([
            sb.from('barang').select('*').order('nama', { ascending: true }),
            sb.from('satuan').select('id, nama')
        ]);

        if (barangRes.error) {
            console.error('SERVER ERROR (Fetch Barang):', JSON.stringify(barangRes.error, null, 2));
            return NextResponse.json({ 
                error: 'Gagal mengambil data barang dari database',
                details: barangRes.error.message 
            }, { status: 500 });
        }

        const barangData = barangRes.data || [];
        const satuanData = satuanRes.data || [];

        console.log(`DEBUG: Found ${barangData.length} barang and ${satuanData.length} satuan`);

        // Normalize data and ensure JSON safety
        const normalizedData = barangData.map((item: any) => {
            // Force status to boolean
            let isAktif = true;
            if (item.status === false || item.status === 'nonaktif' || item.status === 'false' || item.status === 0) {
                isAktif = false;
            }
            
            const relatedSatuan = satuanData.find((s: any) => s.id === item.satuan_id);

            // Return clean object
            return {
                ...item,
                status: isAktif,
                satuan: relatedSatuan ? { nama: relatedSatuan.nama } : null,
                // Ensure numeric fields are numbers, not BigInts (safeguard)
                stok: item.stok !== undefined ? Number(item.stok) : 0,
                stok_minimum: item.stok_minimum !== undefined ? Number(item.stok_minimum) : 0
            };
        });

        return NextResponse.json({ data: normalizedData });
    } catch (error: any) {
        console.error('CRITICAL ERROR in api/barang GET:', error);
        return NextResponse.json({ 
            error: 'Terjadi kesalahan sistem internal',
            message: error.message || String(error)
        }, { status: 500 });
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
        const { nama, kode, deskripsi, satuan_id, stok_minimum, stok } = body;

        if (!nama) {
            return NextResponse.json(
                { error: 'Nama barang harus diisi' },
                { status: 400 }
            );
        }

        const parsedStok = parseInt(stok);
        const parsedStokMin = parseInt(stok_minimum);

        if (isNaN(parsedStok) || parsedStok <= 0) {
            return NextResponse.json(
                { error: 'Stok awal harus berupa angka dan lebih dari 0' },
                { status: 400 }
            );
        }

        if (isNaN(parsedStokMin) || parsedStokMin <= 0) {
            return NextResponse.json(
                { error: 'Stok minimal harus berupa angka dan lebih dari 0' },
                { status: 400 }
            );
        }

        // Check for duplicate name
        const { data: existingName } = await sb
            .from('barang')
            .select('id')
            .ilike('nama', nama.trim())
            .single();

        if (existingName) {
            return NextResponse.json(
                { error: 'Nama barang sudah terdaftar, gunakan nama lain' },
                { status: 400 }
            );
        }

        const { data, error } = await sb
            .from('barang')
            .insert({
                nama,
                kode,
                deskripsi,
                satuan_id: satuan_id || null,
                stok_minimum: parsedStokMin,
                stok: parsedStok,
                status: true
            })
            .select()
            .single();

        if (error) {
            console.error('Error creating barang:', error);
            return NextResponse.json({ error: 'Gagal menambah barang' }, { status: 500 });
        }

        const resData = data as any;
        const { data: sInfo } = await sb.from('satuan').select('nama').eq('id', resData.satuan_id).single();

        const enrichedData = {
            ...resData,
            satuan: sInfo || null
        };

        return NextResponse.json({ message: 'Barang berhasil ditambahkan', data: enrichedData }, { status: 201 });
    } catch (error) {
        console.error('Error:', error);
        return NextResponse.json({ error: 'Terjadi kesalahan server' }, { status: 500 });
    }
}
