import { NextResponse } from 'next/server';
import { sb } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user || user.role !== 'admin') {
            return NextResponse.json({ count: 0 });
        }

        const { count } = await sb
            .from('pengajuan_items')
            .select('id', { count: 'exact', head: true })
            .eq('status', 'pending');

        return NextResponse.json({ count: count || 0 });
    } catch (error) {
        console.error('Notification pending count error:', error);
        return NextResponse.json({ count: 0 });
    }
}
