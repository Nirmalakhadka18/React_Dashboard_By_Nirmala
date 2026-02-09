import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import AdminDashboard from "@/components/AdminDashboard";
import { db } from "@/lib/db";
import { users } from "@/db/schema";
import { eq } from "drizzle-orm";

export default async function AdminPage() {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== "admin") {
        redirect("/dashboard");
    }

    // Fetch pending users
    const pendingUsers = await db
        .select()
        .from(users)
        .where(eq(users.status, "pending"));

    // Fetch approved users
    const approvedUsers = await db
        .select()
        .from(users)
        .where(eq(users.status, "approved"));

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
            <AdminDashboard initialPendingUsers={pendingUsers} approvedUsers={approvedUsers} />
        </div>
    );
}
