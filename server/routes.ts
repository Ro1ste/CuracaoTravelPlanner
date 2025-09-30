import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertCompanySchema, 
  insertTaskSchema, 
  insertTaskProofSchema,
  proofReviewSchema
} from "@shared/schema";

// Middleware to check if user is admin
const isAdmin = async (req: any, res: any, next: any) => {
  try {
    const userId = req.user.claims.sub;
    const user = await storage.getUser(userId);
    
    if (!user || !user.isAdmin) {
      return res.status(403).json({ message: "Admin access required" });
    }
    
    req.currentUser = user;
    next();
  } catch (error) {
    console.error("Error checking admin status:", error);
    res.status(500).json({ message: "Failed to verify admin status" });
  }
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up authentication
  await setupAuth(app);

  // Auth routes
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has a company profile
      const company = await storage.getCompanyByUserId(userId);
      
      res.json({
        ...user,
        hasCompany: !!company,
        companyId: company?.id
      });
    } catch (error) {
      console.error("Error fetching user:", error);
      res.status(500).json({ message: "Failed to fetch user" });
    }
  });

  // ========== COMPANY ROUTES ==========
  app.get('/api/companies', isAuthenticated, async (req, res) => {
    try {
      const allCompanies = await storage.getAllCompanies();
      res.json(allCompanies);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  app.get('/api/companies/:id', isAuthenticated, async (req, res) => {
    try {
      const company = await storage.getCompany(req.params.id);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      res.json(company);
    } catch (error) {
      console.error("Error fetching company:", error);
      res.status(500).json({ message: "Failed to fetch company" });
    }
  });

  app.post('/api/companies', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      
      // Check if user already has a company
      const existingCompany = await storage.getCompanyByUserId(userId);
      if (existingCompany) {
        return res.status(400).json({ message: "User already has a company profile" });
      }

      const parsedData = insertCompanySchema.parse(req.body);
      const company = await storage.createCompany({ ...parsedData, userId });
      res.status(201).json(company);
    } catch (error: any) {
      console.error("Error creating company:", error);
      res.status(400).json({ message: error.message || "Failed to create company" });
    }
  });

  app.patch('/api/companies/:id', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompany(req.params.id);
      
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }
      
      // Only the company owner can update
      if (company.userId !== userId) {
        return res.status(403).json({ message: "Not authorized to update this company" });
      }

      const updates = insertCompanySchema.partial().parse(req.body);
      const updatedCompany = await storage.updateCompany(req.params.id, updates);
      res.json(updatedCompany);
    } catch (error: any) {
      console.error("Error updating company:", error);
      res.status(400).json({ message: error.message || "Failed to update company" });
    }
  });

  // ========== TASK ROUTES ==========
  app.get('/api/tasks', isAuthenticated, async (req, res) => {
    try {
      const allTasks = await storage.getAllTasks();
      res.json(allTasks);
    } catch (error) {
      console.error("Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks" });
    }
  });

  app.get('/api/tasks/:id', isAuthenticated, async (req, res) => {
    try {
      const task = await storage.getTaskById(req.params.id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error) {
      console.error("Error fetching task:", error);
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.post('/api/tasks', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const taskData = insertTaskSchema.parse(req.body);
      const task = await storage.createTask(taskData);
      res.status(201).json(task);
    } catch (error: any) {
      console.error("Error creating task:", error);
      res.status(400).json({ message: error.message || "Failed to create task" });
    }
  });

  app.patch('/api/tasks/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const updates = insertTaskSchema.partial().parse(req.body);
      const task = await storage.updateTask(req.params.id, updates);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      res.json(task);
    } catch (error: any) {
      console.error("Error updating task:", error);
      res.status(400).json({ message: error.message || "Failed to update task" });
    }
  });

  app.delete('/api/tasks/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteTask(req.params.id);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // ========== PROOF ROUTES ==========
  app.get('/api/proofs', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const proofs = await storage.getAllProofs();
      res.json(proofs);
    } catch (error) {
      console.error("Error fetching proofs:", error);
      res.status(500).json({ message: "Failed to fetch proofs" });
    }
  });

  app.get('/api/proofs/pending', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const proofs = await storage.getPendingProofs();
      res.json(proofs);
    } catch (error) {
      console.error("Error fetching pending proofs:", error);
      res.status(500).json({ message: "Failed to fetch pending proofs" });
    }
  });

  app.get('/api/companies/:companyId/proofs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      
      // Users can only see their own company's proofs unless admin
      const user = await storage.getUser(userId);
      if (!user?.isAdmin && company?.id !== req.params.companyId) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const proofs = await storage.getProofsByCompany(req.params.companyId);
      res.json(proofs);
    } catch (error) {
      console.error("Error fetching company proofs:", error);
      res.status(500).json({ message: "Failed to fetch proofs" });
    }
  });

  app.post('/api/proofs', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const company = await storage.getCompanyByUserId(userId);
      
      if (!company) {
        return res.status(400).json({ message: "Company profile required" });
      }

      const proofData = insertTaskProofSchema.parse({
        ...req.body,
        companyId: company.id
      });

      const proof = await storage.createProof(proofData);
      res.status(201).json(proof);
    } catch (error: any) {
      console.error("Error creating proof:", error);
      res.status(400).json({ message: error.message || "Failed to create proof" });
    }
  });

  app.patch('/api/proofs/:id/review', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const reviewData = proofReviewSchema.parse(req.body);
      
      const proof = await storage.getProofById(req.params.id);
      if (!proof) {
        return res.status(404).json({ message: "Proof not found" });
      }

      const previousStatus = proof.status;

      const updatedProof = await storage.updateProofStatus(
        req.params.id,
        reviewData.status,
        reviewData.adminNotes
      );

      // Award points only on transition from non-approved to approved
      const task = await storage.getTaskById(proof.taskId);
      if (task) {
        if (previousStatus !== 'approved' && reviewData.status === 'approved') {
          // Award points when approving for the first time
          await storage.updateCompanyPoints(proof.companyId, task.pointsReward);
        } else if (previousStatus === 'approved' && reviewData.status === 'rejected') {
          // Subtract points when changing from approved to rejected
          await storage.updateCompanyPoints(proof.companyId, -task.pointsReward);
        }
      }

      res.json(updatedProof);
    } catch (error: any) {
      console.error("Error reviewing proof:", error);
      res.status(400).json({ message: error.message || "Failed to review proof" });
    }
  });

  // ========== LEADERBOARD ROUTE ==========
  app.get('/api/leaderboard', isAuthenticated, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      const leaderboard = companies.map((company, index) => ({
        id: company.id,
        name: company.name,
        points: company.totalPoints,
        rank: index + 1
      }));
      res.json(leaderboard);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
