/**
 * DavetMasa – Donanım Kimliği (HWID) Modülü
 *
 * Windows'ta anakart ve CPU seri numaralarını kullanarak
 * bilgisayara özgü 16 karakterlik bir HEX kimlik üretir.
 * Bu kimlik format atılsa bile değişmez (donanım değişmediği sürece).
 */
import { execSync } from 'child_process';
import crypto from 'crypto';

/**
 * Windows `wmic` komutuyla belirtilen WMI sınıfından bir değer çeker.
 * Komut başarısız olursa boş string döner.
 */
function wmicQuery(wmiClass: string, property: string): string {
  try {
    const raw = execSync(`wmic ${wmiClass} get ${property}`, {
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
    });
    // İlk satır başlık, ikinci satır değer
    const lines = raw.trim().split(/\r?\n/).filter(Boolean);
    return (lines[1] || '').trim();
  } catch {
    return '';
  }
}

/**
 * Alternatif yöntem: PowerShell ile donanım bilgisi çeker.
 * wmic kullanılamadığında yedek olarak devreye girer.
 */
function powershellQuery(command: string): string {
  try {
    const raw = execSync(`powershell -NoProfile -Command "${command}"`, {
      encoding: 'utf8',
      timeout: 5000,
      windowsHide: true,
    });
    return raw.trim();
  } catch {
    return '';
  }
}

/**
 * Bilgisayara özgü 16 karakterlik büyük harf HEX Hardware ID üretir.
 *
 * Kullanılan kaynaklar (sırasıyla):
 * 1. Anakart seri numarası (baseboard serialnumber)
 * 2. CPU kimliği (processor processorid)
 * 3. BIOS seri numarası (bios serialnumber)
 *
 * Tüm değerler birleştirilerek SHA-256 ile hashlenir,
 * ilk 16 karakter alınarak HWID oluşturulur.
 */
export function getHardwareId(): string {
  let motherboard = wmicQuery('baseboard', 'serialnumber');
  let cpu = wmicQuery('cpu', 'processorid');
  let bios = wmicQuery('bios', 'serialnumber');

  // wmic başarısız olursa PowerShell dene
  if (!motherboard && !cpu && !bios) {
    motherboard = powershellQuery(
      '(Get-CimInstance Win32_BaseBoard).SerialNumber'
    );
    cpu = powershellQuery(
      '(Get-CimInstance Win32_Processor).ProcessorId'
    );
    bios = powershellQuery(
      '(Get-CimInstance Win32_BIOS).SerialNumber'
    );
  }

  // Tüm değerler boşsa makine adını ve kullanıcı adını da ekle (son çare)
  const machineName = process.env.COMPUTERNAME || process.env.HOSTNAME || 'unknown';
  const raw = `${motherboard}|${cpu}|${bios}|${machineName}`;

  const hash = crypto.createHash('sha256').update(raw).digest('hex');
  return hash.slice(0, 16).toUpperCase();
}
