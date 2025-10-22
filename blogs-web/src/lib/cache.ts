// 简单的内存缓存实现
interface CacheItem<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class MemoryCache {
  private cache = new Map<string, CacheItem<any>>();
  private maxSize = 100; // 最大缓存条目数

  set<T>(key: string, data: T, ttl: number = 300000): void { // 默认5分钟
    // 如果缓存已满，删除最旧的条目
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        this.cache.delete(firstKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });
  }

  get<T>(key: string): T | null {
    const item = this.cache.get(key);
    
    if (!item) {
      return null;
    }

    // 检查是否过期
    if (Date.now() - item.timestamp > item.ttl) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // 清理过期缓存
  cleanup(): void {
    const now = Date.now();
    for (const [key, item] of this.cache.entries()) {
      if (now - item.timestamp > item.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // 获取缓存统计信息
  getStats() {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      keys: Array.from(this.cache.keys())
    };
  }
}

// 创建全局缓存实例
export const memoryCache = new MemoryCache();

// 缓存装饰器函数
export function withCache<T extends any[], R>(
  fn: (...args: T) => Promise<R>,
  keyGenerator: (...args: T) => string,
  ttl: number = 300000
) {
  return async (...args: T): Promise<R> => {
    const cacheKey = keyGenerator(...args);
    
    // 尝试从缓存获取
    const cached = memoryCache.get<R>(cacheKey);
    if (cached !== null) {
      return cached;
    }

    // 执行原函数
    const result = await fn(...args);
    
    // 存入缓存
    memoryCache.set(cacheKey, result, ttl);
    
    return result;
  };
}

// 生成缓存键的工具函数
export function generateCacheKey(prefix: string, params: Record<string, any>): string {
  const sortedParams = Object.keys(params)
    .sort()
    .map(key => `${key}:${params[key]}`)
    .join('|');
  
  return `${prefix}:${sortedParams}`;
}

// 定期清理过期缓存
if (typeof window === 'undefined') { // 只在服务端运行
  setInterval(() => {
    memoryCache.cleanup();
  }, 60000); // 每分钟清理一次
}