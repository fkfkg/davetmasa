import { NextResponse } from 'next/server';
import fs from 'fs/promises';
import path from 'path';

// Bu dosya Next.js projesinin kök dizininde yer alacak.
const DATA_FILE = path.join(process.env.USER_DATA_PATH || process.cwd(), 'davetmasa_data.json');

// Yardımcı Fonksiyonlar
async function readData() {
  try {
    const fileContents = await fs.readFile(DATA_FILE, 'utf8');
    return JSON.parse(fileContents);
  } catch (err: any) {
    // Eğer dosya yoksa (ilk çalışma) boş bir obje dön
    if (err.code === 'ENOENT') {
      return {};
    }
    throw err;
  }
}

async function writeData(data: any) {
  await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
}

export async function GET() {
  try {
    const data = await readData();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Veri okuma hatası:', error);
    return NextResponse.json({ error: 'Veri okunamadı' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Güvenlik veya tablo izolasyonu eklenebilir, şimdilik tüm JSON yedeğini yazıyoruz
    await writeData(body);
    
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Veri yazma hatası:', error);
    return NextResponse.json({ error: 'Veri yazılamadı' }, { status: 500 });
  }
}
