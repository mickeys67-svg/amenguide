import {
  Injectable,
  BadRequestException,
  UnauthorizedException,
  ConflictException,
  OnModuleInit,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AdminAuthService implements OnModuleInit {
  constructor(private prisma: PrismaService) {}

  async onModuleInit() {
    // initDatabase()가 Admin 테이블을 생성할 때까지 기다린 후 시드
    // (PrismaService.onModuleInit()은 initDatabase를 fire-and-forget으로 호출하므로
    //  AdminAuthService가 먼저 실행될 수 있는 경쟁 조건을 방지)
    try {
      await this.prisma.initDatabase();
      await this.seedInitialAdmin();
    } catch (err: any) {
      console.error('AdminAuthService: onModuleInit failed:', err.message);
    }
  }

  private async seedInitialAdmin() {
    // UPSERT: 계정이 없으면 생성, 있으면 ADMIN_API_KEY 변경 시 비밀번호 갱신
    const password = (process.env.ADMIN_API_KEY || 'amenguide_admin_2026').trim();
    const passwordHash = await this.hashPassword(password);
    const id = crypto.randomUUID();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "Admin" ("id","email","name","passwordHash","createdAt","updatedAt")
       VALUES ($1,'admin@amenguide.kr','관리자',$2,NOW(),NOW())
       ON CONFLICT ("email") DO UPDATE SET "passwordHash" = $2, "updatedAt" = NOW()`,
      id,
      passwordHash,
    );
    console.log('AdminAuthService: admin@amenguide.kr seeded/updated');
  }

  // ── 비밀번호 해싱 ─────────────────────────────────────────────────────────
  private hashPassword(password: string): Promise<string> {
    const salt = crypto.randomBytes(16).toString('hex');
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derived) => {
        if (err) reject(err);
        else resolve(`${salt}:${derived.toString('hex')}`);
      });
    });
  }

  private verifyPassword(password: string, stored: string): Promise<boolean> {
    const [salt, hash] = stored.split(':');
    if (!salt || !hash) return Promise.resolve(false);
    return new Promise((resolve, reject) => {
      crypto.scrypt(password, salt, 64, (err, derived) => {
        if (err) reject(err);
        else {
          try {
            resolve(crypto.timingSafeEqual(derived, Buffer.from(hash, 'hex')));
          } catch {
            resolve(false);
          }
        }
      });
    });
  }

  // ── Admin 토큰 (payload에 role:'admin' 포함) ──────────────────────────────
  private get secret() {
    return process.env.JWT_SECRET || 'catholica-hmac-secret-change-in-production';
  }

  createAdminToken(adminId: string): string {
    const payload = Buffer.from(
      JSON.stringify({ sub: adminId, role: 'admin', iat: Math.floor(Date.now() / 1000) }),
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
      return parsed.sub as string;
    } catch {
      return null;
    }
  }

  // ── 로그인 ────────────────────────────────────────────────────────────────
  async login(email: string, password: string) {
    if (!email?.trim() || !password) {
      throw new BadRequestException('이메일과 비밀번호를 입력해주세요.');
    }
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "id","email","name","passwordHash" FROM "Admin" WHERE "email"=$1 LIMIT 1`,
      email.toLowerCase().trim(),
    );
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
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "id","email","name","createdAt" FROM "Admin" WHERE "id"=$1 LIMIT 1`,
      adminId,
    );
    if (rows.length === 0) throw new UnauthorizedException('존재하지 않는 관리자입니다.');
    return rows[0];
  }

  // ── 관리자 목록 ───────────────────────────────────────────────────────────
  async listAdmins() {
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "id","email","name","createdAt" FROM "Admin" ORDER BY "createdAt" ASC`,
    );
    return rows;
  }

  // ── 관리자 추가 ───────────────────────────────────────────────────────────
  async createAdmin(name: string, email: string, password: string) {
    if (!name?.trim()) throw new BadRequestException('이름을 입력해주세요.');
    if (!email?.trim()) throw new BadRequestException('이메일을 입력해주세요.');
    if (!password || password.length < 6) {
      throw new BadRequestException('비밀번호는 6자 이상이어야 합니다.');
    }
    const normalizedEmail = email.toLowerCase().trim();
    const exists: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "id" FROM "Admin" WHERE "email"=$1 LIMIT 1`,
      normalizedEmail,
    );
    if (exists.length > 0) throw new ConflictException('이미 사용 중인 이메일입니다.');

    const passwordHash = await this.hashPassword(password);
    const id = crypto.randomUUID();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "Admin" ("id","email","name","passwordHash","createdAt","updatedAt")
       VALUES ($1,$2,$3,$4,NOW(),NOW())`,
      id,
      normalizedEmail,
      name.trim(),
      passwordHash,
    );
    return { id, email: normalizedEmail, name: name.trim() };
  }

  // ── 관리자 삭제 ───────────────────────────────────────────────────────────
  async deleteAdmin(id: string, requestorId: string) {
    if (id === requestorId) {
      throw new BadRequestException('자신의 계정은 삭제할 수 없습니다.');
    }
    const target: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "id" FROM "Admin" WHERE "id"=$1 LIMIT 1`,
      id,
    );
    if (target.length === 0) throw new BadRequestException('존재하지 않는 관리자입니다.');

    const count: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT COUNT(*) as count FROM "Admin"`,
    );
    if (parseInt(count[0].count) <= 1) {
      throw new BadRequestException('마지막 관리자는 삭제할 수 없습니다.');
    }
    await this.prisma.$executeRawUnsafe(`DELETE FROM "Admin" WHERE "id"=$1`, id);
    return { deleted: true };
  }

  // ── 비밀번호 변경 ─────────────────────────────────────────────────────────
  async changePassword(adminId: string, oldPassword: string, newPassword: string) {
    if (!newPassword || newPassword.length < 6) {
      throw new BadRequestException('새 비밀번호는 6자 이상이어야 합니다.');
    }
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "passwordHash" FROM "Admin" WHERE "id"=$1 LIMIT 1`,
      adminId,
    );
    if (rows.length === 0) throw new UnauthorizedException('관리자를 찾을 수 없습니다.');

    const valid = await this.verifyPassword(oldPassword, rows[0].passwordHash);
    if (!valid) throw new UnauthorizedException('현재 비밀번호가 올바르지 않습니다.');

    const newHash = await this.hashPassword(newPassword);
    await this.prisma.$executeRawUnsafe(
      `UPDATE "Admin" SET "passwordHash"=$1, "updatedAt"=NOW() WHERE "id"=$2`,
      newHash,
      adminId,
    );
    return { success: true };
  }
}
