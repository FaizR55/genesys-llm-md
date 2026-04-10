import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private readonly enabled: boolean;

  constructor(private readonly config: ConfigService) {
    const raw = this.config.get<string>('REDIS_ENABLED', 'true');
    this.enabled = String(raw).toLowerCase() !== 'false';
  }

  onModuleInit(): void {
    if (!this.enabled) {
      this.logger.log('Redis is disabled');
      return;
    }

    this.client = new Redis({
      host: this.config.get<string>('REDIS_HOST', 'localhost'),
      port: this.config.get<number>('REDIS_PORT', 6379),
      lazyConnect: true,
    });

    this.client.on('error', (err) => {
      this.logger.warn(`Redis connection error: ${err instanceof Error ? err.message : String(err)}`);
    });

    this.client.connect().catch((err) => {
      this.logger.warn(`Redis initial connect failed: ${err instanceof Error ? err.message : String(err)}`);
    });
  }

  async get<T>(key: string): Promise<T | null> {
    if (!this.enabled || !this.client) {
      return null;
    }

    try {
      const value = await this.client.get(key);
      return value ? (JSON.parse(value) as T) : null;
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis GET error for key "${key}": ${msg}`);
      return null;
    }
  }

  async set(key: string, value: unknown, ttlSeconds = 300): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      await this.client.set(key, JSON.stringify(value), 'EX', ttlSeconds);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis SET error for key "${key}": ${msg}`);
    }
  }

  async del(key: string): Promise<void> {
    if (!this.enabled || !this.client) {
      return;
    }

    try {
      await this.client.del(key);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`Redis DEL error for key "${key}": ${msg}`);
    }
  }

  onModuleDestroy(): void {
    if (this.client) {
      this.client.disconnect();
    }
  }
}
