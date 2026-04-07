/**
 * Utility function to send WhatsApp messages using Fonnte.
 * On the server, it calls the Fonnte API directly using the FONNTE_TOKEN.
 * On the client, it calls our internal API route to keep the token secure.
 */
export async function sendWA(target: string, message: string, media?: { url: string; filename?: string }) {
    try {
        const token = process.env.FONNTE_TOKEN;

        // If we have a token (Server-side context), call Fonnte directly
        if (token && typeof window === 'undefined') {
            const formData = new FormData();
            formData.append('target', target);
            formData.append('message', message);
            formData.append('countryCode', '62');
            if (media?.url) formData.append('url', media.url);
            if (media?.filename) formData.append('filename', media.filename);

            const response = await fetch('https://api.fonnte.com/send', {
                method: 'POST',
                headers: {
                    Authorization: token,
                },
                body: formData,
            });

            const data = await response.json();
            if (!response.ok || !data.status) {
                console.error('Fonnte Direct Server Error:', data);
                throw new Error(data.reason || 'Gagal mengirim pesan WhatsApp dari server');
            }
            return data;
        }

        // Client-side or fallback: Call our internal API route
        const response = await fetch('/api/fonnte', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                target,
                message,
                url: media?.url,
                filename: media?.filename,
            }),
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || 'Gagal mengirim pesan WhatsApp');
        }

        return data;
    } catch (error: any) {
        console.error('WhatsApp Utility Error:', error);
        throw error;
    }
}
