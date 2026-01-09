import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
/**
 * Get Prisma client instance (lazy initialization)
 */
export declare function getPrisma(): PrismaClient;
export declare const prisma: PrismaClient<import("@prisma/client").Prisma.PrismaClientOptions, never, import("@prisma/client/runtime/client").DefaultArgs>;
export default prisma;
//# sourceMappingURL=prisma.d.ts.map