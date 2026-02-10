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
            // Isolate Drizzle from the equation to verify raw connectivity
            const cleanUrl = dbUrl.trim().replace(/^["']|["']$/g, "");
            let directStatus = "unknown";
            let directError = null;

            try {
                // Import neon dynamically or assume it's available via closure if imported
                const { neon } = require("@neondatabase/serverless");
                const sqlDirect = neon(cleanUrl);
                await sqlDirect("SELECT 1");
                directStatus = "connected";
            } catch (dErr) {
                directStatus = "failed";
                directError = dErr instanceof Error ? dErr.message : String(dErr);
            }

            directConnectionResult = {
                sanitized_url_preview: `${cleanUrl.substring(0, 15)}...`,
                status: directStatus,
                error: directError
            };

        } else {
            dbStatus = "missing_env";
        }

        const healthData = {
            status: dbStatus === "connected" && tableCheck === "users_table_exists" ? "ok" : "issues_detected",
            timestamp: new Date().toISOString(),
            env: {
                DATABASE_URL_SET: hasDbUrl,
                URL_PREVIEW: urlPreview, // Check if it starts with "postgres...
                NODE_ENV: process.env.NODE_ENV,
            },
            database: {
                status: dbStatus,
                table_check: tableCheck,
                error: dbError,
            },
        };

        return NextResponse.json(healthData, {
            status: healthData.status === "ok" ? 200 : 503
        });

    } catch (error) {
        return NextResponse.json({
            status: "error",
            message: "Health check failed",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
