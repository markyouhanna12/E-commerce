import { Injectable, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private client!: Redis;

  async onModuleInit() {
    this.client = new Redis(process.env.REDIS_URI as string);

    this.client.on('connect', () => {
      console.log('Redis Cache Engine connected successfully via ioredis');
    });
    this.client.on('error', (error) => {
      console.error('Redis client Error', error);
    });
  }

  async get(key: string) {
    return this.client.get(key);
  }
  async set(key: string, value: string, ttlInSecond = 300) {
    return this.client.set(key, value, 'EX', ttlInSecond);
  }

  async del(key: string) {
    return this.client.del(key);
  }

  async delByPattern(pattern: string) {
    const keys = await this.client.keys(pattern);
    if (keys.length > 0) {
      await this.client.del(...keys);
    }
  }

  async onModuleDestroy() {
    await this.client.quit();
  }
}
