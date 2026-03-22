import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ForbiddenException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { hashPassword, verifyPassword } from '../common/password.util';

@Injectable()
export class AdminAuthService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // PrismaService.onModuleInit() already calls initDatabase().
    // Seed admin after schema is ready.
    try {
      await this.seedInitialAdmin();
    } catch (err: any) {
      console.error('AdminAuthService: onModuleInit failed:', err.message);
    }
  }

  private async seedInitialAdmin() {
    const adminEmail = process.env.ADMIN_EMAIL;
    const adminPassword = process.env.ADMIN_API_KEY;

    // 환경변수 미설정 시 시드 건너뜀 (하드코딩 기본값 제거)
    if (!adminEmail || !adminPassword) {
      console.log('AdminAuthService: ADMIN_EMAIL 또는 ADMIN_API_KEY 미설정 — 시드 건너뜀');
      return;
    }

    // 기존 계정이 있으면 건너뜀 (비밀번호 변경 보존)
    const seedEmail = adminEmail.toLowerCase().trim();
    const existing = await this.prisma.$queryRaw`SELECT "id" FROM "Admin" WHERE "email" = ${seedEmail} LIMIT 1` as any[];
    if (existing.length > 0) {
      console.log('AdminAuthService: admin already exists — skipping seed');
      return;
    }

    const passwordHash = await this.hashPassword(adminPassword.trim());
    const id = crypto.randomUUID();
    await this.prisma.$executeRaw`INSERT INTO "Admin" ("id","email","name","passwordHash","createdAt","updatedAt")
       VALUES (${id},${seedEmail},'관리자',${passwordHash},NOW(),NOW())`;
    console.log('AdminAuthService: initial admin seeded');
  }

  // ── 비밀번호 해싱 (shared utility) ────────────────────────────────────────
  private hashPassword(password: string): Promise<string> {
    return hashPassword(password);
  }

  private verifyPassword(password: string, stored: string): Promise<boolean> {
    return verifyPassword(password, stored);
  }

  // ── Admin 토큰 (payload에 role:'admin' 포함) ──────────────────────────────
  private _fallbackSecret?: string;
  private get secret() {
    if (process.env.JWT_SECRET) return process.env.JWT_SECRET;
    if (process.env.NODE_ENV === 'production') {
      throw new Error('FATAL: JWT_SECRET environment variable is not set in production!');
    }
    if (!this._fallbackSecret) {
      this._fallbackSecret = crypto.randomBytes(32).toString('hex');
      console.error('[SECURITY] JWT_SECRET 환경변수가 설정되지 않았습니다! 개발용 임시 랜덤 시크릿을 사용합니다.');
    }
    return this._fallbackSecret;
  }

  private static ADMIN_TOKEN_EXPIRY_SECONDS = 24 * 60 * 60; // 24시간

  createAdminToken(adminId: string): string {
    const now = Math.floor(Date.now() / 1000);
    const payload = Buffer.from(
      JSON.stringify({ sub: adminId, role: 'admin', iat: now, exp: now + AdminAuthService.ADMIN_TOKEN_EXPIRY_SECONDS }),
    ).toString('base64url');
    const sig = crypto.createHmac('sha256', this.secret).update(payload).digest('base64url');
    return `${payload}.${sig}`;
  }

  verifyAdminToken(token: string): string | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    try {
      const expectedSig = crypto
        .createHmac('sha256', this.secret)
        .update(payload)
        .digest('base64url');
      const sigBuf = Buffer.from(sig, 'base64url');
      const expBuf = Buffer.from(expectedSig, 'base64url');
      if (sigBuf.length !== expBuf.length) return null;
      if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
      const parsed = JSON.parse(Buffer.from(payload, 'base64url').toString());
      if (parsed.role !== 'admin') return null;
      if (parsed.exp && parsed.exp < Math.floor(Date.now() / 1000)) return null;
      return parsed.sub as string;
    } catch {
      return null;
    }
  }

  /**
   * x-admin-key(레거시) 또는 Bearer 관리자 토큰 중 하나 허용.
   * 컨트롤러에서 공통으로 사용하는 단일 인증 진입점.
   */
  requireAdmin(key: string | undefined, auth: string | undefined): void {
    const apiKey = process.env.ADMIN_API_KEY?.trim();
    if (apiKey && key === apiKey) return;
    if (auth?.startsWith('Bearer ')) {
      const adminId = this.verifyAdminToken(auth.slice(7));
      if (adminId) return;
    }
    throw new ForbiddenException('관리자 권한이 필요합니다.');
  }

  // ── 로그인 ────────────────────────────────────────────────────────────────
  async login(email: string, password: string) {
    if (!email?.trim() || !password) {
      throw new BadRequestException('이메일과 비밀번호를 입력해주세요.');
    }
    const loginEmail = email.toLowerCase().trim();
    const rows = await this.prisma.$queryRaw`SELECT "id","email","name","passwordHash" FROM "Admin" WHERE "email"=${loginEmail} LIMIT 1` as any[];
    if (rows.length === 0) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    const valid = await this.verifyPassword(password, rows[0].passwordHash);
    if (!valid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }
    return {
      token: this.createAdminToken(rows[0].id),
      admin: { id: rows[0].id, email: rows[0].email, name: rows[0].name },
    };
  }

  // ── 내 정보 ───────────────────────────────────────────────────────────────
  async getMe(token: string) {
    const adminId = this.verifyAdminToken(token);
    if (!adminId) throw new UnauthorizedException('유효하지 않은 관리자 토큰입니다.');
    const rows = await this.prisma.$queryRaw`SELECT "id","email","name","createdAt" FROM "Admin" WHERE "id"=${adminId} LIMIT 1` as any[];
    if (rows.length === 0) throw new UnauthorizedException('존재하지 않는 관리자입니다.');
    return rows[0];
  }

  // ── 관리자 목록 ───────────────────────────────────────────────────────────
  async listAdmins() {
    const rows = await this.prisma.$queryRaw`SELECT "id","email","name","createdAt" FROM "Admin" ORDER BY "createdAt" ASC` as any[];
    return rows;
  }

  // ── 관리자 추가 ───────────────────────────────────────────────────────────
  async createAdmin(name: string, email: string, password: string) {
    if (!name?.trim()) throw new BadRequestException('이름을 입력해주세요.');
    if (!email?.trim()) throw new BadRequestException('이메일을 입력해주세요.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) throw new BadRequestException('올바른 이메일 형식이 아닙니다.');
    if (!password || password.length < 8) {
      throw new BadRequestException('비밀번호는 8자 이상이어야 합니다.');
    }
    if (!/\d/.test(password)) {
      throw new BadRequestException('비밀번호에 숫자가 1개 이상 포함되어야 합니다.');
    }
    if (!/[a-zA-Z]/.test(password)) {
      throw new BadRequestException('비밀번호에 영문자가 1개 이상 포함되어야 합니다.');
    }
    const normalizedEmail = email.toLowerCase().trim();
    const exists = await this.prisma.$queryRaw`SELECT "id" FROM "Admin" WHERE "email"=${normalizedEmail} LIMIT 1` as any[];
    if (exists.length > 0) throw new ConflictException('이미 사용 중인 이메일입니다.');

    const passwordHash = await this.hashPassword(password);
    const id = crypto.randomUUID();
    await this.prisma.$executeRaw`INSERT INTO "Admin" ("id","email","name","passwordHash","createdAt","updatedAt")
       VALUES (${id},${normalizedEmail},${name.trim()},${passwordHash},NOW(),NOW())`;
    return { id, email: normalizedEmail, name: name.trim() };
  }

  // ── 관리자 삭제 ───────────────────────────────────────────────────────────
  async deleteAdmin(id: string, requestorId: string) {
    if (id === requestorId) {
      throw new BadRequestException('자신의 계정은 삭제할 수 없습니다.');
    }
    const target = await this.prisma.$queryRaw`SELECT "id" FROM "Admin" WHERE "id"=${id} LIMIT 1` as any[];
    if (target.length === 0) throw new BadRequestException('존재하지 않는 관리자입니다.');

    const count = await this.prisma.$queryRaw`SELECT COUNT(*) as count FROM "Admin"` as any[];
    if (parseInt(count[0].count) <= 1) {
      throw new BadRequestException('마지막 관리자는 삭제할 수 없습니다.');
    }
    await this.prisma.$executeRaw`DELETE FROM "Admin" WHERE "id"=${id}`;
    return { deleted: true };
  }

  // ── 비밀번호 변경 ─────────────────────────────────────────────────────────
  async changePassword(adminId: string, oldPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 8) {
      throw new BadRequestException('새 비밀번호는 8자 이상이어야 합니다.');
    }
    if (!/\d/.test(newPassword)) {
      throw new BadRequestException('비밀번호에 숫자가 1개 이상 포함되어야 합니다.');
    }
    if (!/[a-zA-Z]/.test(newPassword)) {
      throw new BadRequestException('비밀번호에 영문자가 1개 이상 포함되어야 합니다.');
    }
    const rows = await this.prisma.$queryRaw`SELECT "passwordHash" FROM "Admin" WHERE "id"=${adminId} LIMIT 1` as any[];
    if (rows.length === 0) throw new UnauthorizedException('관리자를 찾을 수 없습니다.');

    const valid = await this.verifyPassword(oldPassword, rows[0].passwordHash);
    if (!valid) throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');

    const newHash = await this.hashPassword(newPassword);
    await this.prisma.$executeRaw`UPDATE "Admin" SET "passwordHash"=${newHash}, "updatedAt"=NOW() WHERE "id"=${adminId}`;
    return { success: true };
  }
}
