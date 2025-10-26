
import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { isAuthenticated, isAdmin, loginUser, registerUser } from "./auth";
import { 
  insertCompanySchema, 
  insertTaskSchema, 
  insertTaskProofSchema,
  proofReviewSchema,
  insertEventRegistrationSchema,
  companySignupSchema,
  companyLoginSchema,
  passwordResetRequestSchema,
  passwordResetConfirmSchema,
  insertSubjectSchema,
  insertPollSchema,
  insertVoteSchema
} from "@shared/schema";
import { S3ObjectStorageService } from "./s3ObjectStorage";
import { QRCodeService } from "./qrService";
import { EmailService } from "./emailService";
import bcrypt from "bcrypt";
import { nanoid } from "nanoid";

export async function registerRoutes(app: Express): Promise<Server> {

  
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
      
      // Use the JWT login function from auth.ts
      const result = await loginUser(data.email, data.password);
      
      if (!result) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Set HTTP-only cookie with JWT token
      res.cookie('auth_token', result.token, {
        httpOnly: true,
        secure: false, // Set to false for local development
        sameSite: 'lax', // Use 'lax' for better compatibility
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
        path: '/'
        // No domain restriction - let browser handle it
      });
      
      
      res.json({ 
        success: true, 
        message: "Login successful",
        user: result.user
      });
    } catch (error: any) {
      console.error("Login error:", error);
      res.status(400).json({ message: error.message || "Login failed" });
    }
  });

  // Logout
  app.post('/api/logout', (req, res) => {
    // Clear the HTTP-only cookie
    res.clearCookie('auth_token', {
      httpOnly: true,
      secure: false,
      sameSite: 'lax',
      path: '/'
    });
    
    res.json({ success: true, message: "Logged out successfully" });
  });

  // Password reset request
  app.post('/api/auth/password-reset-request', async (req, res) => {
    try {
      const { email } = passwordResetRequestSchema.parse(req.body);
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      if (!user) {
        // Don't reveal if email exists or not for security
        return res.json({ 
          success: true, 
          message: "If an account with that email exists, a password reset link has been sent." 
        });
      }

      // Generate reset token
      const resetToken = nanoid(32);
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour from now

      // Store reset token in database
      await storage.createPasswordResetToken({
        userId: user.id,
        token: resetToken,
        expiresAt,
      });

      // Generate reset URL
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://bepartofthemovement.online' 
        : 'http://localhost:5003';
      const resetUrl = `${baseUrl}/reset-password?token=${resetToken}`;

      // Send password reset email
      const emailService = new EmailService();
      await emailService.sendPasswordResetEmail(
        user.email,
        `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'User',
        resetToken,
        resetUrl
      );

      res.json({ 
        success: true, 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
    } catch (error: any) {
      console.error("Password reset request error:", error);
      res.status(400).json({ message: error.message || "Failed to process password reset request" });
    }
  });

  // Password reset confirmation
  app.post('/api/auth/password-reset-confirm', async (req, res) => {
    try {
      const { token, newPassword } = passwordResetConfirmSchema.parse(req.body);
      
      // Find and validate reset token
      const resetToken = await storage.getPasswordResetToken(token);
      if (!resetToken || resetToken.used || resetToken.expiresAt < new Date()) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      // Get user
      const user = await storage.getUser(resetToken.userId);
      if (!user) {
        return res.status(400).json({ message: "User not found" });
      }

      // Hash new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);

          // Update user password
          await storage.updateUserPasswordForReset(user.id, hashedPassword);

      // Mark reset token as used
      await storage.markPasswordResetTokenAsUsed(resetToken.id);

      res.json({ 
        success: true, 
        message: "Password has been reset successfully. You can now log in with your new password." 
      });
    } catch (error: any) {
      console.error("Password reset confirmation error:", error);
      res.status(400).json({ message: error.message || "Failed to reset password" });
    }
  });

  // Get current user
  app.get('/api/auth/user', isAuthenticated, async (req: any, res) => {
    try {
      const userId = req.user.id; // JWT auth sets req.user.id directly
      const user = await storage.getUser(userId);
      
      if (!user) {
        console.log('User not found for ID:', userId);
        return res.status(404).json({ message: "User not found" });
      }

      // Check if user has a company profile
      const company = await storage.getCompanyByUserId(userId);
      
      // Remove password from response
      const { password, ...userWithoutPassword } = user;
      
      console.log('User fetched successfully:', userWithoutPassword.email);
      
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
      const userId = req.user.id;
      
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
      const userId = req.user.id;
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
      const userId = req.user.id;
      const user = await storage.getUser(userId);
      
      // Admins can see all tasks
      if (user?.isAdmin) {
        const allTasks = await storage.getAllTasks();
        return res.json(allTasks);
      }
      
      // For regular users (companies), check if they have a company profile
      const company = await storage.getCompanyByUserId(userId);
      if (!company) {
        return res.status(400).json({ message: "Company profile required to view tasks" });
      }
      
      // All companies can see all tasks
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
      const userId = req.user.id;
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
      const userId = req.user.id;
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

      // Normalize all object storage paths
      const objectStorageService = new S3ObjectStorageService();
      const normalizedUrls = proofData.contentUrls.map(url => 
        objectStorageService.normalizeObjectEntityPath(url)
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

  // Remove company (admin only)
  app.delete('/api/admin/companies/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const companyId = req.params.id;
      
      // Get company details before deletion for email notification
      const company = await storage.getCompany(companyId);
      if (!company) {
        return res.status(404).json({ message: "Company not found" });
      }

      // Remove the company and all associated data
      const result = await storage.removeCompany(companyId);
      
      if (!result.success) {
        return res.status(400).json({ message: result.message });
      }

      // Send notification email to the company (if email service is available)
      try {
        const emailService = new EmailService();
        await emailService.sendCompanyRemovalNotification(
          company.email,
          company.name,
          result.deletedData
        );
        console.log(`✅ Company removal notification sent to ${company.email}`);
      } catch (emailError) {
        console.warn("Failed to send company removal notification:", emailError);
        // Continue even if email fails
      }

      res.json({
        success: true,
        message: result.message,
        deletedData: result.deletedData
      });
    } catch (error: any) {
      console.error("Error removing company:", error);
      res.status(500).json({ message: error.message || "Failed to remove company" });
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
      console.log('Getting upload URL for user:', (req as any).user?.email);
      const objectStorageService = new S3ObjectStorageService();
      const uploadURL = await objectStorageService.getObjectEntityUploadURL();
      console.log('Generated upload URL:', uploadURL.substring(0, 100) + '...');
      res.json({ uploadUrl: uploadURL });
    } catch (error) {
      console.error("Error getting upload URL:", error);
      res.status(500).json({ message: "Failed to get upload URL" });
    }
  });

  // Delete file from S3
  app.delete("/api/upload/:objectKey", isAuthenticated, async (req, res) => {
    try {
      const { objectKey } = req.params;
      console.log('Deleting object:', objectKey);
      
      const objectStorageService = new S3ObjectStorageService();
      await objectStorageService.deleteObject(objectKey);
      
      console.log('Successfully deleted object:', objectKey);
      res.json({ success: true, message: "File deleted successfully" });
    } catch (error) {
      console.error("Error deleting file:", error);
      res.status(500).json({ message: "Failed to delete file" });
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

  // Serve private objects  
  app.get("/objects/:objectPath(*)", isAuthenticated, async (req: any, res) => {
    try {
      const objectStorageService = new S3ObjectStorageService();
      const objectFile = await objectStorageService.getObjectEntityFile(req.path);
      
      // For now, allow all authenticated users to access proof images
      // In the future, you could add ACL checks here
      await objectStorageService.downloadObject(objectFile, res);
    } catch (error) {
      console.error("Error accessing object:", error);
      if ((error as any).name === 'ObjectNotFoundError') {
        return res.sendStatus(404);
      }
      return res.sendStatus(500);
    }
  });


  // ========== EVENT ROUTES ==========
  
  // Helper function to convert Curacao time (UTC-4) to UTC
  const curacaoToUTC = (dateString: string): Date => {
    // dateString format: "2024-10-26T14:00" (from datetime-local input)
    // This represents 2PM in Curacao (AST, UTC-4)
    // Parse as ISO string with explicit Curacao timezone offset
    const withTimezone = dateString + ':00-04:00'; // Add seconds and UTC-4 offset
    const utcDate = new Date(withTimezone);
    
    // Validate the result
    if (isNaN(utcDate.getTime())) {
      throw new Error('Invalid date format');
    }
    
    return utcDate;
  };
  
  // Helper function to convert UTC to Curacao time (UTC-4) for display
  const utcToCuracao = (utcDate: Date): string => {
    // Subtract 4 hours to get Curacao time
    const curacaoTime = new Date(utcDate.getTime() - (4 * 60 * 60 * 1000));
    const year = curacaoTime.getUTCFullYear();
    const month = String(curacaoTime.getUTCMonth() + 1).padStart(2, '0');
    const day = String(curacaoTime.getUTCDate()).padStart(2, '0');
    const hours = String(curacaoTime.getUTCHours()).padStart(2, '0');
    const minutes = String(curacaoTime.getUTCMinutes()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}`;
  };
  
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
      const eventData = { ...req.body };
      
      // Convert eventDate from Curacao time (AST, UTC-4) to UTC
      if (eventData.eventDate && typeof eventData.eventDate === 'string') {
        try {
          eventData.eventDate = curacaoToUTC(eventData.eventDate);
        } catch (error) {
          return res.status(400).json({ message: "Invalid event date format" });
        }
      }
      
      const event = await storage.createEvent(eventData);
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

  // Update event (admin only)
  app.patch('/api/events/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const eventId = req.params.id;
      const updates = { ...req.body };
      
      // Convert eventDate from Curacao time (AST, UTC-4) to UTC
      if (updates.eventDate && typeof updates.eventDate === 'string') {
        try {
          updates.eventDate = curacaoToUTC(updates.eventDate);
        } catch (error) {
          return res.status(400).json({ message: "Invalid event date format" });
        }
      }
      
      const updatedEvent = await storage.updateEvent(eventId, updates);
      if (!updatedEvent) {
        return res.status(404).json({ message: "Event not found" });
      }
      
      res.json(updatedEvent);
    } catch (error) {
      console.error("Error updating event:", error);
      res.status(500).json({ message: "Failed to update event" });
    }
  });

  // Delete event (admin only)
  app.delete('/api/events/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const eventId = req.params.id;
      await storage.deleteEvent(eventId);
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting event:", error);
      res.status(500).json({ message: "Failed to delete event" });
    }
  });

  // Get recent check-ins for event (public endpoint for display screens)
  // Sanitized to only include display-relevant fields (no PII like email/phone)
  app.get('/api/events/:eventId/recent-checkins', async (req, res) => {
    try {
      const { eventId } = req.params;
      const limit = parseInt(req.query.limit as string) || 10;
      const registrations = await storage.getEventRegistrations(eventId);
      
      // Filter to only checked-in registrations and sort by most recent
      const recentCheckIns = registrations
        .filter(r => r.checkedIn && r.checkedInAt)
        .sort((a, b) => {
          const aTime = a.checkedInAt?.getTime() || 0;
          const bTime = b.checkedInAt?.getTime() || 0;
          return bTime - aTime;
        })
        .slice(0, limit)
        // Sanitize: only return fields needed for display
        .map(r => ({
          id: r.id,
          firstName: r.firstName,
          lastName: r.lastName,
          companyName: r.companyName,
          checkedInAt: r.checkedInAt
        }));
      
      res.json(recentCheckIns);
    } catch (error) {
      console.error("Error fetching recent check-ins:", error);
      res.status(500).json({ message: "Failed to fetch recent check-ins" });
    }
  });

  // ========== PUBLIC CHECK-IN ROUTE ==========
  app.get('/checkin/:token', async (req, res) => {
    try {
      const token = req.params.token;
      
      // Verify the QR code token
      const tokenParts = token.split('.');
      if (tokenParts.length !== 2) {
        return res.status(400).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #dc3545;">Invalid QR Code</h1>
              <p>This QR code is not valid. Please contact the event organizers.</p>
            </body>
          </html>
        `);
      }
      
      const [data, signature] = tokenParts;
      const [attendeeId, eventId, nonce, timestamp] = data.split(':');
      
      if (!attendeeId || !eventId) {
        return res.status(400).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #dc3545;">Invalid QR Code</h1>
              <p>This QR code is missing required information.</p>
            </body>
          </html>
        `);
      }
      
      // Verify token signature
      const isValidToken = QRCodeService.verifyToken(token, attendeeId, eventId);
      if (!isValidToken) {
        return res.status(401).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #dc3545;">Invalid or Expired QR Code</h1>
              <p>This QR code is invalid or has expired. Please contact the event organizers for a new QR code.</p>
            </body>
          </html>
        `);
      }
      
      // Get the registration
      const registration = await storage.getEventRegistrationById(attendeeId);
      if (!registration) {
        return res.status(404).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #dc3545;">Registration Not Found</h1>
              <p>This registration could not be found. Please contact the event organizers.</p>
            </body>
          </html>
        `);
      }
      
      // Check if already checked in
      if (registration.checkedIn) {
        return res.send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #28a745;">Already Checked In</h1>
              <p>Hello ${registration.firstName} ${registration.lastName}!</p>
              <p>You have already been checked in for this event.</p>
              <p style="color: #666; font-size: 14px;">Checked in at: ${registration.checkedInAt ? new Date(registration.checkedInAt).toLocaleString() : 'Unknown'}</p>
            </body>
          </html>
        `);
      }
      
      // Check in the attendee
      const checkedInRegistration = await storage.checkInRegistration(attendeeId);
      
      if (checkedInRegistration) {
        return res.send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #28a745;">Check-in Successful!</h1>
              <p>Hello ${registration.firstName} ${registration.lastName}!</p>
              <p>You have been successfully checked in for the event.</p>
              <p style="color: #666; font-size: 14px;">Checked in at: ${new Date().toLocaleString()}</p>
              <div style="margin-top: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 8px; display: inline-block;">
                <p style="margin: 0; font-weight: bold;">Welcome to the event!</p>
                <p style="margin: 5px 0 0 0; color: #666;">Please proceed to the event area.</p>
              </div>
            </body>
          </html>
        `);
      } else {
        return res.status(500).send(`
          <html>
            <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
              <h1 style="color: #dc3545;">Check-in Failed</h1>
              <p>There was an error processing your check-in. Please contact the event organizers.</p>
            </body>
          </html>
        `);
      }
    } catch (error) {
      console.error("Error processing public check-in:", error);
      return res.status(500).send(`
        <html>
          <body style="font-family: Arial, sans-serif; text-align: center; padding: 50px;">
            <h1 style="color: #dc3545;">Check-in Error</h1>
            <p>There was an error processing your check-in. Please contact the event organizers.</p>
          </body>
        </html>
      `);
    }
  });

  // Get company's event registrations
  app.get('/api/company/registrations', isAuthenticated, async (req, res) => {
    try {
      const userId = req.user.id;
      const company = await storage.getCompanyByUserId(userId);
      
      if (!company) {
        return res.status(400).json({ message: "Company profile required" });
      }
      
      // Get all event registrations for this company's email
      const allEvents = await storage.getAllEvents();
      const companyRegistrations = [];
      
      for (const event of allEvents) {
        const eventRegistrations = await storage.getEventRegistrations(event.id);
        const companyRegistration = eventRegistrations.find(reg => reg.email === company.email);
        if (companyRegistration) {
          companyRegistrations.push(companyRegistration);
        }
      }
      
      res.json(companyRegistrations);
    } catch (error) {
      console.error("Error fetching company registrations:", error);
      res.status(500).json({ message: "Failed to fetch registrations" });
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
      const userId = req.user.id;
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
          ? { subject: event.emailSubject, text: EmailService.formatEmailText(event.emailBodyText) }
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
        ? { subject: event.emailSubject, text: EmailService.formatEmailText(event.emailBodyText) }
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

  // S3 configuration test endpoint
  app.get("/api/s3-config", (req, res) => {
    const config = {
      bucketName: process.env.S3_BUCKET_NAME,
      region: process.env.S3_REGION,
      hasAccessKey: !!process.env.S3_ACCESS_KEY_ID,
      hasSecretKey: !!process.env.S3_SECRET_ACCESS_KEY,
      cloudFrontDomain: process.env.CLOUDFRONT_DOMAIN,
      accessKeyPreview: process.env.S3_ACCESS_KEY_ID ? `${process.env.S3_ACCESS_KEY_ID.substring(0, 8)}...` : 'NOT SET'
    };
    res.json(config);
  });

  // Generate signed URL for viewing images
  app.get("/api/s3-signed-url/:objectKey", isAuthenticated, async (req, res) => {
    try {
      const { objectKey } = req.params;
      const objectStorageService = new S3ObjectStorageService();
      const signedUrl = await objectStorageService.getSignedObjectUrl(decodeURIComponent(objectKey), 3600); // 1 hour
      res.json({ signedUrl });
    } catch (error) {
      console.error("Error generating signed URL:", error);
      res.status(500).json({ message: "Failed to generate signed URL" });
    }
  });

  // ========== POLLING SYSTEM ROUTES ==========
  
  // Get all subjects (Admin only)
  app.get('/api/subjects', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const subjects = await storage.getAllSubjects();
      res.json(subjects);
    } catch (error) {
      console.error("Error fetching subjects:", error);
      res.status(500).json({ message: "Failed to fetch subjects" });
    }
  });

  // Get subject by short code (Public) - MUST be before /:id route
  app.get('/api/subjects/code/:shortCode', async (req, res) => {
    try {
      const subject = await storage.getSubjectByShortCode(req.params.shortCode);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      console.error("Error fetching subject:", error);
      res.status(500).json({ message: "Failed to fetch subject" });
    }
  });

  // Get subject by ID (Public)
  app.get('/api/subjects/:id', async (req, res) => {
    try {
      const subject = await storage.getSubjectById(req.params.id);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error) {
      console.error("Error fetching subject:", error);
      res.status(500).json({ message: "Failed to fetch subject" });
    }
  });

  // Create subject (Admin only)
  app.post('/api/subjects', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertSubjectSchema.parse(req.body);
      const subject = await storage.createSubject(data);
      res.status(201).json(subject);
    } catch (error: any) {
      console.error("Error creating subject:", error);
      res.status(400).json({ message: error.message || "Failed to create subject" });
    }
  });

  // Advance poll (Public - for voting page)
  app.post('/api/subjects/:id/advance', async (req, res) => {
    try {
      const subject = await storage.getSubjectById(req.params.id);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      
      const polls = await storage.getPollsBySubject(req.params.id);
      const currentIndex = subject.currentPollIndex || 0;
      
      if (currentIndex >= polls.length - 1) {
        return res.status(400).json({ message: "Already at last poll" });
      }
      
      const newIndex = currentIndex + 1;
      const updatedSubject = await storage.updateSubject(req.params.id, {
        currentPollIndex: newIndex,
      });
      
      // Broadcast poll change via WebSocket
      try {
        const { pollWebSocketService } = await import("./websocket");
        if (pollWebSocketService) {
          pollWebSocketService.broadcastCurrentPollChange(req.params.id, newIndex);
        }
      } catch (error) {
        console.error("Error broadcasting poll change:", error);
      }
      
      res.json(updatedSubject);
    } catch (error: any) {
      console.error("Error advancing poll:", error);
      res.status(400).json({ message: error.message || "Failed to advance poll" });
    }
  });

  // Update subject (Admin only)
  app.patch('/api/subjects/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const subject = await storage.updateSubject(req.params.id, req.body);
      if (!subject) {
        return res.status(404).json({ message: "Subject not found" });
      }
      res.json(subject);
    } catch (error: any) {
      console.error("Error updating subject:", error);
      res.status(400).json({ message: error.message || "Failed to update subject" });
    }
  });

  // Delete subject (Admin only)
  app.delete('/api/subjects/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deleteSubject(req.params.id);
      res.json({ message: "Subject deleted successfully" });
    } catch (error) {
      console.error("Error deleting subject:", error);
      res.status(500).json({ message: "Failed to delete subject" });
    }
  });

  // Get polls for a subject (Public)
  app.get('/api/subjects/:subjectId/polls', async (req, res) => {
    try {
      const polls = await storage.getPollsBySubject(req.params.subjectId);
      res.json(polls);
    } catch (error) {
      console.error("Error fetching polls:", error);
      res.status(500).json({ message: "Failed to fetch polls" });
    }
  });

  // Create poll (Admin only)
  app.post('/api/polls', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const data = insertPollSchema.parse(req.body);
      const poll = await storage.createPoll(data);
      res.status(201).json(poll);
    } catch (error: any) {
      console.error("Error creating poll:", error);
      res.status(400).json({ message: error.message || "Failed to create poll" });
    }
  });

  // Update poll (Admin only)
  app.patch('/api/polls/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      const poll = await storage.updatePoll(req.params.id, req.body);
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      res.json(poll);
    } catch (error: any) {
      console.error("Error updating poll:", error);
      res.status(400).json({ message: error.message || "Failed to update poll" });
    }
  });

  // Delete poll (Admin only)
  app.delete('/api/polls/:id', isAuthenticated, isAdmin, async (req, res) => {
    try {
      await storage.deletePoll(req.params.id);
      res.json({ message: "Poll deleted successfully" });
    } catch (error) {
      console.error("Error deleting poll:", error);
      res.status(500).json({ message: "Failed to delete poll" });
    }
  });

  // Submit vote (Public)
  app.post('/api/votes', async (req, res) => {
    try {
      const data = insertVoteSchema.parse(req.body);
      
      // Check if already voted
      const hasVoted = await storage.hasVoted(data.pollId, data.sessionId);
      if (hasVoted) {
        return res.status(400).json({ message: "You have already voted on this poll" });
      }
      
      const vote = await storage.createVote(data);
      
      // Get updated vote counts
      const voteCounts = await storage.getVoteCounts(data.pollId);
      
      // Get poll to find subject ID
      const poll = await storage.getPollById(data.pollId);
      
      // Broadcast vote update via WebSocket (imported dynamically to avoid circular deps)
      if (poll) {
        try {
          const { pollWebSocketService } = await import("./websocket");
          if (pollWebSocketService) {
            pollWebSocketService.broadcastVoteUpdate(poll.subjectId, data.pollId, voteCounts);
          }
        } catch (error) {
          console.error("Error broadcasting vote update:", error);
        }
      }
      
      res.status(201).json({ vote, voteCounts });
    } catch (error: any) {
      console.error("Error submitting vote:", error);
      res.status(400).json({ message: error.message || "Failed to submit vote" });
    }
  });

  // Get vote counts for a poll (Public)
  app.get('/api/polls/:pollId/votes', async (req, res) => {
    try {
      const voteCounts = await storage.getVoteCounts(req.params.pollId);
      res.json(voteCounts);
    } catch (error) {
      console.error("Error fetching vote counts:", error);
      res.status(500).json({ message: "Failed to fetch vote counts" });
    }
  });

  // Generate AI insight about poll question
  app.get('/api/polls/:pollId/question-insight', async (req, res) => {
    try {
      const poll = await storage.getPollById(req.params.pollId);
      
      if (!poll) {
        return res.status(404).json({ message: "Poll not found" });
      }
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are a thoughtful analyst providing brief, interesting context or perspective about poll questions. Keep responses to 2-3 sentences maximum. Be informative and engaging, helping voters think about the question from different angles.",
            },
            {
              role: "user",
              content: `Provide a brief, interesting insight or perspective about this poll question: "${poll.question}"`,
            },
          ],
          max_tokens: 120,
          temperature: 0.7,
        }),
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]?.message?.content) {
        res.json({ insight: data.choices[0].message.content });
      } else {
        res.status(500).json({ message: "Failed to generate insight" });
      }
    } catch (error: any) {
      console.error("Error generating AI insight:", error);
      res.status(500).json({ message: "Failed to generate insight" });
    }
  });

  // Generate AI commentary for poll results
  app.post('/api/polls/:pollId/commentary', async (req, res) => {
    try {
      const { question, results } = req.body;
      
      if (!process.env.OPENAI_API_KEY) {
        return res.status(500).json({ message: "OpenAI API key not configured" });
      }

      const resultsText = results
        .map((r: { option: string; votes: number; percentage: number }) => 
          `${r.option}: ${r.votes} votes (${r.percentage}%)`
        )
        .join("\n");

      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: [
            {
              role: "system",
              content:
                "You are an energetic sports commentator providing brief, engaging insights about live poll results. Keep responses to 2-3 sentences maximum. Be enthusiastic and highlight interesting patterns or close races.",
            },
            {
              role: "user",
              content: `Question: ${question}\n\nCurrent results:\n${resultsText}\n\nProvide brief, exciting commentary about these results.`,
            },
          ],
          max_tokens: 100,
          temperature: 0.8,
        }),
      });

      const data = await response.json();
      
      if (data.choices && data.choices[0]?.message?.content) {
        res.json({ commentary: data.choices[0].message.content });
      } else {
        res.status(500).json({ message: "Failed to generate commentary" });
      }
    } catch (error: any) {
      console.error("Error generating AI commentary:", error);
      res.status(500).json({ message: "Failed to generate commentary" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
