import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(private prisma: PrismaService) {}

  // ── 비밀번호 해싱 (crypto.scrypt) ─────────────────────────────────
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

  // ── 토큰 생성/검증 (HMAC-SHA256) ──────────────────────────────────
  private get secret() {
    return process.env.JWT_SECRET || 'catholica-hmac-secret-change-in-production';
  }

  createToken(userId: string): string {
    const payload = Buffer.from(
      JSON.stringify({ sub: userId, iat: Math.floor(Date.now() / 1000) }),
    ).toString('base64url');
    const sig = crypto.createHmac('sha256', this.secret).update(payload).digest('base64url');
    return `${payload}.${sig}`;
  }

  verifyToken(token: string): string | null {
    if (!token) return null;
    const parts = token.split('.');
    if (parts.length !== 2) return null;
    const [payload, sig] = parts;
    try {
      const expectedSig = crypto.createHmac('sha256', this.secret).update(payload).digest('base64url');
      const sigBuf = Buffer.from(sig, 'base64url');
      const expBuf = Buffer.from(expectedSig, 'base64url');
      if (sigBuf.length !== expBuf.length) return null;
      if (!crypto.timingSafeEqual(sigBuf, expBuf)) return null;
      const { sub } = JSON.parse(Buffer.from(payload, 'base64url').toString());
      return sub as string;
    } catch {
      return null;
    }
  }

  // ── 회원가입 ───────────────────────────────────────────────────────
  async register(name: string, email: string, password: string) {
    if (!name?.trim()) throw new BadRequestException('이름을 입력해주세요.');
    if (!email?.trim()) throw new BadRequestException('이메일을 입력해주세요.');
    if (!password || password.length < 6) throw new BadRequestException('비밀번호는 6자 이상이어야 합니다.');

    const normalizedEmail = email.toLowerCase().trim();
    const existing = await this.prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existing) throw new BadRequestException('이미 사용 중인 이메일입니다.');

    const passwordHash = await this.hashPassword(password);
    const id = crypto.randomUUID();

    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "User" ("id","email","name","provider","passwordHash","createdAt","updatedAt")
       VALUES ($1,$2,$3,'email',$4,NOW(),NOW())`,
      id,
      normalizedEmail,
      name.trim(),
      passwordHash,
    );

    return {
      token: this.createToken(id),
      user: { id, email: normalizedEmail, name: name.trim() },
    };
  }

  // ── 로그인 ─────────────────────────────────────────────────────────
  async login(email: string, password: string) {
    if (!email?.trim() || !password) {
      throw new BadRequestException('이메일과 비밀번호를 입력해주세요.');
    }

    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "id","email","name","passwordHash" FROM "User" WHERE "email"=$1 AND "provider"='email' LIMIT 1`,
      email.toLowerCase().trim(),
    );

    if (rows.length === 0) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    const user = rows[0];
    if (!user.passwordHash) {
      throw new UnauthorizedException('소셜 로그인 계정입니다. 소셜 로그인을 이용해주세요.');
    }

    const valid = await this.verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('이메일 또는 비밀번호가 올바르지 않습니다.');
    }

    return {
      token: this.createToken(user.id),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }

  // ── 내 정보 ────────────────────────────────────────────────────────
  async getMe(token: string) {
    const userId = this.verifyToken(token);
    if (!userId) throw new UnauthorizedException('유효하지 않은 인증 토큰입니다.');

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, email: true, name: true, targetDiocese: true },
    });
    if (!user) throw new UnauthorizedException('존재하지 않는 사용자입니다.');
    return user;
  }

  // ── 프로필 업데이트 ────────────────────────────────────────────────
  async updateMe(token: string, data: { name?: string; targetDiocese?: string | null }) {
    const userId = this.verifyToken(token);
    if (!userId) throw new UnauthorizedException('유효하지 않은 인증 토큰입니다.');

    const setParts: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (data.name !== undefined && data.name.trim()) {
      setParts.push(`"name" = $${idx++}`);
      values.push(data.name.trim());
    }
    if ('targetDiocese' in data) {
      setParts.push(`"targetDiocese" = $${idx++}`);
      values.push(data.targetDiocese || null);
    }
    if (setParts.length === 0) throw new BadRequestException('업데이트할 내용이 없습니다.');
    setParts.push(`"updatedAt" = NOW()`);
    values.push(userId);

    await this.prisma.$executeRawUnsafe(
      `UPDATE "User" SET ${setParts.join(', ')} WHERE "id" = $${idx}`,
      ...values,
    );

    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "id","email","name","targetDiocese" FROM "User" WHERE "id"=$1 LIMIT 1`,
      userId,
    );
    return rows[0];
  }

  // ── 즐겨찾기 CRUD ──────────────────────────────────────────────────
  async addBookmark(token: string, eventId: string) {
    const userId = this.verifyToken(token);
    if (!userId) throw new UnauthorizedException('유효하지 않은 인증 토큰입니다.');

    const id = crypto.randomUUID();
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "Bookmark" ("id","userId","eventId","createdAt")
       VALUES ($1,$2,$3,NOW())
       ON CONFLICT ("userId","eventId") DO NOTHING`,
      id, userId, eventId,
    );
    return { bookmarked: true };
  }

  async removeBookmark(token: string, eventId: string) {
    const userId = this.verifyToken(token);
    if (!userId) throw new UnauthorizedException('유효하지 않은 인증 토큰입니다.');

    await this.prisma.$executeRawUnsafe(
      `DELETE FROM "Bookmark" WHERE "userId"=$1 AND "eventId"=$2`,
      userId, eventId,
    );
    return { bookmarked: false };
  }

  async getBookmarks(token: string) {
    const userId = this.verifyToken(token);
    if (!userId) throw new UnauthorizedException('유효하지 않은 인증 토큰입니다.');

    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT e.*, b."createdAt" as "bookmarkedAt"
       FROM "Bookmark" b
       JOIN "Event" e ON e."id" = b."eventId"
       WHERE b."userId" = $1
         AND e."status" = 'APPROVED'
       ORDER BY b."createdAt" DESC`,
      userId,
    );
    return rows;
  }

  async getBookmarkedIds(token: string): Promise<string[]> {
    const userId = this.verifyToken(token);
    if (!userId) return [];

    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "eventId" FROM "Bookmark" WHERE "userId"=$1`,
      userId,
    );
    return rows.map((r: any) => r.eventId);
  }

  // ── Google OAuth ───────────────────────────────────────────────────

  getGoogleAuthUrl(): string {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI ||
      'https://amenguide-backend-775250805671.us-west1.run.app/auth/callback/google';

    if (!clientId) throw new BadRequestException('Google OAuth가 설정되지 않았습니다.');

    const params = new URLSearchParams({
      client_id: clientId,
      redirect_uri: redirectUri,
      response_type: 'code',
      scope: 'openid email profile',
      access_type: 'offline',
      prompt: 'select_account',
    });

    return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
  }

  async handleGoogleCallback(code: string): Promise<{ token: string; user: any }> {
    const clientId = process.env.GOOGLE_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI ||
      'https://amenguide-backend-775250805671.us-west1.run.app/auth/callback/google';

    if (!clientId || !clientSecret) {
      throw new BadRequestException('Google OAuth가 설정되지 않았습니다.');
    }

    // 1. Authorization code → Access token 교환
    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: redirectUri,
        grant_type: 'authorization_code',
      }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.text();
      console.error('Google token exchange failed:', err);
      throw new UnauthorizedException('Google 인증에 실패했습니다.');
    }

    const tokenData = await tokenRes.json();

    // 2. Access token → 사용자 정보 조회
    const userRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userRes.ok) {
      throw new UnauthorizedException('Google 사용자 정보를 가져올 수 없습니다.');
    }

    const googleUser = await userRes.json();
    const { email, name, picture } = googleUser;

    if (!email) throw new BadRequestException('Google 계정에 이메일 정보가 없습니다.');

    const normalizedEmail = email.toLowerCase().trim();
    const newId = crypto.randomUUID();
    const displayName = name || normalizedEmail.split('@')[0];

    // 3. DB에 UPSERT (이미 있으면 업데이트, 없으면 신규 생성)
    await this.prisma.$executeRawUnsafe(
      `INSERT INTO "User" ("id","email","name","provider","createdAt","updatedAt")
       VALUES ($1,$2,$3,'google',NOW(),NOW())
       ON CONFLICT ("email") DO UPDATE
         SET "name" = EXCLUDED."name",
             "provider" = 'google',
             "updatedAt" = NOW()`,
      newId,
      normalizedEmail,
      displayName,
    );

    // 4. 실제 저장된 사용자 조회 (UPSERT 후 id가 기존 것일 수 있음)
    const rows: any[] = await this.prisma.$queryRawUnsafe(
      `SELECT "id","email","name" FROM "User" WHERE "email"=$1 LIMIT 1`,
      normalizedEmail,
    );

    if (rows.length === 0) throw new UnauthorizedException('사용자 생성에 실패했습니다.');

    const user = rows[0];
    return {
      token: this.createToken(user.id),
      user: { id: user.id, email: user.email, name: user.name },
    };
  }
}
