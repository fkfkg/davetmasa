import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const data = await request.json();
  const dataDir = path.join(process.env.USER_DATA_PATH || process.cwd(), 'data');
  const filePath = path.join(dataDir, 'local-db.json');

  await mkdir(dataDir, { recursive: true });
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');

  return NextResponse.json({ ok: true });
}
