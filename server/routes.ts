import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProfileSchema, insertScrapingSessionSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Profile routes
  app.post("/api/profiles", async (req, res) => {
    try {
      const profileData = insertProfileSchema.parse(req.body);
      const profile = await storage.createProfile(profileData);
      res.json(profile);
    } catch (error: any) {
      console.error("Error creating profile:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.post("/api/profiles/upsert", async (req, res) => {
    try {
      const profileData = insertProfileSchema.parse(req.body);
      const profile = await storage.upsertProfile(profileData);
      res.json(profile);
    } catch (error: any) {
      console.error("Error upserting profile:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/profiles", async (req, res) => {
    try {
      const filters = {
        category: req.query.category as string,
        city: req.query.city as string,
        minFollowers: req.query.minFollowers ? parseInt(req.query.minFollowers as string) : undefined,
        maxFollowers: req.query.maxFollowers ? parseInt(req.query.maxFollowers as string) : undefined,
      };
      
      const profiles = await storage.getProfiles(filters);
      res.json(profiles);
    } catch (error: any) {
      console.error("Error fetching profiles:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/profiles/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      if (!query) {
        return res.status(400).json({ error: "Query parameter 'q' is required" });
      }
      
      const profiles = await storage.searchProfiles(query);
      res.json(profiles);
    } catch (error: any) {
      console.error("Error searching profiles:", error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/profiles/stats", async (req, res) => {
    try {
      const stats = await storage.getProfileStats();
      res.json(stats);
    } catch (error: any) {
      console.error("Error fetching profile stats:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Scraping session routes
  app.post("/api/sessions", async (req, res) => {
    try {
      const sessionData = insertScrapingSessionSchema.parse(req.body);
      const session = await storage.createScrapingSession(sessionData);
      res.json(session);
    } catch (error: any) {
      console.error("Error creating session:", error);
      res.status(400).json({ error: error.message });
    }
  });

  app.get("/api/sessions", async (req, res) => {
    try {
      const sessions = await storage.getScrapingSessions();
      res.json(sessions);
    } catch (error: any) {
      console.error("Error fetching sessions:", error);
      res.status(500).json({ error: error.message });
    }
  });

  // Bulk save profiles with session
  app.post("/api/profiles/bulk", async (req, res) => {
    try {
      const { category, city, confirmedProfiles, unconfirmedProfiles } = req.body;
      
      // Create session
      const session = await storage.createScrapingSession({
        category,
        city,
        totalProfiles: confirmedProfiles.length + unconfirmedProfiles.length,
        confirmedProfiles: confirmedProfiles.length,
        unconfirmedProfiles: unconfirmedProfiles.length,
      });

      // Prepare profile data
      const allProfiles = [...confirmedProfiles, ...unconfirmedProfiles];
      const savedProfiles = [];

      for (const profile of allProfiles) {
        const profileData = {
          sessionId: session.id,
          username: profile.userId,
          url: profile.url,
          brandName: profile.brandName,
          followers: profile.followers,
          bio: "",
          category,
          city,
          confidence: profile.confidence,
        };

        const savedProfile = await storage.upsertProfile(profileData);
        savedProfiles.push(savedProfile);
      }

      res.json({
        sessionId: session.id,
        profileCount: savedProfiles.length,
        profiles: savedProfiles,
      });
    } catch (error: any) {
      console.error("Error bulk saving profiles:", error);
      res.status(500).json({ error: error.message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
