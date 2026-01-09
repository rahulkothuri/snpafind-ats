import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
const globalForPrisma = globalThis;
let prismaInstance = null;
/**
 * Create Prisma client with lazy initialization
 * This prevents the app from crashing at startup if DATABASE_URL
 * is not immediately available (e.g., fetched from Secrets Manager)
 */
function createPrismaClient() {
    const connectionString = process.env.DATABASE_URL;
    if (!connectionString) {
        throw new Error('DATABASE_URL environment variable is not set');
    }
    const pool = new pg.Pool({ connectionString });
    const adapter = new PrismaPg(pool);
    return new PrismaClient({ adapter });
}
/**
 * Get Prisma client instance (lazy initialization)
 */
export function getPrisma() {
    if (!prismaInstance) {
        prismaInstance = globalForPrisma.prisma ?? createPrismaClient();
        if (process.env.NODE_ENV !== 'production') {
            globalForPrisma.prisma = prismaInstance;
        }
    }
    return prismaInstance;
}
// For backward compatibility - uses lazy getter
export const prisma = new Proxy({}, {
    get(_target, prop) {
        return Reflect.get(getPrisma(), prop);
    },
});
export default prisma;
//# sourceMappingURL=prisma.js.map