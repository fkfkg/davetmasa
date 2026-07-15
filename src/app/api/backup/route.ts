import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

const DATA_ROOT = process.env.USER_DATA_PATH || process.cwd();
const DATA_FILE = path.join(DATA_ROOT, 'davetmasa_data.json');
const BACKUP_DIR = path.join(DATA_ROOT, 'backups');

const PRIVATE_KEY_PARTS = [
  'license',
  'licence',
  'password',
  'private',
  'secret',
  'token',
  'hwid',
  'hardware',
  'key',
];

async function readData() {
  try {
    return JSON.parse(await readFile(DATA_FILE, 'utf8'));
  } catch (error: any) {
    if (error.code === 'ENOENT') return {};
    throw error;
  }
}

function sanitizeBackup(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => sanitizeBackup(item));
  }

  if (value && typeof value === 'object') {
    const clean: Record<string, unknown> = {};
    for (const [key, child] of Object.entries(value)) {
      const normalizedKey = key.toLowerCase();
      if (PRIVATE_KEY_PARTS.some((part) => normalizedKey.includes(part))) {
        continue;
      }
      clean[key] = sanitizeBackup(child);
    }
    return clean;
  }

  return value;
}

function backupFileName(prefix: string) {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  return `${prefix}-${stamp}.json`;
}

export async function GET() {
  try {
    const data = await readData();
    return NextResponse.json({
      exported_at: new Date().toISOString(),
      app: 'davetmasa',
      version: 1,
      data: sanitizeBackup(data),
    });
  } catch (error) {
    console.error('Yedek alma hatasi:', error);
    return NextResponse.json({ error: 'Yedek alinamadi' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const incomingData = body?.data ?? body;
    const currentData = await readData();

    await mkdir(BACKUP_DIR, { recursive: true });
    const safetyBackupPath = path.join(BACKUP_DIR, backupFileName('geri-yukleme-oncesi'));
    await writeFile(
      safetyBackupPath,
      JSON.stringify({
        exported_at: new Date().toISOString(),
        app: 'davetmasa',
        version: 1,
        data: sanitizeBackup(currentData),
      }, null, 2),
      'utf8'
    );

    await writeFile(DATA_FILE, JSON.stringify(sanitizeBackup(incomingData), null, 2), 'utf8');

    return NextResponse.json({
      ok: true,
      safetyBackupPath,
    });
  } catch (error) {
    console.error('Yedekten geri yukleme hatasi:', error);
    return NextResponse.json({ error: 'Yedek yuklenemedi' }, { status: 500 });
  }
}
