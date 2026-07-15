import { NextResponse } from 'next/server';
import {
  isPasswordSet,
  setupPassword,
  verifyLoginPassword,
  resetPasswordWithMasterCode,
} from '@/lib/auth/password';

/**
 * GET /api/auth-local
 * Şifre kurulum durumunu kontrol eder.
 */
export async function GET() {
  try {
    const passwordExists = isPasswordSet();
    return NextResponse.json({ passwordSet: passwordExists });
  } catch (error) {
    console.error('Auth kontrol hatası:', error);
    return NextResponse.json({ passwordSet: false }, { status: 500 });
  }
}

/**
 * POST /api/auth-local
 * Şifre işlemleri:
 *   action=setup  → İlk şifre oluşturma
 *   action=login  → Şifre ile giriş
 *   action=reset  → Master kod ile sıfırlama
 *
 * Body: { action, password, masterCode?, newPassword? }
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = body.action as string;

    switch (action) {
      // ── İlk Şifre Oluşturma ───────────────────────────────────────
      case 'setup': {
        const password = body.password as string;
        if (!password || password.length < 4) {
          return NextResponse.json(
            { success: false, error: 'Şifre en az 4 karakter olmalı.' },
            { status: 400 }
          );
        }

        try {
          const { masterCode } = setupPassword(password);
          // Oturumu otomatik başlat
          const response = NextResponse.json({
            success: true,
            masterCode,
            message: 'Şifre oluşturuldu. Master reset kodunuzu güvenli bir yere kaydedin!',
          });
          response.cookies.set('davetmasa_session', '1', {
            path: '/',
            maxAge: 365 * 24 * 60 * 60,
            sameSite: 'lax',
          });
          return response;
        } catch (err: unknown) {
          const message = err instanceof Error ? err.message : 'Bilinmeyen hata';
          return NextResponse.json(
            { success: false, error: message },
            { status: 400 }
          );
        }
      }

      // ── Şifre ile Giriş ───────────────────────────────────────────
      case 'login': {
        const password = body.password as string;
        if (!password) {
          return NextResponse.json(
            { success: false, error: 'Şifre gerekli.' },
            { status: 400 }
          );
        }

        const valid = verifyLoginPassword(password);
        if (!valid) {
          return NextResponse.json(
            { success: false, error: 'Şifre yanlış.' },
            { status: 401 }
          );
        }

        const response = NextResponse.json({ success: true });
        response.cookies.set('davetmasa_session', '1', {
          path: '/',
          maxAge: 365 * 24 * 60 * 60,
          sameSite: 'lax',
        });
        return response;
      }

      // ── Master Kod ile Sıfırlama ──────────────────────────────────
      case 'reset': {
        const masterCode = body.masterCode as string;
        const newPassword = body.newPassword as string;

        if (!masterCode || !newPassword) {
          return NextResponse.json(
            { success: false, error: 'Master kod ve yeni şifre gerekli.' },
            { status: 400 }
          );
        }

        if (newPassword.length < 4) {
          return NextResponse.json(
            { success: false, error: 'Yeni şifre en az 4 karakter olmalı.' },
            { status: 400 }
          );
        }

        const result = resetPasswordWithMasterCode(masterCode, newPassword);
        if (!result.success) {
          return NextResponse.json(
            { success: false, error: result.error },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          newMasterCode: result.newMasterCode,
          message: 'Şifre sıfırlandı. Yeni master kodunuzu kaydedin!',
        });
      }

      default:
        return NextResponse.json(
          { success: false, error: 'Geçersiz işlem.' },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error('Auth API hatası:', error);
    return NextResponse.json(
      { success: false, error: 'Sunucu hatası.' },
      { status: 500 }
    );
  }
}
