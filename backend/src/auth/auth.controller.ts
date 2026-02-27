import {
  Controller, Post, Get, Patch, Delete, Body, Headers, Query, Param,
  BadRequestException, Res,
} from '@nestjs/common';
import type { Response } from 'express';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  /** 이메일 회원가입 */
  @Post('register')
  async register(
    @Body() body: { name: string; email: string; password: string },
  ) {
    return this.authService.register(body.name, body.email, body.password);
  }

  /** 이메일 로그인 */
  @Post('login')
  async login(@Body() body: { email: string; password: string }) {
    return this.authService.login(body.email, body.password);
  }

  /** 내 정보 (Authorization: Bearer <token>) */
  @Get('me')
  async me(@Headers('authorization') auth: string) {
    if (!auth?.startsWith('Bearer ')) {
      throw new BadRequestException('Authorization: Bearer <token> 헤더가 필요합니다.');
    }
    return this.authService.getMe(auth.slice(7));
  }

  /** 프로필 업데이트 (이름, 교구) */
  @Patch('me')
  async updateMe(
    @Headers('authorization') auth: string,
    @Body() body: { name?: string; targetDiocese?: string | null },
  ) {
    if (!auth?.startsWith('Bearer ')) throw new BadRequestException('인증 토큰이 필요합니다.');
    return this.authService.updateMe(auth.slice(7), body);
  }

  /** 즐겨찾기 목록 */
  @Get('me/bookmarks')
  async getBookmarks(@Headers('authorization') auth: string) {
    if (!auth?.startsWith('Bearer ')) throw new BadRequestException('인증 토큰이 필요합니다.');
    return this.authService.getBookmarks(auth.slice(7));
  }

  /** 즐겨찾기한 eventId 목록 (홈 하트 표시용) */
  @Get('me/bookmarked-ids')
  async getBookmarkedIds(@Headers('authorization') auth: string) {
    if (!auth?.startsWith('Bearer ')) return { ids: [] };
    return { ids: await this.authService.getBookmarkedIds(auth.slice(7)) };
  }

  /** 즐겨찾기 추가 */
  @Post('me/bookmarks/:eventId')
  async addBookmark(
    @Headers('authorization') auth: string,
    @Param('eventId') eventId: string,
  ) {
    if (!auth?.startsWith('Bearer ')) throw new BadRequestException('인증 토큰이 필요합니다.');
    return this.authService.addBookmark(auth.slice(7), eventId);
  }

  /** 즐겨찾기 삭제 */
  @Delete('me/bookmarks/:eventId')
  async removeBookmark(
    @Headers('authorization') auth: string,
    @Param('eventId') eventId: string,
  ) {
    if (!auth?.startsWith('Bearer ')) throw new BadRequestException('인증 토큰이 필요합니다.');
    return this.authService.removeBookmark(auth.slice(7), eventId);
  }

  // ── Google OAuth ────────────────────────────────────────────────────

  /**
   * GET /auth/google
   * Google OAuth 동의 화면으로 리디렉트
   */
  @Get('google')
  googleAuth(@Res() res: Response) {
    const url = this.authService.getGoogleAuthUrl();
    return res.redirect(url);
  }

  /**
   * GET /auth/callback/google?code=...
   * Google OAuth 콜백 — 토큰 교환 후 프론트엔드로 리디렉트
   */
  @Get('callback/google')
  async googleCallback(
    @Query('code') code: string,
    @Query('error') error: string,
    @Res() res: Response,
  ) {
    const frontendUrl =
      process.env.FRONTEND_URL ||
      'https://amenguide-git-775250805671.us-west1.run.app';

    // 사용자가 구글 로그인 취소한 경우
    if (error || !code) {
      return res.redirect(`${frontendUrl}/auth/callback?error=cancelled`);
    }

    try {
      const { token, user } = await this.authService.handleGoogleCallback(code);
      const params = new URLSearchParams({
        token,
        user: JSON.stringify(user),
      });
      return res.redirect(`${frontendUrl}/auth/callback?${params.toString()}`);
    } catch (e: any) {
      console.error('Google callback error:', e.message);
      return res.redirect(`${frontendUrl}/auth/callback?error=failed`);
    }
  }
}
