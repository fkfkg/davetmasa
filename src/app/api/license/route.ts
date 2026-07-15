import { NextResponse } from 'next/server';
import { checkLicense, activateLicense, startTrial, getLicenseInfo } from '@/lib/license/manager';
import { getHardwareId } from '@/lib/license/hwid';

/**
 * GET /api/license
 * Lisans durumunu ve Hardware ID'yi döner.
 *
 * Query params:
 *   ?action=status  → Mevcut lisans durumu (varsayılan)
 *   ?action=hwid    → Sadece HWID
 *   ?action=info    → Lisans detayları
 *   ?action=trial   → Deneme süresini başlat
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action') || 'status';

  try {
    switch (action) {
      case 'hwid': {
        const hwid = getHardwareId();
        return NextResponse.json({ hwid });
      }

      case 'info': {
        const info = getLicenseInfo();
        const hwid = getHardwareId();
        return NextResponse.json({ ...info, hwid });
      }

      case 'trial': {
        startTrial();
        const status = checkLicense();
        const response = NextResponse.json(status);
        if (status.valid) {
          response.cookies.set('davetmasa_license', 'valid', {
            path: '/',
            maxAge: 365 * 24 * 60 * 60,
            sameSite: 'lax',
          });
        }
        return response;
      }

      case 'status':
      default: {
        const status = checkLicense();
        const response = NextResponse.json(status);
        // Lisans geçerliyse cookie'yi ayarla/yenile
        if (status.valid) {
          response.cookies.set('davetmasa_license', 'valid', {
            path: '/',
            maxAge: 365 * 24 * 60 * 60,
            sameSite: 'lax',
          });
        } else {
          // Geçersizse cookie'yi temizle
          response.cookies.set('davetmasa_license', '', {
            path: '/',
            maxAge: 0,
          });
        }
        return response;
      }
    }
  } catch (error) {
    console.error('Lisans API hatası:', error);
    return NextResponse.json(
      { valid: false, reason: 'server_error', hwid: '' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/license
 * Lisans anahtarını aktive eder.
 *
 * Body: { key: "DM-XXXXX-XXXXX-..." }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const key = body.key as string;

    if (!key || typeof key !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Lisans anahtarı gerekli.' },
        { status: 400 }
      );
    }

    const result = activateLicense(key);

    if (result.success) {
      const response = NextResponse.json(result);
      response.cookies.set('davetmasa_license', 'valid', {
        path: '/',
        maxAge: 365 * 24 * 60 * 60,
        sameSite: 'lax',
      });
      return response;
    }

    return NextResponse.json(result, { status: 400 });
  } catch (error) {
    console.error('Lisans aktivasyon hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası.' },
      { status: 500 }
    );
  }
}
