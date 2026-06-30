import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

function buildPrismaClient() {
  const url = process.env.DATABASE_URL ?? "";
  // Raise connection pool to handle 30 concurrent requests without P2024 timeouts
  const poolParams = "connection_limit=20&pool_timeout=30";
  const dbUrl = url.includes("?") ? `${url}&${poolParams}` : `${url}?${poolParams}`;
  return new PrismaClient({
    datasources: { db: { url: dbUrl } },
  });
}

export const prisma = globalForPrisma.prisma ?? buildPrismaClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
