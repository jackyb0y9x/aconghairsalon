import { PrismaClient } from '@prisma/client';

/**
 * Global singleton declaration to preserve PrismaClient instance across
 * Next.js Hot Module Replacement (HMR) reloads and warm serverless lambdas.
 */
declare global {
  // eslint-disable-next-line no-var
  var prismaGlobal: PrismaClient | undefined;
}

const SUPABASE_FALLBACK_URL =
  'postgresql://postgres.ibbqpjmvdnweoqphyhit:Cuongnv%401204@aws-0-ap-northeast-1.pooler.supabase.com:6543/postgres?pgbouncer=true';

function getDatabaseUrl(): string {
  return process.env.DATABASE_URL || SUPABASE_FALLBACK_URL;
}

export const prisma =
  globalThis.prismaGlobal ??
  new PrismaClient({
    datasources: {
      db: {
        url: getDatabaseUrl(),
      },
    },
    log:
      process.env.NODE_ENV === 'development'
        ? ['query', 'error', 'warn']
        : ['error'],
  });

globalThis.prismaGlobal = prisma;

export default prisma;
