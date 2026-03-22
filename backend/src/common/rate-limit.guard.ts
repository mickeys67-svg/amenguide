import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

const MAX_STORE_SIZE = 10_000; // IP 최대 10,000개

/** 만료된 엔트리 정리 + 크기 제한 */
function evictExpired(store: Map<string, { count: number; resetAt: number }>) {
  const now = Date.now();
  for (const [key, val] of store) {
    if (now > val.resetAt) store.delete(key);
  }
  // 그래도 크면 가장 오래된 것부터 삭제
  if (store.size > MAX_STORE_SIZE) {
    const excess = store.size - MAX_STORE_SIZE;
    let i = 0;
    for (const key of store.keys()) {
      if (i++ >= excess) break;
      store.delete(key);
    }
  }
}

/**
 * 인증 엔드포인트 Rate Limiter — IP당 1분에 10회
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private store = new Map<string, { count: number; resetAt: number }>();
  private windowMs = 60_000;
  private max = 10;

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();

    // 주기적 정리 (1000회마다)
    if (this.store.size > MAX_STORE_SIZE / 2) evictExpired(this.store);

    const entry = this.store.get(ip);
    if (!entry || now > entry.resetAt) {
      this.store.set(ip, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    entry.count++;
    if (entry.count > this.max) {
      throw new HttpException('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}

/** 느슨한 Rate Limiter (일반 API용) — 1분에 60회 */
@Injectable()
export class SoftRateLimitGuard implements CanActivate {
  private store = new Map<string, { count: number; resetAt: number }>();
  private windowMs = 60_000;
  private max = 60;

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();

    if (this.store.size > MAX_STORE_SIZE / 2) evictExpired(this.store);

    const entry = this.store.get(ip);
    if (!entry || now > entry.resetAt) {
      this.store.set(ip, { count: 1, resetAt: now + this.windowMs });
      return true;
    }

    entry.count++;
    if (entry.count > this.max) {
      throw new HttpException('요청이 너무 많습니다. 잠시 후 다시 시도해주세요.', HttpStatus.TOO_MANY_REQUESTS);
    }
    return true;
  }
}
