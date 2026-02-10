import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
    try {
        // 1. Check Environment Variable
        const hasDbUrl = !!process.env.DATABASE_URL;

        // 2. Check Database Connection
        let dbStatus = "unknown";
        let dbError = null;

        if (hasDbUrl) {
            try {
                // Attempt a simple query
                await db.execute(sql`SELECT 1`);
                dbStatus = "connected";
            } catch (e) {
                dbStatus = "disconnected";
                dbError = e instanceof Error ? e.message : String(e);
            }
        } else {
            dbStatus = "missing_env";
        }

        const healthData = {
            status: dbStatus === "connected" ? "ok" : "error",
            timestamp: new Date().toISOString(),
            env: {
                DATABASE_URL_SET: hasDbUrl,
                NODE_ENV: process.env.NODE_ENV,
            },
            database: {
                status: dbStatus,
                error: dbError,
            },
        };

        return NextResponse.json(healthData, {
            status: dbStatus === "connected" ? 200 : 503
        });

    } catch (error) {
        return NextResponse.json({
            status: "error",
            message: "Health check failed",
            error: error instanceof Error ? error.message : String(error)
        }, { status: 500 });
    }
}
