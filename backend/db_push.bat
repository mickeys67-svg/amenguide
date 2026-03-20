@echo off
cd /d E:\amenguide\backend
npx prisma db push --config src\prisma.config.ts --accept-data-loss
