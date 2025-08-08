import { pgTable, text, serial, integer, boolean, uuid, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const scrapingSessions = pgTable("scraping_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  category: text("category").notNull(),
  city: text("city").notNull(),
  totalProfiles: integer("total_profiles").default(0),
  confirmedProfiles: integer("confirmed_profiles").default(0),
  unconfirmedProfiles: integer("unconfirmed_profiles").default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  sessionId: uuid("session_id").references(() => scrapingSessions.id),
  username: text("username").notNull().unique(),
  url: text("url").notNull(),
  brandName: text("brand_name"),
  followers: integer("followers"),
  bio: text("bio"),
  category: text("category"),
  city: text("city"),
  confidence: text("confidence"),
  bioEmbedding: text("bio_embedding"), // JSON array as text for now
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export const insertScrapingSessionSchema = createInsertSchema(scrapingSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProfileSchema = createInsertSchema(profiles).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;
export type InsertScrapingSession = z.infer<typeof insertScrapingSessionSchema>;
export type ScrapingSession = typeof scrapingSessions.$inferSelect;
export type InsertProfile = z.infer<typeof insertProfileSchema>;
export type Profile = typeof profiles.$inferSelect;
