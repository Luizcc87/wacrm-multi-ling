import createMiddleware from 'next-intl/middleware';
import { type NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@supabase/ssr';
import { routing } from '@/i18n/routing';

const intlMiddleware = createMiddleware(routing);

export async function middleware(request: NextRequest) {
  // API routes não têm locale — passam direto para auth check
  if (request.nextUrl.pathname.startsWith('/api')) {
    // Auth check para API routes protegidas
    if (request.nextUrl.pathname.startsWith('/api/whatsapp/') &&
        !request.nextUrl.pathname.includes('/webhook')) {
      let supabaseResponse = NextResponse.next({ request });
      const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            getAll() { return request.cookies.getAll(); },
            setAll(cookiesToSet) {
              cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
              supabaseResponse = NextResponse.next({ request });
              cookiesToSet.forEach(({ name, value, options }) =>
                supabaseResponse.cookies.set(name, value, options)
              );
            },
          },
        }
      );
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      return supabaseResponse;
    }
    return NextResponse.next();
  }

  // Aplicar locale routing primeiro (next-intl)
  const intlResponse = intlMiddleware(request);
  if (intlResponse) return intlResponse;

  // Auth check para rotas com locale
  // Extrai pathname sem o prefixo de locale (ex: /en/dashboard → /dashboard)
  const localePattern = new RegExp(`^/(${routing.locales.join('|')})`);
  const pathWithoutLocale = request.nextUrl.pathname.replace(localePattern, '') || '/';

  let supabaseResponse = NextResponse.next({ request });
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return request.cookies.getAll(); },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();

  const locale = request.nextUrl.pathname.match(localePattern)?.[1] ?? routing.defaultLocale;

  // Auth pages — redireciona para /dashboard se já logado
  if (user && ['/login', '/signup', '/forgot-password'].includes(pathWithoutLocale)) {
    const url = request.nextUrl.clone();
    const inviteToken = request.nextUrl.searchParams.get('invite');
    if (inviteToken && ['/login', '/signup'].includes(pathWithoutLocale)) {
      url.pathname = `/${locale}/join/${encodeURIComponent(inviteToken)}`;
    } else {
      url.pathname = `/${locale}/dashboard`;
    }
    url.search = '';
    return NextResponse.redirect(url);
  }

  // Protected pages — redireciona para /login se não autenticado
  const protectedPaths = ['/dashboard', '/inbox', '/contacts', '/pipelines', '/broadcasts', '/automations', '/settings', '/flows'];
  if (!user && protectedPaths.some(p => pathWithoutLocale.startsWith(p))) {
    const url = request.nextUrl.clone();
    url.pathname = `/${locale}/login`;
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
};
