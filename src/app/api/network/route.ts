import { NextResponse } from 'next/server';
import os from 'os';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

function getLocalNetworkIps() {
  const interfaces = os.networkInterfaces();
  const ips: string[] = [];

  for (const entries of Object.values(interfaces)) {
    for (const entry of entries ?? []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        ips.push(entry.address);
      }
    }
  }

  return ips;
}

export async function GET() {
  const candidates = getLocalNetworkIps();
  const localIp = candidates.find((ip) => ip.startsWith('192.168.')) ?? candidates[0] ?? null;

  return NextResponse.json({
    localIp,
    candidates,
    port: process.env.PORT || '3000',
  });
}
