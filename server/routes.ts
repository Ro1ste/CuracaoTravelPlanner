import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertCompanySchema, 
  insertTaskSchema, 
  insertTaskProofSchema,
  proofReviewSchema,
  insertEventRegistrationSchema
} from "@shared/schema";
import { ObjectStorageService, ObjectNotFoundError } from "./objectStorage";
import { ObjectPermission } from "./objectAcl";
import { QRCodeService } from "./qrService";
import { EmailService } from "./emailService";

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
      console.log('Created proof:', JSON.stringify(proof, null, 2));
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
      if (task && task.pointsReward) {
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

  // ========== OBJECT STORAGE ROUTES ==========
  // Referenced from blueprint:javascript_object_storage
  // Get upload URL for proof content
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadURL });
    } catch (error) {
      console.error("Error generating upload URL:", error);
      res.status(500).json({ error: "Failed to generate upload URL" });
    }
  });

  // Serve private objects with ACL checks
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      const objectStorageService = new ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      const canAccess = await objectStorageService.canAccessObjectEntity({
        objectFile,
        userId: userId,
        requestedPermission: ObjectPermission.READ,
      });
      
      if (!canAccess) {
        return res.sendStatus(403);
      }
      
      objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if (error instanceof ObjectNotFoundError) {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });

  // Update proof content URL after upload and set ACL
  app.put("/api/proofs/:id/content", isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user?.claims?.sub;
      if (!req.body.contentURL) {
        return res.status(400).json({ error: "contentURL is required" });
      }

      const proof = await storage.getProofById(req.params.id);
      if (!proof) {
        return res.status(404).json({ error: "Proof not found" });
      }

      // Verify ownership - user must own the company that submitted the proof
      const company = await storage.getCompany(proof.companyId);
      if (!company || company.userId !== userId) {
        return res.status(403).json({ error: "Not authorized" });
      }

      const objectStorageService = new ObjectStorageService();
      const objectPath = await objectStorageService.trySetObjectEntityAclPolicy(
        req.body.contentURL,
        {
          owner: userId,
          visibility: "private",
        }
      );

      // Update proof with the object path
      await storage.updateProofContent(req.params.id, objectPath);

      res.status(200).json({ objectPath });
    } catch (error) {
      console.error("Error setting proof content:", error);
      res.status(500).json({ error: "Internal server error" });
    }
  });

  // ========== EVENT ROUTES ==========
  // Get all active events
  app.get('/api/events', async (req, res) => {
    try {
      const events = await storage.getActiveEvents();
      res.json(events);
    } catch (error) {
      console.error("Error fetching events:", error);
      res.status(500).json({ message: "Failed to fetch events" });
    }
  });

  // Get specific event
  app.get('/api/events/:id', async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event:", error);
      res.status(500).json({ message: "Failed to fetch event" });
    }
  });

  // Create event (admin only)
  app.post('/api/events', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const event = await storage.createEvent(req.body);
      res.status(201).json(event);
    } catch (error) {
      console.error("Error creating event:", error);
      res.status(500).json({ message: "Failed to create event" });
    }
  });

  // Register for event
  app.post('/api/events/:id/register', async (req, res) => {
    try {
      const event = await storage.getEventById(req.params.id);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const registration = await storage.createEventRegistration({
        eventId: req.params.id,
        ...req.body
      });
      res.status(201).json(registration);
    } catch (error) {
      console.error("Error registering for event:", error);
      res.status(500).json({ message: "Failed to register for event" });
    }
  });

  // Get event registrations (admin only)
  app.get('/api/events/:id/registrations', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const registrations = await storage.getEventRegistrations(req.params.id);
      res.json(registrations);
    } catch (error) {
      console.error("Error fetching registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
    }
  });

  // Approve/Reject registration and send QR code (admin only)
  app.patch('/api/events/:eventId/registrations/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { status } = req.body;
      
      if (!status || !['approved', 'rejected'].includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }

      const registration = await storage.getEventRegistrationById(req.params.id);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      const event = await storage.getEventById(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      if (status === 'approved') {
        const token = QRCodeService.generateToken(registration.id, event.id);
        const qrPayload = {
          attendeeId: registration.id,
          eventId: event.id,
          token: token,
          issuedAt: Date.now(),
        };
        const qrCodeDataUrl = await QRCodeService.generateQRCode(qrPayload);

        const updatedRegistration = await storage.updateRegistrationStatus(req.params.id, 'approved');
        
        const emailTemplate = event.emailSubject && event.emailBodyText
          ? { subject: event.emailSubject, text: event.emailBodyText }
          : EmailService.getDefaultTemplate(event.title, `${registration.firstName} ${registration.lastName}`);

        await EmailService.sendEmail({
          to: registration.email,
          subject: emailTemplate.subject,
          text: emailTemplate.text,
          qrCodeDataUrl: qrCodeDataUrl,
        });

        res.json({ ...updatedRegistration, emailSent: true });
      } else {
        const updatedRegistration = await storage.updateRegistrationStatus(req.params.id, 'rejected');
        res.json(updatedRegistration);
      }
    } catch (error) {
      console.error("Error updating registration:", error);
      res.status(500).json({ message: "Failed to update registration" });
    }
  });

  // Resend QR code email (admin only)
  app.post('/api/events/:eventId/registrations/:id/resend', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const registration = await storage.getEventRegistrationById(req.params.id);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      if (registration.status !== 'approved') {
        return res.status(400).json({ message: "Registration must be approved first" });
      }

      const event = await storage.getEventById(req.params.eventId);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const token = QRCodeService.generateToken(registration.id, event.id);
      const qrPayload = {
        attendeeId: registration.id,
        eventId: event.id,
        token: token,
        issuedAt: Date.now(),
      };
      const qrCodeDataUrl = await QRCodeService.generateQRCode(qrPayload);

      const emailTemplate = event.emailSubject && event.emailBodyText
        ? { subject: event.emailSubject, text: event.emailBodyText }
        : EmailService.getDefaultTemplate(event.title, `${registration.firstName} ${registration.lastName}`);

      await EmailService.sendEmail({
        to: registration.email,
        subject: emailTemplate.subject,
        text: emailTemplate.text,
        qrCodeDataUrl: qrCodeDataUrl,
      });

      res.json({ message: "Email resent successfully" });
    } catch (error) {
      console.error("Error resending email:", error);
      res.status(500).json({ message: "Failed to resend email" });
    }
  });

  // Check in attendee (admin only)
  app.post('/api/registrations/:id/checkin', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const registration = await storage.checkInRegistration(req.params.id);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }
      res.json(registration);
    } catch (error) {
      console.error("Error checking in attendee:", error);
      res.status(500).json({ message: "Failed to check in attendee" });
    }
  });

  // Health check endpoint
  app.get("/api/health", async (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  const httpServer = createServer(app);

  return httpServer;
}
