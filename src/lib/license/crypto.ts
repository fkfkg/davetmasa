/**
 * DavetMasa – Lisans Kripto Modülü
 * 
 * Lisans anahtarlarının şifreleme/çözme ve doğrulama işlemlerini yürütür.
 * KeyGen aracıyla aynı SECRET ve algoritma kullanılmalıdır.
 */
import crypto from 'crypto';

// ── Paylaşılan Sırlar (KeyGen ile aynı olmalı) ──────────────────────────
const PUBLIC_KEY = `-----BEGIN PUBLIC KEY-----
MFkwEwYHKoZIzj0CAQYIKoZIzj0DAQcDQgAEwgkKFGiBiOXUbNBnRSkFpTLBwX3p
U5fg2M25oy2xqKvjf9K6NlknXYy4ozUCpmMDPEF13sZrnZM4FhBoNG+weQ==
-----END PUBLIC KEY-----`;

// ── Lisans Anahtarı Şifre Çözme ─────────────────────────────────────────

export interface LicensePayload {
  /** Hardware ID (16 hex) */
  h: string;
  /** Lisans tipi: trial | monthly | yearly | lifetime */
  t: string;
  /** Son kullanma tarihi (ms timestamp) */
  e: number;
  /** Oluşturulma tarihi (ms timestamp) */
  c: number;
}

/**
 * Kullanıcının girdiği lisans anahtarını (DM-XXXXX.YYYYY) çözümler ve doğrular.
 * Geçerliyse LicensePayload döner, geçersizse null döner.
 */
export function decodeLicenseKey(key: string): LicensePayload | null {
  try {
    // "DM-" önekini kaldır
    const raw = key.replace(/^DM-/i, '');
    const parts = raw.split('.');
    if (parts.length !== 2) return null;

    const [payloadB64, sigB64] = parts;
    const payloadStr = Buffer.from(payloadB64, 'base64url').toString('utf8');
    
    // İmzayı doğrula
    const verify = crypto.createVerify('SHA256');
    verify.update(payloadStr);
    const isValid = verify.verify(PUBLIC_KEY, Buffer.from(sigB64, 'base64url'));
    
    if (!isValid) return null;

    const payload: LicensePayload = JSON.parse(payloadStr);

    // Temel alan doğrulaması
    if (!payload.h || !payload.t || typeof payload.e !== 'number') {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

// ── Yerel Depolama Şifreleme ─────────────────────────────────────────────

const STORAGE_SECRET = 'DAVETMASA_STORAGE_KEY_2026';

function deriveStorageKey(): Buffer {
  return crypto.createHash('sha256').update(STORAGE_SECRET).digest();
}

function deriveStorageIv(): Buffer {
  return crypto.createHash('md5').update(STORAGE_SECRET).digest();
}

/** Bir nesneyi AES-256-CBC ile şifreler ve hex string döner. */
export function encryptData(data: unknown): string {
  const json = JSON.stringify(data);
  const cipher = crypto.createCipheriv('aes-256-cbc', deriveStorageKey(), deriveStorageIv());
  let encrypted = cipher.update(json, 'utf8', 'hex');
  encrypted += cipher.final('hex');
  return encrypted;
}

/** Şifreli hex string'i çözer ve nesne döner. */
export function decryptData<T = unknown>(hex: string): T | null {
  try {
    const decipher = crypto.createDecipheriv('aes-256-cbc', deriveStorageKey(), deriveStorageIv());
    let decrypted = decipher.update(hex, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return JSON.parse(decrypted) as T;
  } catch {
    return null;
  }
}

// ── Şifre Hash'leme (PBKDF2) ────────────────────────────────────────────

const PBKDF2_ITERATIONS = 100_000;
const PBKDF2_KEYLEN = 64;
const PBKDF2_DIGEST = 'sha512';

/**
 * Şifreyi PBKDF2 ile hashler.
 * Dönüş: `salt:hash` formatında string.
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Girilen şifreyi saklanan hash ile karşılaştırır.
 */
export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, originalHash] = storedHash.split(':');
  if (!salt || !originalHash) return false;
  const hash = crypto
    .pbkdf2Sync(password, salt, PBKDF2_ITERATIONS, PBKDF2_KEYLEN, PBKDF2_DIGEST)
    .toString('hex');
  return crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(originalHash));
}

/**
 * 16 haneli master reset kodu üretir (XXXX-XXXX-XXXX-XXXX).
 */
export function generateMasterCode(): string {
  const bytes = crypto.randomBytes(8);
  const hex = bytes.toString('hex').toUpperCase();
  return `${hex.slice(0, 4)}-${hex.slice(4, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}`;
}
