import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { eq, and, like, gte, lte, desc } from 'drizzle-orm';
import { 
  users, profiles, scrapingSessions,
  type User, type InsertUser,
  type Profile, type InsertProfile,
  type ScrapingSession, type InsertScrapingSession
} from "@shared/schema";

const connectionString = process.env.DATABASE_URL || "";
const client = postgres(connectionString);
export const db = drizzle(client);

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;

  // Profile methods
  createProfile(profile: InsertProfile): Promise<Profile>;
  getProfiles(filters?: {
    category?: string;
    city?: string;
    minFollowers?: number;
    maxFollowers?: number;
  }): Promise<Profile[]>;
  searchProfiles(query: string): Promise<Profile[]>;
  getProfileStats(): Promise<{ totalProfiles: number; categories: string[]; cities: string[] }>;
  upsertProfile(profile: InsertProfile): Promise<Profile>;

  // Scraping session methods
  createScrapingSession(session: InsertScrapingSession): Promise<ScrapingSession>;
  getScrapingSessions(): Promise<ScrapingSession[]>;
}

export class DatabaseStorage implements IStorage {
  // User methods
  async getUser(id: number): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const result = await db.select().from(users).where(eq(users.username, username));
    return result[0];
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await db.insert(users).values(insertUser).returning();
    return result[0];
  }

  // Profile methods
  async createProfile(profile: InsertProfile): Promise<Profile> {
    const result = await db.insert(profiles).values(profile).returning();
    return result[0];
  }

  async upsertProfile(profile: InsertProfile): Promise<Profile> {
    const result = await db
      .insert(profiles)
      .values(profile)
      .onConflictDoUpdate({
        target: profiles.username,
        set: {
          url: profile.url,
          brandName: profile.brandName,
          followers: profile.followers,
          bio: profile.bio,
          category: profile.category,
          city: profile.city,
          confidence: profile.confidence,
          updatedAt: new Date(),
        },
      })
      .returning();
    return result[0];
  }

  async getProfiles(filters?: {
    category?: string;
    city?: string;
    minFollowers?: number;
    maxFollowers?: number;
  }): Promise<Profile[]> {
    let query = db.select().from(profiles);
    
    const conditions = [];
    
    if (filters?.category) {
      conditions.push(like(profiles.category, `%${filters.category}%`));
    }
    if (filters?.city) {
      conditions.push(like(profiles.city, `%${filters.city}%`));
    }
    if (filters?.minFollowers) {
      conditions.push(gte(profiles.followers, filters.minFollowers));
    }
    if (filters?.maxFollowers) {
      conditions.push(lte(profiles.followers, filters.maxFollowers));
    }

    if (conditions.length > 0) {
      query = query.where(and(...conditions));
    }

    const result = await query.orderBy(desc(profiles.followers));
    return result;
  }

  async searchProfiles(query: string): Promise<Profile[]> {
    const result = await db
      .select()
      .from(profiles)
      .where(
        like(profiles.brandName, `%${query}%`)
      )
      .orderBy(desc(profiles.followers))
      .limit(50);
    return result;
  }

  async getProfileStats(): Promise<{ totalProfiles: number; categories: string[]; cities: string[] }> {
    const allProfiles = await db.select().from(profiles);
    
    const categorySet = new Set(allProfiles.map(p => p.category).filter((c): c is string => Boolean(c)));
    const citySet = new Set(allProfiles.map(p => p.city).filter((c): c is string => Boolean(c)));
    
    const categories = Array.from(categorySet);
    const cities = Array.from(citySet);
    
    return {
      totalProfiles: allProfiles.length,
      categories,
      cities,
    };
  }

  // Scraping session methods
  async createScrapingSession(session: InsertScrapingSession): Promise<ScrapingSession> {
    const result = await db.insert(scrapingSessions).values(session).returning();
    return result[0];
  }

  async getScrapingSessions(): Promise<ScrapingSession[]> {
    return db.select().from(scrapingSessions).orderBy(desc(scrapingSessions.createdAt));
  }
}

// Use DatabaseStorage instead of MemStorage
export const storage = new DatabaseStorage();
