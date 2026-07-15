import { NextResponse, type NextRequest } from 'next/server';

/**
 * Lisans + Oturum kontrolü yapan middleware.
 *
 * Akış:
 *  1. Belirli yollar hiçbir kontrolden geçmez (API, static, activation).
 *  2. /public/* QR yolları hiçbir lisans/şifre kontrolünden geçmez.
 *  3. Lisans cookie'si yoksa → /activation sayfasına yönlendir.
 *  4. Auth sayfaları (login, register, setup) lisansla erişilebilir.
 *  5. Korumalı sayfalar (dashboard, events, settings...) hem lisans hem oturum gerektirir.
 *  6. Oturum varken auth sayfalarına girerse → dashboard'a yönlendir.
 */

// Hiçbir kontrole tabi olmayan yollar
const bypassPaths = [
  '/api/license',
  '/api/auth-local',
  '/activation',
  '/public/',
  '/_next',
  '/favicon.ico',
];

// Lisans gerekli AMA oturum (şifre) gerekmeyen yollar
const licenseOnlyPaths = ['/login', '/register', '/setup'];

// Oturum (şifre) gerektiren korumalı yollar
const protectedPaths = ['/dashboard', '/events', '/settings', '/billing', '/admin'];

// Oturum varken yeniden girilemeyecek sayfalar (giriş yapılmışsa dashboard'a yönlendir)
const authPages = ['/login', '/register', '/setup'];

export async function updateSession(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Bypass kontrolü
  if (bypassPaths.some((p) => pathname.startsWith(p))) {
    return NextResponse.next({ request });
  }

  // API rotaları için lisans cookie kontrolü yapma (veri API'leri oturum gerektirir)
  if (pathname.startsWith('/api/')) {
    return NextResponse.next({ request });
  }

  // 2. Lisans kontrolü
  const hasLicense = request.cookies.get('davetmasa_license')?.value === 'valid';

  if (!hasLicense) {
    // Landing page (/) lisanssız da görülebilir
    if (pathname === '/') {
      return NextResponse.next({ request });
    }
    // Diğer her yer → aktivasyon sayfasına
    const url = request.nextUrl.clone();
    url.pathname = '/activation';
    return NextResponse.redirect(url);
  }

  // 3. Lisans var – licenseOnly yollar için geçiş izni
  const isLicenseOnly = licenseOnlyPaths.some(
    (p) => pathname === p || pathname.startsWith(p)
  );

  // 4. Oturum kontrolü
  const hasSession = request.cookies.get('davetmasa_session')?.value === '1';

  // Oturum varken auth sayfalarına girerse → dashboard
  const isAuthPage = authPages.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`)
  );
  if (isAuthPage && hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/dashboard';
    return NextResponse.redirect(url);
  }

  // LicenseOnly yollar için oturum kontrolü yapma
  if (isLicenseOnly) {
    return NextResponse.next({ request });
  }

  // 5. Korumalı yollar (dashboard, events, settings...)
  const isProtected = protectedPaths.some((p) => pathname.startsWith(p));
  if (isProtected && !hasSession) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return NextResponse.next({ request });
}
