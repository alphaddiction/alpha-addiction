import { db } from '@/lib/db';

export interface CacheItem {
  key: string;
  data: any;
  createdAt: number; // timestamp in ms
}

export class CacheEngine {
  private static cache: Map<string, CacheItem> = new Map();
  private static ttlMs = 30000; // 30 seconds TTL
  private static lastSystemChangeCheck = 0;
  private static lastDetectedChangeAt = 0;

  /**
   * Obtiene la clave de caché y comprueba su validez temporal y operacional.
   */
  static async get(key: string): Promise<any | null> {
    const item = this.cache.get(key);
    if (!item) return null;

    // 1. Validar TTL temporal estándar
    const now = Date.now();
    if (now - item.createdAt > this.ttlMs) {
      this.cache.delete(key);
      return null;
    }

    // 2. Validar invalidación proactiva consultando base de datos
    const systemChangeAt = await this.getLastSystemChangeTimestamp();
    if (systemChangeAt > item.createdAt) {
      console.log(`🧹 [CacheEngine] Invalidaded cache key "${key}" due to recent system events/changes.`);
      this.cache.delete(key);
      return null;
    }

    console.log(`⚡ [CacheEngine] Cache HIT for key: "${key}"`);
    return item.data;
  }

  /**
   * Guarda un elemento en el almacén de caché en memoria.
   */
  static set(key: string, data: any): void {
    this.cache.set(key, {
      key,
      data,
      createdAt: Date.now()
    });
  }

  /**
   * Invalida de forma manual todo el almacén de caché (ej: ante nuevos eventos emitidos).
   */
  static invalidateAll(): void {
    this.cache.clear();
    this.lastDetectedChangeAt = Date.now();
    console.log('🧹 [CacheEngine] All cache cleared programmatically.');
  }

  /**
   * Determina el timestamp de la última modificación en pedidos, tickets de soporte o waitlists.
   * Cuenta con un limitador de tasa para evitar golpear la base de datos excesivamente (mínimo 2s entre comprobaciones).
   */
  private static async getLastSystemChangeTimestamp(): Promise<number> {
    const now = Date.now();
    if (now - this.lastSystemChangeCheck < 2000) {
      return this.lastDetectedChangeAt;
    }

    this.lastSystemChangeCheck = now;

    try {
      // Consultar últimos registros en Neon PostgreSQL
      const [lastOrder, lastTicket, lastWaitlist] = await Promise.all([
        db.order.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
        db.supportTicket.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } }),
        db.dropWaitlist.findFirst({ orderBy: { createdAt: 'desc' }, select: { createdAt: true } })
      ]);

      const dates = [
        lastOrder?.createdAt ? new Date(lastOrder.createdAt).getTime() : 0,
        lastTicket?.createdAt ? new Date(lastTicket.createdAt).getTime() : 0,
        lastWaitlist?.createdAt ? new Date(lastWaitlist.createdAt).getTime() : 0,
        this.lastDetectedChangeAt
      ];

      this.lastDetectedChangeAt = Math.max(...dates);
    } catch (err) {
      console.warn('⚠️ [CacheEngine] Failed to retrieve system changes timestamp:', err);
    }

    return this.lastDetectedChangeAt;
  }
}
