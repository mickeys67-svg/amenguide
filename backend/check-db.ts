import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    try {
        const count = await prisma.event.count();
        console.log('--- DB STATUS (PRISMA) ---');
        console.log('Total Events:', count);

        if (count > 0) {
            const events = await prisma.event.findMany({
                take: 5,
                orderBy: { createdAt: 'desc' }
            });
            console.log('Recent Events:');
            events.forEach(e => console.log(`- ${e.title} (${e.originUrl})`));
        }
    } catch (err) {
        console.error('Prisma Check Failed:', err.message);
    } finally {
        await prisma.$disconnect();
    }
}

main();
