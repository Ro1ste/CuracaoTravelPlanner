import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";

export async function registerRoutes(app: Express): Promise<Server> {
  // Temporary mock auth endpoint - replace with real auth later
  app.get('/api/auth/user', async (req, res) => {
    // Return null for now - frontend will show landing page
    res.json(null);
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
