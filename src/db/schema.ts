import { pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name"),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role", { enum: ["admin", "user"] }).default("user").notNull(),
  status: text("status", { enum: ["pending", "approved"] }).default("pending").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
});
