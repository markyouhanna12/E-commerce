import { Global, Module } from '@nestjs/common';
import { RedisService } from './cache.service';
import { HttpCacheInterceptor } from './interceptors/cache.interceptor';

@Global()
@Module({
  providers: [RedisService, HttpCacheInterceptor],
  exports: [RedisService, HttpCacheInterceptor],
})
export class CacheModule {}
