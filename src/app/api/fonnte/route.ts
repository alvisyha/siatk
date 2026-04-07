import { NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/auth';

export async function POST(request: Request) {
    try {
        // Optional: Check authentication to prevent unauthorized messaging
        // Remove or comment out these lines if you want this API to be accessible publicly (e.g., for webhooks)
        const user = await getCurrentUser();
        if (!user) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const body = await request.json();
        const { target, message, url, filename } = body;

        if (!target || !message) {
            return NextResponse.json(
                { error: 'Target (nomor telepon) dan message (pesan) harus diisi' },
                { status: 400 }
            );
        }

        const token = process.env.FONNTE_TOKEN;
        
        if (!token) {
            console.error('FONNTE_TOKEN is not configured in environment variables');
            return NextResponse.json(
                { error: 'Konfigurasi Fonnte token belum diatur. Tambahkan FONNTE_TOKEN di file .env' },
                { status: 500 }
            );
        }

        const formData = new FormData();
        formData.append('target', target);
        // Add countryCode to ensure it targets Indonesian numbers if missing +62 / 0
        formData.append('countryCode', '62'); 
        formData.append('message', message);

        // Optional parameters for media
        if (url) formData.append('url', url);
        if (filename) formData.append('filename', filename);

        const response = await fetch('https://api.fonnte.com/send', {
            method: 'POST',
            headers: {
                Authorization: token,
            },
            body: formData,
        });

        const data = await response.json();

        if (!response.ok || !data.status) {
            console.error('Fonnte API error:', data);
            return NextResponse.json(
                { error: 'Gagal mengirim pesan dari server Fonnte', details: data },
                { status: response.status !== 200 ? response.status : 400 }
            );
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Pesan berhasil dikirim', 
            data 
        });

    } catch (error: any) {
        console.error('Error in WhatsApp API route:', error);
        return NextResponse.json(
            { error: 'Terjadi kesalahan pada sistem saat mengirim pesan', details: error.message },
            { status: 500 }
        );
    }
}
