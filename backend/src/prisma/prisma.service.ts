import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy {
  constructor() {
    const pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false,
    });
    const adapter = new PrismaPg(pool);
    super({ adapter });
  }

  async onModuleInit() {
    // PrismaPg adapter uses a pg.Pool — connection is established lazily on first query.
    // Do NOT await $connect() here: it blocks NestJS bootstrap → Cloud Run port never opens
    // within the 60s deadline → deploy fails with "container failed to start".
    this.$connect().catch((err) => {
      console.error('PrismaService: initial DB connect failed (will retry on first query):', err.message);
    });
    // Ensure all schema columns exist on every deploy (idempotent ALTER TABLE IF NOT EXISTS).
    // This fixes missing columns (e.g. status, imageUrl) without requiring nuclearReset.
    // Awaited so that dependent services (e.g. AdminAuthService) can rely on tables existing.
    try {
      await this.initDatabase();
    } catch (err) {
      console.error('PrismaService: initDatabase on startup failed:', err.message);
    }
    console.log('PrismaService initialized (lazy pool via PrismaPg).');
  }

  /**
   * DEFINITIVE: Unified system database initialization.
   * Ensures tables match Prisma schema casing and constraints.
   */
  async initDatabase() {
    console.log('--- DEFINITIVE DATABASE INITIALIZATION START ---');
    const sql = `
      CREATE TABLE IF NOT EXISTS "User" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT UNIQUE NOT NULL,
        "name" TEXT,
        "provider" TEXT NOT NULL,
        "targetDiocese" TEXT,
        "themeColor" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Event" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "date" TIMESTAMP,
        "location" TEXT,
        "latitude" DOUBLE PRECISION,
        "longitude" DOUBLE PRECISION,
        "originUrl" TEXT,
        "aiSummary" TEXT,
        "themeColor" TEXT,
        "category" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "Bookmark" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "eventId")
      );

      CREATE TABLE IF NOT EXISTS "Admin" (
        "id" TEXT PRIMARY KEY,
        "email" TEXT UNIQUE NOT NULL,
        "name" TEXT NOT NULL,
        "passwordHash" TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `;
    await this.$executeRawUnsafe(sql);

    // Phase 2 & 3 new tables (Reviews, Push, NotificationLog)
    const newTablesSql = `
      CREATE TABLE IF NOT EXISTS "Review" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "eventId" TEXT NOT NULL REFERENCES "Event"("id") ON DELETE CASCADE,
        "rating" INTEGER NOT NULL,
        "content" TEXT,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "eventId")
      );

      CREATE TABLE IF NOT EXISTS "PushSubscription" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL REFERENCES "User"("id") ON DELETE CASCADE,
        "endpoint" TEXT UNIQUE NOT NULL,
        "p256dh" TEXT NOT NULL,
        "auth" TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "NotificationLog" (
        "id" TEXT PRIMARY KEY,
        "userId" TEXT NOT NULL,
        "eventId" TEXT NOT NULL,
        "type" TEXT NOT NULL,
        "sentAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("userId", "eventId", "type")
      );
    `;
    await this.$executeRawUnsafe(newTablesSql);

    // Notice tables (게시판)
    const noticeSql = `
      CREATE TABLE IF NOT EXISTS "Notice" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "category" TEXT DEFAULT '일반',
        "isPinned" BOOLEAN DEFAULT false,
        "status" TEXT DEFAULT 'PENDING',
        "viewCount" INTEGER DEFAULT 0,
        "authorId" TEXT NOT NULL REFERENCES "User"("id"),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "NoticeComment" (
        "id" TEXT PRIMARY KEY,
        "content" TEXT NOT NULL,
        "authorId" TEXT NOT NULL REFERENCES "User"("id"),
        "noticeId" TEXT NOT NULL REFERENCES "Notice"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "NoticeAttachment" (
        "id" TEXT PRIMARY KEY,
        "fileName" TEXT NOT NULL,
        "fileUrl" TEXT NOT NULL,
        "fileSize" INTEGER NOT NULL,
        "noticeId" TEXT NOT NULL REFERENCES "Notice"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS "Notice_status_createdAt_idx" ON "Notice"("status", "createdAt");
      CREATE INDEX IF NOT EXISTS "Notice_authorId_idx" ON "Notice"("authorId");
      CREATE INDEX IF NOT EXISTS "NoticeComment_noticeId_idx" ON "NoticeComment"("noticeId");
    `;
    await this.$executeRawUnsafe(noticeSql);

    // AI 사용 로그 (하루 3명 제한)
    const aiUsageSql = `
      CREATE TABLE IF NOT EXISTS "AiUsageLog" (
        "id" TEXT PRIMARY KEY,
        "ipHash" TEXT NOT NULL,
        "usedDate" TEXT NOT NULL,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE("ipHash", "usedDate")
      );
      CREATE INDEX IF NOT EXISTS "AiUsageLog_usedDate_idx" ON "AiUsageLog"("usedDate");
    `;
    await this.$executeRawUnsafe(aiUsageSql);

    // Community tables (Cenaculum — 친교의 다락방)
    const communitySql = `
      CREATE TABLE IF NOT EXISTS "CommunityPost" (
        "id" TEXT PRIMARY KEY,
        "title" TEXT NOT NULL,
        "content" TEXT NOT NULL,
        "category" TEXT DEFAULT '자유게시판',
        "status" TEXT DEFAULT 'APPROVED',
        "isPinned" BOOLEAN DEFAULT false,
        "isClosed" BOOLEAN DEFAULT false,
        "isAnonymous" BOOLEAN DEFAULT false,
        "viewCount" INTEGER DEFAULT 0,
        "diocese" TEXT,
        "authorId" TEXT NOT NULL REFERENCES "User"("id"),
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "CommunityComment" (
        "id" TEXT PRIMARY KEY,
        "content" TEXT NOT NULL,
        "parentId" TEXT REFERENCES "CommunityComment"("id") ON DELETE CASCADE,
        "authorId" TEXT NOT NULL REFERENCES "User"("id"),
        "postId" TEXT NOT NULL REFERENCES "CommunityPost"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS "CommunityReaction" (
        "id" TEXT PRIMARY KEY,
        "type" TEXT NOT NULL,
        "userId" TEXT NOT NULL REFERENCES "User"("id"),
        "postId" TEXT REFERENCES "CommunityPost"("id") ON DELETE CASCADE,
        "commentId" TEXT REFERENCES "CommunityComment"("id") ON DELETE CASCADE,
        "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS "CommunityPost_status_cat_idx" ON "CommunityPost"("status", "category", "createdAt");
      CREATE INDEX IF NOT EXISTS "CommunityPost_authorId_idx" ON "CommunityPost"("authorId");
      CREATE INDEX IF NOT EXISTS "CommunityPost_diocese_idx" ON "CommunityPost"("diocese");
      CREATE INDEX IF NOT EXISTS "CommunityComment_postId_idx" ON "CommunityComment"("postId", "createdAt");
      CREATE INDEX IF NOT EXISTS "CommunityComment_parentId_idx" ON "CommunityComment"("parentId");
      CREATE INDEX IF NOT EXISTS "CommunityReaction_postId_idx" ON "CommunityReaction"("postId");
      CREATE INDEX IF NOT EXISTS "CommunityReaction_commentId_idx" ON "CommunityReaction"("commentId");
    `;
    await this.$executeRawUnsafe(communitySql);

    // Unique constraints for CommunityReaction (idempotent)
    const reactionConstraintsSql = `
      DO $$ BEGIN
        ALTER TABLE "CommunityReaction" ADD CONSTRAINT "CommunityReaction_userId_postId_type_key" UNIQUE ("userId", "postId", "type");
      EXCEPTION WHEN duplicate_table THEN NULL;
      END $$;
      DO $$ BEGIN
        ALTER TABLE "CommunityReaction" ADD CONSTRAINT "CommunityReaction_userId_commentId_type_key" UNIQUE ("userId", "commentId", "type");
      EXCEPTION WHEN duplicate_table THEN NULL;
      END $$;
    `;
    await this.$executeRawUnsafe(reactionConstraintsSql);

    // Add new columns for existing tables (idempotent ALTER TABLE)
    const alterSql = `
      ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "status" TEXT DEFAULT 'PENDING';
      ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "imageUrl" TEXT;
      ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "submitterName" TEXT;
      ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "submitterContact" TEXT;
      ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "rejectionReason" TEXT;
      ALTER TABLE "Event" ADD COLUMN IF NOT EXISTS "diocese" TEXT;
      ALTER TABLE "User"  ADD COLUMN IF NOT EXISTS "passwordHash" TEXT;
    `;
    await this.$executeRawUnsafe(alterSql);

    // Event 테이블 인덱스 (검색/필터링 성능)
    const eventIndexSql = `
      CREATE INDEX IF NOT EXISTS "Event_status_date_idx" ON "Event"("status", "date");
      CREATE INDEX IF NOT EXISTS "Event_status_category_idx" ON "Event"("status", "category");
      CREATE INDEX IF NOT EXISTS "Event_diocese_idx" ON "Event"("diocese");
      CREATE INDEX IF NOT EXISTS "Event_originUrl_idx" ON "Event"("originUrl");
      CREATE INDEX IF NOT EXISTS "Event_createdAt_idx" ON "Event"("createdAt");
      CREATE INDEX IF NOT EXISTS "Bookmark_userId_idx" ON "Bookmark"("userId");
    `;
    await this.$executeRawUnsafe(eventIndexSql);
    console.log('--- DEFINITIVE DATABASE INITIALIZATION COMPLETE ---');
  }

  async onModuleDestroy() {
    await this.$disconnect();
  }
}
