import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
    const token = request.cookies.get('auth-token')?.value;
    const isAuthPage = request.nextUrl.pathname === '/login';
    const isDashboardPage = request.nextUrl.pathname.startsWith('/dashboard');

    // If user is not logged in and trying to access dashboard
    if (!token && isDashboardPage) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // If user is logged in and trying to access login page
    if (token && isAuthPage) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    matcher: ['/login', '/dashboard/:path*']
};
