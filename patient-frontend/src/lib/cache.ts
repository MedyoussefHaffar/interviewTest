'use client';

const CACHE_PREFIX = 'patient-app-';
const CACHE_VERSION = 'v1-';

interface CacheItem<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

export class LocalCache {
  private getKey(key: string): string {
    return `${CACHE_PREFIX}${CACHE_VERSION}${key}`;
  }

  set<T>(key: string, data: T, ttl: number = 5 * 60 * 1000): void {
    try {
      const cacheItem: CacheItem<T> = {
        data,
        timestamp: Date.now(),
        expiresAt: Date.now() + ttl,
      };
      localStorage.setItem(this.getKey(key), JSON.stringify(cacheItem));
    } catch (error) {
      console.warn('LocalStorage cache set failed:', error);
      // Silently fail - cache is optional
    }
  }

  get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(this.getKey(key));
      if (!cached) return null;

      const cacheItem: CacheItem<T> = JSON.parse(cached);
      
      // Check if cache is expired
      if (Date.now() > cacheItem.expiresAt) {
        this.remove(key);
        return null;
      }

      return cacheItem.data;
    } catch (error) {
      console.warn('LocalStorage cache get failed:', error);
      return null;
    }
  }

  remove(key: string): void {
    try {
      localStorage.removeItem(this.getKey(key));
    } catch (error) {
      console.warn('LocalStorage cache remove failed:', error);
    }
  }

  clear(): void {
    try {
      Object.keys(localStorage)
        .filter(key => key.startsWith(CACHE_PREFIX))
        .forEach(key => localStorage.removeItem(key));
    } catch (error) {
      console.warn('LocalStorage cache clear failed:', error);
    }
  }
}

export const localCache = new LocalCache();