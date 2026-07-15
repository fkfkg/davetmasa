/**
 * DavetMasa – Yerel Şifre Yönetimi
 *
 * Admin şifresinin hashlenmiş halini ve master reset kodunu
 * disk üzerinde şifreli olarak saklar/doğrular.
 */
import fs from 'fs';
import path from 'path';
import { encryptData, decryptData, hashPassword, verifyPassword, generateMasterCode } from '../license/crypto';

const DATA_DIR = path.join(process.env.USER_DATA_PATH || process.cwd(), 'data');
const AUTH_FILE = path.join(DATA_DIR, 'auth.enc');

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

// ── Veri Yapısı ──────────────────────────────────────────────────────────

interface AuthData {
  /** PBKDF2 ile hashlenmiş şifre (salt:hash) */
  passwordHash: string;
  /** Master reset kodu (XXXX-XXXX-XXXX-XXXX) – hashlenmeden saklanır çünkü
   *  dosyanın kendisi AES ile şifrelidir. */
  masterCode: string;
  /** Şifre oluşturulma tarihi */
  createdAt: number;
}

// ── Okuma / Yazma ────────────────────────────────────────────────────────

function readAuth(): AuthData | null {
  try {
    if (!fs.existsSync(AUTH_FILE)) return null;
    const hex = fs.readFileSync(AUTH_FILE, 'utf8').trim();
    return decryptData<AuthData>(hex);
  } catch {
    return null;
  }
}

function writeAuth(data: AuthData): void {
  ensureDataDir();
  fs.writeFileSync(AUTH_FILE, encryptData(data), 'utf8');
}

// ── Genel İşlemler ───────────────────────────────────────────────────────

/** Şifre daha önce oluşturulmuş mu? */
export function isPasswordSet(): boolean {
  return readAuth() !== null;
}

/**
 * İlk kurulumda admin şifresi oluşturur.
 * @returns Master reset kodu (kullanıcıya gösterilmeli)
 */
export function setupPassword(password: string): { masterCode: string } {
  if (isPasswordSet()) {
    throw new Error('Şifre zaten oluşturulmuş.');
  }

  const hashed = hashPassword(password);
  const masterCode = generateMasterCode();
  const data: AuthData = {
    passwordHash: hashed,
    masterCode,
    createdAt: Date.now(),
  };
  writeAuth(data);
  return { masterCode };
}

/**
 * Girilen şifreyi doğrular.
 */
export function verifyLoginPassword(password: string): boolean {
  const data = readAuth();
  if (!data) return false;
  return verifyPassword(password, data.passwordHash);
}

/**
 * Master reset kodu ile şifreyi sıfırlar.
 * @returns Yeni master reset kodu
 */
export function resetPasswordWithMasterCode(
  masterCode: string,
  newPassword: string
): { success: boolean; newMasterCode?: string; error?: string } {
  const data = readAuth();
  if (!data) {
    return { success: false, error: 'Şifre henüz oluşturulmamış.' };
  }

  if (data.masterCode !== masterCode) {
    return { success: false, error: 'Master reset kodu yanlış.' };
  }

  const newHash = hashPassword(newPassword);
  const newMaster = generateMasterCode();
  const updated: AuthData = {
    passwordHash: newHash,
    masterCode: newMaster,
    createdAt: Date.now(),
  };
  writeAuth(updated);
  return { success: true, newMasterCode: newMaster };
}
