import { Injectable, CanActivate, ExecutionContext, HttpException, HttpStatus } from '@nestjs/common';

/**
 * 간단한 인메모리 Rate Limiter
 * IP별로 windowMs 내 max 요청까지 허용
 */
@Injectable()
export class RateLimitGuard implements CanActivate {
  private store = new Map<string, { count: number; resetAt: number }>();
  private windowMs = 60_000; // 1분
  private max = 10; // 1분에 10회

  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest();
    const ip = req.ip || req.headers['x-forwarded-for'] || 'unknown';
    const now = Date.now();

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
