import { ALLOWED_ADMIN_EMAIL } from '@/lib/constants';
import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });


  console.log('Middleware Debug:', {
    URL: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Defined' : 'Undefined',
    ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Defined' : 'Undefined',
    NODE_ENV: process.env.NODE_ENV,
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // getUser is secure and validates the session with Supabase server
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === '/login';
  const isUnauthorizedPage = request.nextUrl.pathname === '/unauthorized';
  
  const isPublicPath = request.nextUrl.pathname === '/login' ||
    request.nextUrl.pathname.startsWith('/_next') ||
    request.nextUrl.pathname.startsWith('/api') ||
    request.nextUrl.pathname.startsWith('/static');

  // If no user and trying to access protected route, redirect to login
  if (!user && !isPublicPath) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // If user exists, verify allowlist (replaces role check)
  if (user && !isLoginPage && !isUnauthorizedPage && !isPublicPath) {
    if (user.email !== ALLOWED_ADMIN_EMAIL) {
      return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  // If logged in and trying to access login page, redirect to dashboard
  if (user && isLoginPage) {
    if (user.email === ALLOWED_ADMIN_EMAIL) {
       return NextResponse.redirect(new URL('/', request.url));
    } else {
       // If logged in but not allowed, logout or redirect to unauthorized? 
       // Better redirect to unauthorized so they know why they can't login/access
       return NextResponse.redirect(new URL('/unauthorized', request.url));
    }
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
