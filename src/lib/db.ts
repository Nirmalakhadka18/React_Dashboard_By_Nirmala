import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";


if (!process.env.DATABASE_URL) {
    if (process.env.NODE_ENV === "production" && process.argv.includes("build")) {
        // Skip DB connection during build if env var is missing
        console.warn("⚠️  DATABASE_URL is missing. Skipping DB connection for build.");
    } else {
        // In dev or runtime, we want to know if it's missing
        console.warn("⚠️  DATABASE_URL is missing in .env");
    }
}

const mockDb = {
    select: () => mockDb,
    from: () => mockDb,
    where: () => [],
    limit: () => [],
    offset: () => [],
    update: () => mockDb,
    set: () => mockDb,
    values: () => mockDb,
    insert: () => mockDb,
    delete: () => mockDb,
    returning: () => [],
    transaction: (fn: any) => fn(mockDb),
} as any;

const sql = process.env.DATABASE_URL ? neon(process.env.DATABASE_URL) : ({} as any);
export const db = process.env.DATABASE_URL ? drizzle(sql) : mockDb;
