import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
    try {

        // 1. Check Environment Variable
        const dbUrl = process.env.DATABASE_URL;
        const hasDbUrl = !!dbUrl;

        // Preview the URL (masked) to debugging quoting issues
        const urlPreview = hasDbUrl
            ? `${dbUrl.substring(0, 15)}...${dbUrl.substring(dbUrl.length - 5)} (Length: ${dbUrl.length})`
            : "N/A";

        // 2. Check Database Connection & Table
        let dbStatus = "unknown";
        let dbError = null;
        let tableCheck = "skipped";

        // 3. Direct Neon Driver Check (Diagnostic) - Initialize outside if block
        let directConnectionResult = null;

        if (hasDbUrl) {
            try {
                // Attempt a simple query
                await db.execute(sql`SELECT 1`);
                dbStatus = "connected";

                // Attempt to query users table to see if schema exists
                try {
                    await db.execute(sql`SELECT count(*) FROM users LIMIT 1`);
                    tableCheck = "users_table_exists";
                } catch (tableErr) {
                    tableCheck = "users_table_missing_or_error";
                    dbError = tableErr instanceof Error ? tableErr.message : String(tableErr);
                }
            } catch (e) {
                dbStatus = "disconnected";
                dbError = e instanceof Error ? e.message : String(e);
            }

            // 3. Direct Neon Driver Check (Diagnostic)
            // 4. Test Direct Driver Connection (Raw) to isolate Drizzle
            const cleanUrl = dbUrl.trim().replace(/^["']|["']$/g, "");
            // directConnectionResult is already defined in outer scope, do not redeclare
            directConnectionResult = { status: "pending" };
            try {
                // Import neon dynamically (ESM compatible)
                const { neon } = await import("@neondatabase/serverless");

                // Use the same sanitization/connection logic as db.ts (simulated)
                const sqlDirect = neon(cleanUrl);
                // Attempt to query the users table directly to rule out Drizzle issues
                const result = await sqlDirect`SELECT count(*) as count FROM users`;
                directConnectionResult = {
                    sanitized_url_preview: urlPreview,
                    status: "success",
                    result
                };
            } catch (err) {
                directConnectionResult = {
                    sanitized_url_preview: urlPreview,
                    status: "failed",
                    error: err instanceof Error ? err.message : String(err)
                };
            }

        } else {
            dbStatus = "missing_env";
        }

        const healthData = {
            version: "1.0.3-debug-users", // PROBING USERS TABLE
            timestamp: new Date().toISOString(),
            status: dbStatus === "connected" && tableCheck === "users_table_exists" ? "ok" : "issues_detected",
            env: {
                DATABASE_URL_SET: hasDbUrl,
                URL_PREVIEW: urlPreview,
                NODE_ENV: process.env.NODE_ENV,
                VERCEL_REGION: process.env.VERCEL_REGION || "unknown",
            },
            database: {
                status: dbStatus,
                table_check: tableCheck,
                error: dbError,
            },
            direct_connection: directConnectionResult
        };

        return NextResponse.json(healthData, {
            status: healthData.status === "ok" ? 200 : 503,
            headers: {
                "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
                "Pragma": "no-cache",
                "Expires": "0",
            }
        });

    } catch (error) {
        return NextResponse.json({
            status: "error",
            message: "Health check failed",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
