/**
 * DavetMasa – Lisans Yönetici Modülü
 *
 * Disk üzerinde şifrelenmiş lisans dosyasını okur/yazar,
 * deneme süresi, saat hilesi tespiti ve lisans doğrulaması yapar.
 */
import fs from 'fs';
import path from 'path';
import { encryptData, decryptData, decodeLicenseKey, type LicensePayload } from './crypto';
import { getHardwareId } from './hwid';

// ── Dosya Yolları ────────────────────────────────────────────────────────

const DATA_DIR = path.join(process.env.USER_DATA_PATH || process.cwd(), 'data');
const LICENSE_FILE = path.join(DATA_DIR, 'license.enc');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ── Lisans Verisi Yapısı ─────────────────────────────────────────────────

export interface StoredLicense {
  /** Donanım kimliği */
  hwid: string;
  /** Lisans tipi: trial | monthly | yearly | lifetime */
  type: string;
  /** Son kullanma tarihi (ms timestamp) */
  expiry: number;
  /** Lisans etkinleştirilme tarihi (ms timestamp) */
  activatedAt: number;
  /** Uygulama son açılış tarihi – saat hilesi tespiti için (ms timestamp) */
  lastSeen: number;
  /** Orijinal lisans anahtarı (referans) */
  licenseKey: string;
}

export type LicenseStatus =
  | { valid: true; type: string; daysLeft: number; hwid: string }
  | { valid: false; reason: string; hwid: string };

// ── Okuma / Yazma ────────────────────────────────────────────────────────

function readLicense(): StoredLicense | null {
  try {
    if (!fs.existsSync(LICENSE_FILE)) return null;
    const hex = fs.readFileSync(LICENSE_FILE, 'utf8').trim();
    return decryptData<StoredLicense>(hex);
  } catch {
    return null;
  }
}

function writeLicense(data: StoredLicense): void {
  ensureDataDir();
  fs.writeFileSync(LICENSE_FILE, encryptData(data), 'utf8');
}

// ── Deneme Süresi ────────────────────────────────────────────────────────

const TRIAL_DAYS = 7;

/**
 * Deneme süresini başlatır.
 * Daha önce başlatılmışsa mevcut veriyi döner.
 */
export function startTrial(): StoredLicense {
  const existing = readLicense();
  if (existing) return existing;

  const now = Date.now();
  const hwid = getHardwareId();
  const data: StoredLicense = {
    hwid,
    type: 'trial',
    expiry: now + TRIAL_DAYS * 24 * 60 * 60 * 1000,
    activatedAt: now,
    lastSeen: now,
    licenseKey: 'TRIAL',
  };
  writeLicense(data);
  return data;
}

// ── Lisans Doğrulama ─────────────────────────────────────────────────────

/**
 * Mevcut lisansın durumunu kontrol eder.
 * - Lisans yoksa: geçersiz (henüz aktive edilmemiş)
 * - Saat geri alınmışsa: geçersiz
 * - Süresi dolmuşsa: geçersiz
 * - Geçerliyse: kalan gün sayısı ile birlikte döner
 */
export function checkLicense(): LicenseStatus {
  const hwid = getHardwareId();
  const data = readLicense();

  if (!data) {
    return { valid: false, reason: 'no_license', hwid };
  }

  // Donanım kontrolü
  if (data.hwid !== hwid) {
    return { valid: false, reason: 'hwid_mismatch', hwid };
  }

  const now = Date.now();

  // Saat hilesi tespiti: şu anki zaman, son görülme zamanından eskiyse
  if (now < data.lastSeen - 60_000) {
    // 1 dakikalık tolerans (küçük saat kaymaları için)
    return { valid: false, reason: 'clock_tamper', hwid };
  }

  // Son görülme zamanını güncelle
  data.lastSeen = now;
  writeLicense(data);

  // Süre kontrolü (lifetime için atla)
  if (data.type !== 'lifetime' && now > data.expiry) {
    return { valid: false, reason: 'expired', hwid };
  }

  const daysLeft =
    data.type === 'lifetime'
      ? 9999
      : Math.max(0, Math.ceil((data.expiry - now) / (24 * 60 * 60 * 1000)));

  return { valid: true, type: data.type, daysLeft, hwid };
}

// ── Lisans Aktivasyonu ───────────────────────────────────────────────────

export interface ActivationResult {
  success: boolean;
  error?: string;
}

/**
 * Kullanıcının girdiği lisans anahtarını doğrular ve kaydeder.
 */
export function activateLicense(key: string): ActivationResult {
  const hwid = getHardwareId();
  const payload: LicensePayload | null = decodeLicenseKey(key);

  if (!payload) {
    return { success: false, error: 'Geçersiz lisans anahtarı.' };
  }

  // HWID eşleşmesi
  if (payload.h.toUpperCase() !== hwid.toUpperCase()) {
    return {
      success: false,
      error: 'Bu lisans anahtarı bu bilgisayar için üretilmemiş.',
    };
  }

  // Süre kontrolü (lifetime hariç)
  if (payload.t !== 'lifetime' && Date.now() > payload.e) {
    return { success: false, error: 'Lisans anahtarının süresi dolmuş.' };
  }

  const now = Date.now();
  const data: StoredLicense = {
    hwid,
    type: payload.t,
    expiry: payload.e,
    activatedAt: now,
    lastSeen: now,
    licenseKey: key,
  };
  writeLicense(data);

  return { success: true };
}

// ── Lisans Bilgisi ───────────────────────────────────────────────────────

/**
 * Mevcut lisans bilgisini döner (UI gösterimi için).
 */
export function getLicenseInfo(): {
  exists: boolean;
  type?: string;
  expiry?: number;
  activatedAt?: number;
} {
  const data = readLicense();
  if (!data) return { exists: false };
  return {
    exists: true,
    type: data.type,
    expiry: data.expiry,
    activatedAt: data.activatedAt,
  };
}
