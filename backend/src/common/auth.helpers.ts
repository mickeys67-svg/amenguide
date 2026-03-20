import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from '../auth/auth.service';

/**
 * Shared auth helpers for controllers.
 * Extracts and validates user identity from Bearer tokens.
 */

/** Bearer token -> userId (returns null if invalid/missing) */
export function extractUserId(authService: AuthService, auth: string | undefined): string | null {
  if (!auth?.startsWith('Bearer ')) return null;
  return authService.verifyToken(auth.slice(7));
}

/** Bearer token -> userId (throws UnauthorizedException if invalid) */
export function requireLogin(authService: AuthService, auth: string | undefined): string {
  const userId = extractUserId(authService, auth);
  if (!userId) throw new UnauthorizedException('로그인이 필요합니다.');
  return userId;
}
