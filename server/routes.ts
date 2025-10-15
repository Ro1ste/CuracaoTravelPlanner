import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { setupAuth, isAuthenticated } from "./replitAuth";
import { 
  insertCompanySchema, 
  insertTaskSchema, 
  insertTaskProofSchema,
  proofReviewSchema,
  insertEventRegistrationSchema,
  companySignupSchema,
  companyLoginSchema
} from "@shared/schema";
import { S3ObjectStorageService } from "./s3ObjectStorage";
import { QRCodeService } from "./qrService";
import { EmailService } from "./emailService";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";

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

  // ========== AUTHENTICATION ROUTES ==========
  
  // Company signup
  app.post('/api/auth/signup', async (req, res) => {
    try {
      const data = companySignupSchema.parse(req.body);
      
      // Check if email already exists
      const existingUser = await storage.getUserByEmail(data.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(data.password, 10);

      // Create user
      const userId = nanoid();
      const user = await storage.upsertUser({
        id: userId,
        email: data.email,
        password: hashedPassword,
        firstName: data.contactPersonName.split(' ')[0],
        lastName: data.contactPersonName.split(' ').slice(1).join(' ') || '',
        isAdmin: false,
      });

      // Create company profile
      await storage.createCompany({
        name: data.companyName,
        contactPersonName: data.contactPersonName,
        email: data.email,
        phone: data.phone,
        userId: user.id,
      });

      res.status(201).json({ success: true, message: "Account created successfully" });
    } catch (error: any) {
      console.error("Signup error:", error);
      res.status(400).json({ message: error.message || "Failed to create account" });
    }
  });

  // Company login
  app.post('/api/auth/login', async (req, res) => {
    try {
      const data = companyLoginSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(data.email);
      if (!user || !user.password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Verify password
      const isValidPassword = await bcrypt.compare(data.password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid email or password" });
      }

      // Set session with user object (compatible with Passport serialization)
      const authUser = {
        claims: { sub: user.id },
        expires_at: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 1 week
        email: user.email,
        id: user.id
      };
      
      req.login(authUser, (err: any) => {
        if (err) {
          console.error("Login session error:", err);
          return res.status(500).json({ message: "Login failed" });
        }
        res.json({ success: true, message: "Login successful" });
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  // Logout
  app.post('/api/logout', (req, res) => {
    req.logout((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destroy error:", err);
          return res.status(500).json({ message: "Logout failed" });
        }
        res.clearCookie('connect.sid');
        res.json({ success: true, message: "Logged out successfully" });
      });
    });
  });

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has a company profile
      const company = await storage.getCompanyByUserId(userId);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      res.json({
        ...userWithoutPassword,
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

  app.get('/api/proofs/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const proof = await storage.getProofById(req.params.id);
      if (!proof) {
        return res.status(404).json({ message: "Proof not found" });
      }
      
      // Fetch related task and company data
      const task = await storage.getTaskById(proof.taskId);
      const company = await storage.getCompany(proof.companyId);
      
      res.json({
        ...proof,
        task,
        company
      });
    } catch (error) {
      console.error("Error fetching proof:", error);
      res.status(500).json({ message: "Failed to fetch proof" });
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

      // Check if there's already a pending or approved proof for this task
      const existingProofs = await storage.getProofsByCompany(company.id);
      const existingProof = existingProofs.find(proof => 
        proof.taskId === proofData.taskId && 
        (proof.status === 'pending' || proof.status === 'approved')
      );
      
      if (existingProof) {
        if (existingProof.status === 'pending') {
          return res.status(400).json({ 
            message: "You have already submitted a proof for this task. It's currently pending review." 
          });
        } else if (existingProof.status === 'approved') {
          return res.status(400).json({ 
            message: "This task has already been completed and approved." 
          });
        }
      }

      // Normalize all object storage paths with ACL policies
      const objectStorageService = new S3ObjectStorageService();
      const normalizedUrls = await Promise.all(
        proofData.contentUrls.map(url => 
          objectStorageService.trySetObjectEntityAclPolicy(url, {
            owner: userId,
            visibility: "private",
          })
        )
      );

      // Create proof with normalized URLs
      const proof = await storage.createProof({
        ...proofData,
        contentUrls: normalizedUrls,
      });
      
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

      // Award points and calories only on transition from non-approved to approved
      const task = await storage.getTaskById(proof.taskId);
      if (task) {
        if (previousStatus !== 'approved' && reviewData.status === 'approved') {
          // Award points and calories when approving for the first time
          if (task.pointsReward) {
            await storage.updateCompanyPoints(proof.companyId, task.pointsReward);
          }
          if (task.caloriesBurned) {
            await storage.updateCompanyCalories(proof.companyId, task.caloriesBurned);
          }
        } else if (previousStatus === 'approved' && reviewData.status === 'rejected') {
          // Subtract points and calories when changing from approved to rejected
          if (task.pointsReward) {
            await storage.updateCompanyPoints(proof.companyId, -task.pointsReward);
          }
          if (task.caloriesBurned) {
            await storage.updateCompanyCalories(proof.companyId, -task.caloriesBurned);
          }
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
      
      // Sort by total points descending
      const sorted = companies
        .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
        .map((company, index) => ({
          id: company.id,
          name: company.name,
          points: company.totalPoints || 0,
          caloriesBurned: company.totalCaloriesBurned || 0,
          rank: index + 1,
        }));
      
      res.json(sorted);
    } catch (error) {
      console.error("Error fetching leaderboard:", error);
      res.status(500).json({ message: "Failed to fetch leaderboard" });
    }
  });

  // ========== ADMIN ROUTES ==========
  // Get all companies (admin only)
  app.get('/api/admin/companies', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      
      // Get user info for each company
      const companiesWithUsers = await Promise.all(
        companies.map(async (company) => {
          const user = company.userId ? await storage.getUser(company.userId) : null;
          return {
            ...company,
            user: user ? {
              id: user.id,
              email: user.email,
              firstName: user.firstName,
              lastName: user.lastName,
            } : null
          };
        })
      );
      
      res.json(companiesWithUsers);
    } catch (error) {
      console.error("Error fetching companies:", error);
      res.status(500).json({ message: "Failed to fetch companies" });
    }
  });

  // Update company password (admin only)
  app.patch('/api/admin/companies/:id/password', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { password } = req.body;
      
      if (!password || password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // Get company
      const company = await storage.getCompany(req.params.id);
      if (!company || !company.userId) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update user password
      const updatedUser = await storage.updateUserPassword(company.userId, hashedPassword);
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }

      res.json({ success: true, message: "Password updated successfully" });
    } catch (error: any) {
      console.error("Error updating password:", error);
      res.status(500).json({ message: error.message || "Failed to update password" });
    }
  });

  // Get all administrators (admin only)
  app.get('/api/admin/admins', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const admins = await storage.getAllAdmins();
      // Remove sensitive fields before sending response
      const sanitizedAdmins = admins.map(admin => ({
        id: admin.id,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
        createdAt: admin.createdAt,
        updatedAt: admin.updatedAt,
      }));
      res.json(sanitizedAdmins);
    } catch (error) {
      console.error("Error fetching admins:", error);
      res.status(500).json({ message: "Failed to fetch administrators" });
    }
  });

  // Create new administrator (admin only)
  app.post('/api/admin/admins', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { email, firstName, lastName, password } = req.body;
      
      // Validation
      if (!email || !firstName || !lastName || !password) {
        return res.status(400).json({ message: "All fields are required" });
      }
      
      if (password.length < 8) {
        return res.status(400).json({ message: "Password must be at least 8 characters" });
      }

      // Check if email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Create admin user
      const admin = await storage.createAdmin(email, firstName, lastName, hashedPassword);

      // Send welcome email
      try {
        const emailService = new EmailService();
        await emailService.sendAdminWelcomeEmail(
          email,
          `${firstName} ${lastName}`,
          email,
          password
        );
      } catch (emailError) {
        console.warn("Failed to send welcome email:", emailError);
        // Continue even if email fails
      }

      res.status(201).json({ 
        success: true, 
        message: "Administrator created successfully",
        admin: {
          id: admin.id,
          email: admin.email,
          firstName: admin.firstName,
          lastName: admin.lastName,
        }
      });
    } catch (error: any) {
      console.error("Error creating admin:", error);
      res.status(500).json({ message: error.message || "Failed to create administrator" });
    }
  });

  // ========== OBJECT STORAGE ROUTES ==========
  // Get upload URL for S3 object entity (client-side uploads)
  app.post("/api/upload-url", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new S3ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      res.json({ uploadUrl: uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Referenced from blueprint:javascript_object_storage
  // Get upload URL for proof content (legacy)
  app.post("/api/objects/upload", isAuthenticated, async (req, res) => {
    try {
      const objectStorageService = new S3ObjectStorageService();
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
      const objectStorageService = new S3ObjectStorageService();
      const objectPath = req.params.objectPath;
      
      const canAccess = await objectStorageService.canAccessObjectEntity({
        userId: userId,
        objectFile: objectPath,
        requestedPermission: "read",
      });
      
      if (!canAccess) {
        return res.sendStatus(403);
      }
      
      await objectStorageService.downloadObject(objectPath, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      return res.sendStatus(500);
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
      const err: any = error;
      res.status(500).json({ 
        message: "Failed to create event", 
        error: err?.message || String(err),
        stack: process.env.NODE_ENV === 'development' ? err?.stack : undefined
      });
    }
  });

  // Register for event
  app.post('/api/events/:idOrCode/register', async (req, res) => {
    try {
      let event = await storage.getEventById(req.params.idOrCode);
      if (!event) {
        event = await storage.getEventByShortCode(req.params.idOrCode);
      }
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }

      const registration = await storage.createEventRegistration({
        eventId: event.id,
        ...req.body
      });
      res.status(201).json(registration);
    } catch (error) {
      console.error("Error registering for event:", error);
      res.status(500).json({ message: "Failed to register for event" });
    }
  });

  app.get('/api/events/by-code/:shortCode', async (req, res) => {
    try {
      const event = await storage.getEventByShortCode(req.params.shortCode);
      if (!event) {
        return res.status(404).json({ message: "Event not found" });
      }
      res.json(event);
    } catch (error) {
      console.error("Error fetching event by short code:", error);
      res.status(500).json({ message: "Failed to fetch event" });
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

  // Get user's own registration for an event
  app.get('/api/events/:id/my-registration', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.claims.sub;
      const user = await storage.getUser(userId);
      
      if (!user || !user.email) {
        return res.status(404).json({ message: "User not found" });
      }

      const registrations = await storage.getEventRegistrations(req.params.id);
      const userRegistration = registrations.find(reg => reg.email === user.email);
      
      if (!userRegistration) {
        return res.status(404).json({ message: "Not registered for this event" });
      }

      res.json(userRegistration);
    } catch (error) {
      console.error("Error fetching user registration:", error);
      res.status(500).json({ message: "Failed to fetch registration" });
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
        
        const emailTemplate = (event.emailSubject && event.emailSubject.trim() !== '' && event.emailBodyText && event.emailBodyText.trim() !== '')
          ? { subject: event.emailSubject, text: event.emailBodyText }
          : EmailService.getDefaultTemplate(event.title, `${registration.firstName} ${registration.lastName}`);

        // Send email with QR code
        let emailSent = false;
        try {
          await EmailService.sendEmail({
            to: registration.email,
            subject: emailTemplate.subject,
            text: emailTemplate.text,
            qrCodeDataUrl: qrCodeDataUrl,
          });
          emailSent = true;
          console.log(`✅ QR Code email sent successfully to ${registration.email}`);
        } catch (emailError: any) {
          console.error(`❌ Failed to send email to ${registration.email}:`, emailError.message);
          emailSent = false;
        }

        res.json({ ...updatedRegistration, emailSent });
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

      const emailTemplate = (event.emailSubject && event.emailSubject.trim() !== '' && event.emailBodyText && event.emailBodyText.trim() !== '')
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

  // Check in attendee via QR code (admin only)
  app.post('/api/registrations/qr-checkin', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const { attendeeId, eventId, token } = req.body;

      if (!attendeeId || !eventId || !token) {
        return res.status(400).json({ message: "Missing required QR code data" });
      }

      // Verify the QR code token
      const isValidToken = QRCodeService.verifyToken(token, attendeeId, eventId);
      if (!isValidToken) {
        return res.status(401).json({ message: "Invalid or expired QR code" });
      }

      // Get the registration
      const registration = await storage.getEventRegistrationById(attendeeId);
      if (!registration) {
        return res.status(404).json({ message: "Registration not found" });
      }

      // Verify the event matches
      if (registration.eventId !== eventId) {
        return res.status(400).json({ message: "QR code does not match registration event" });
      }

      // Check if already checked in
      if (registration.checkedIn) {
        return res.status(400).json({ message: "Attendee already checked in" });
      }

      // Check in the attendee
      const checkedInRegistration = await storage.checkInRegistration(attendeeId);

      res.json({
        ...checkedInRegistration,
        message: "Attendee successfully checked in"
      });
    } catch (error) {
      console.error("Error checking in attendee via QR code:", error);
      res.status(500).json({ message: "Failed to check in attendee" });
    }
  });

  // ========== LEADERBOARD ROUTES ==========
  app.get('/api/leaderboard', isAuthenticated, async (req, res) => {
    try {
      const companies = await storage.getAllCompanies();
      
      // Sort by total points descending
      const sorted = companies
        .sort((a, b) => (b.totalPoints || 0) - (a.totalPoints || 0))
        .map((company, index) => ({
          id: company.id,
          name: company.name,
          points: company.totalPoints || 0,
          caloriesBurned: company.totalCaloriesBurned || 0,
          rank: index + 1,
        }));
      
      res.json(sorted);
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
