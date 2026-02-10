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
        // Remove quotes and channel_binding (which causes issues in Vercel/Neon HTTP sometimes)
        const connectionString = process.env.DATABASE_URL
            .trim()
            .replace(/^["']|["']$/g, "")
            .replace(/&channel_binding=require/g, "")
            .replace(/\?channel_binding=require/g, "?");

        const sql = neon(connectionString);
        dbInstance = drizzle(sql);
    } else {
        // Build-time check
        if (process.env.NODE_ENV === "production" && process.argv.includes("build")) {
            console.warn("⚠️  DATABASE_URL is missing. Using mock DB for build.");
            dbInstance = mockDb;
        } else {
            // Runtime missing var behavior
            console.error("❌ DATABASE_URL is missing in .env");
            throw new Error("DATABASE_URL is missing");
        }
    }
} catch (error) {
    // Catch initialization errors (e.g. invalid URL)
    console.error("❌ Failed to initialize database connection:", error);

    // Only verify build context again to be safe
    const isBuild = process.env.NODE_ENV === "production" && process.argv.includes("build");

    if (isBuild) {
        console.warn("⚠️  Build mode detected. Using mock DB to allow build to finish.");
        dbInstance = mockDb;
    } else {
        // CRITICAL: In runtime, we must NOT use mockDb silently.
        // We throw or use a proxy that throws on access.
        dbInstance = new Proxy({}, {
            get: () => {
                throw new Error("Database initialization failed. Check server logs for details.");
            }
        }) as any;
    }
}

export const db = dbInstance;
