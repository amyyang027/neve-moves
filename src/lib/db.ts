// A single shared Prisma client.
//
// Next.js reloads server code on every change in dev, which would otherwise
// create a new database connection each time. Stashing the client on
// `globalThis` keeps exactly one around.

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
