import { v4 as uuidv4 } from 'uuid';
import type { OfflineQueueItem } from '@/types/database';

const QUEUE_KEY = 'davetmasa_offline_queue';

// Offline queue'dan tüm öğeleri al
export function getQueue(): OfflineQueueItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

// Queue'ya yeni öğe ekle
export function addToQueue(item: Omit<OfflineQueueItem, 'id' | 'timestamp' | 'retries'>): void {
  const queue = getQueue();
  queue.push({
    ...item,
    id: uuidv4(),
    timestamp: Date.now(),
    retries: 0,
  });
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// Queue'dan öğe kaldır
export function removeFromQueue(id: string): void {
  const queue = getQueue().filter((item) => item.id !== id);
  localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
}

// Queue'yu temizle
export function clearQueue(): void {
  localStorage.removeItem(QUEUE_KEY);
}

// Online mı kontrol et
export function isOnline(): boolean {
  if (typeof window === 'undefined') return true;
  return navigator.onLine;
}

// Queue'daki öğe sayısı
export function getQueueLength(): number {
  return getQueue().length;
}
