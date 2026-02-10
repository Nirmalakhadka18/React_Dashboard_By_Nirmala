import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";


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

let dbInstance = mockDb;

try {
    if (process.env.DATABASE_URL) {
        const sql = neon(process.env.DATABASE_URL);
        dbInstance = drizzle(sql);
    } else {
        if (process.env.NODE_ENV === "production" && process.argv.includes("build")) {
            console.warn("⚠️  DATABASE_URL is missing. Skipping DB connection for build.");
        } else {
            console.warn("⚠️  DATABASE_URL is missing in .env");
        }
    }
} catch (error) {
    console.warn("⚠️  Failed to initialize database connection, using mock:", error);
}

export const db = dbInstance;
