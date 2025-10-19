// Redis Client Configuration
import { createClient } from 'redis';

const redisUrl = process.env.REDIS_URL || 'redis://:JournalScope2025!@redis:6379';

export const redis = createClient({
  url: redisUrl,
  retry_delay_on_failover: 100,
  retry_delay_on_cluster_down: 300,
  socket: {
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error('Redis connection failed after 10 retries');
      }
      return Math.min(retries * 50, 1000);
    },
  },
});

redis.on('error', (err) => {
  console.error('Redis Client Error:', err);
});

redis.on('connect', () => {
  console.log('✅ Redis connected successfully');
});

redis.on('ready', () => {
  console.log('🚀 Redis client ready');
});

redis.on('end', () => {
  console.log('❌ Redis connection ended');
});

// Initialize Redis connection
export async function initRedis() {
  try {
    if (!redis.isOpen) {
      await redis.connect();
    }
    return redis;
  } catch (error) {
    console.error('Failed to connect to Redis:', error);
    // Continue without Redis if connection fails
    return null;
  }
}

// Cache utilities
export class CacheService {
  private static instance: CacheService;
  private redisClient: any = null;

  private constructor() {}

  static getInstance(): CacheService {
    if (!CacheService.instance) {
      CacheService.instance = new CacheService();
    }
    return CacheService.instance;
  }

  async init() {
    this.redisClient = await initRedis();
  }

  async get(key: string): Promise<any> {
    if (!this.redisClient) return null;
    
    try {
      const value = await this.redisClient.get(key);
      return value ? JSON.parse(value) : null;
    } catch (error) {
      console.error('Redis GET error:', error);
      return null;
    }
  }

  async set(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    if (!this.redisClient) return false;
    
    try {
      await this.redisClient.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error('Redis SET error:', error);
      return false;
    }
  }

  async del(key: string): Promise<boolean> {
    if (!this.redisClient) return false;
    
    try {
      await this.redisClient.del(key);
      return true;
    } catch (error) {
      console.error('Redis DEL error:', error);
      return false;
    }
  }

  async exists(key: string): Promise<boolean> {
    if (!this.redisClient) return false;
    
    try {
      const result = await this.redisClient.exists(key);
      return result === 1;
    } catch (error) {
      console.error('Redis EXISTS error:', error);
      return false;
    }
  }

  async flush(): Promise<boolean> {
    if (!this.redisClient) return false;
    
    try {
      await this.redisClient.flushAll();
      return true;
    } catch (error) {
      console.error('Redis FLUSH error:', error);
      return false;
    }
  }

  // Cache patterns for common operations
  async cacheSubmissions(userId: string, submissions: any[], ttl: number = 1800) {
    const key = `user:${userId}:submissions`;
    return await this.set(key, submissions, ttl);
  }

  async getCachedSubmissions(userId: string) {
    const key = `user:${userId}:submissions`;
    return await this.get(key);
  }

  async cacheJournalSearch(query: string, results: any[], ttl: number = 3600) {
    const key = `journal:search:${Buffer.from(query).toString('base64')}`;
    return await this.set(key, results, ttl);
  }

  async getCachedJournalSearch(query: string) {
    const key = `journal:search:${Buffer.from(query).toString('base64')}`;
    return await this.get(key);
  }

  async invalidateUserCache(userId: string) {
    const patterns = [
      `user:${userId}:*`,
    ];
    
    for (const pattern of patterns) {
      try {
        const keys = await this.redisClient?.keys(pattern);
        if (keys && keys.length > 0) {
          await this.redisClient?.del(keys);
        }
      } catch (error) {
        console.error('Error invalidating cache:', error);
      }
    }
  }
}

export const cacheService = CacheService.getInstance();
