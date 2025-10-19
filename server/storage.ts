import { 
  type User, 
  type UpsertUser,
  type Company,
  type UpsertCompany,
  type Task,
  type UpsertTask,
  type TaskProof,
  type UpsertTaskProof,
  type Event,
  type InsertEvent,
  type EventRegistration,
  type InsertEventRegistration,
  type PasswordResetToken,
  users,
  companies,
  tasks,
  taskProofs,
  events,
  eventRegistrations,
  passwordResetTokens
} from "@shared/schema";
import { eq, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined>;
  getAllAdmins(): Promise<User[]>;
  createAdmin(email: string, firstName: string, lastName: string, hashedPassword: string): Promise<User>;
  
  // Company operations
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyByUserId(userId: string): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  createCompany(company: UpsertCompany): Promise<Company>;
  updateCompany(id: string, updates: Partial<UpsertCompany>): Promise<Company | undefined>;
  updateCompanyPoints(id: string, pointsToAdd: number): Promise<Company | undefined>;
  updateCompanyCalories(id: string, caloriesToAdd: number): Promise<Company | undefined>;
  removeCompany(id: string): Promise<{ success: boolean; message: string; deletedData?: any }>;
  
  // Task operations
  getAllTasks(): Promise<Task[]>;
  getTaskById(id: string): Promise<Task | undefined>;
  createTask(task: UpsertTask): Promise<Task>;
  updateTask(id: string, updates: Partial<UpsertTask>): Promise<Task | undefined>;
  deleteTask(id: string): Promise<void>;
  
  // Proof operations
  getProofsByCompany(companyId: string): Promise<TaskProof[]>;
  getProofById(id: string): Promise<TaskProof | undefined>;
  getPendingProofs(): Promise<TaskProof[]>;
  getAllProofs(): Promise<TaskProof[]>;
  createProof(proof: UpsertTaskProof): Promise<TaskProof>;
  updateProofStatus(id: string, status: 'approved' | 'rejected', adminNotes?: string): Promise<TaskProof | undefined>;
  
  // Event operations
  getAllEvents(): Promise<Event[]>;
  getEventById(id: string): Promise<Event | undefined>;
  getEventByShortCode(shortCode: string): Promise<Event | undefined>;
  getActiveEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent & { shortCode?: string }): Promise<Event>;
  updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined>;
  
  // Event registration operations
  getEventRegistrations(eventId: string): Promise<EventRegistration[]>;
  getEventRegistrationById(id: string): Promise<EventRegistration | undefined>;
  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
  updateRegistrationStatus(id: string, status: 'approved' | 'rejected'): Promise<EventRegistration | undefined>;
  checkInRegistration(id: string): Promise<EventRegistration | undefined>;
  
  // Password reset operations
  createPasswordResetToken(token: { userId: string; token: string; expiresAt: Date }): Promise<PasswordResetToken>;
  getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined>;
  markPasswordResetTokenAsUsed(id: string): Promise<void>;
  updateUserPasswordForReset(userId: string, hashedPassword: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  private _db: any = null;
  
  private async getDb() {
    if (!this._db) {
      const { db } = await import("./db");
      this._db = db;
    }
    return this._db;
  }

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const db = await this.getDb();
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const db = await this.getDb();
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const db = await this.getDb();
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const db = await this.getDb();
    const [user] = await db
      .update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date() 
      })
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllAdmins(): Promise<User[]> {
    const db = await this.getDb();
    return await db.select().from(users).where(eq(users.isAdmin, true));
  }

  async createAdmin(email: string, firstName: string, lastName: string, hashedPassword: string): Promise<User> {
    const db = await this.getDb();
    const [user] = await db
      .insert(users)
      .values({
        email,
        firstName,
        lastName,
        password: hashedPassword,
        isAdmin: true,
      })
      .returning();
    return user;
  }

  // Company operations
  async getCompany(id: string): Promise<Company | undefined> {
    const db = await this.getDb();
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyByUserId(userId: string): Promise<Company | undefined> {
    const db = await this.getDb();
    const [company] = await db.select().from(companies).where(eq(companies.userId, userId));
    return company;
  }

  async getAllCompanies(): Promise<Company[]> {
    const db = await this.getDb();
    return await db.select().from(companies).orderBy(desc(companies.totalPoints));
  }

  async createCompany(companyData: UpsertCompany): Promise<Company> {
    const db = await this.getDb();
    const [company] = await db.insert(companies).values(companyData).returning();
    return company;
  }

  async updateCompany(id: string, updates: Partial<UpsertCompany>): Promise<Company | undefined> {
    const db = await this.getDb();
    const [company] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async updateCompanyPoints(id: string, pointsToAdd: number): Promise<Company | undefined> {
    const db = await this.getDb();
    const [company] = await db
      .update(companies)
      .set({ 
        totalPoints: sql`COALESCE(${companies.totalPoints}, 0) + ${pointsToAdd}`,
        updatedAt: new Date() 
      })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async updateCompanyCalories(id: string, caloriesToAdd: number): Promise<Company | undefined> {
    const db = await this.getDb();
    const [company] = await db
      .update(companies)
      .set({ 
        totalCaloriesBurned: sql`COALESCE(${companies.totalCaloriesBurned}, 0) + ${caloriesToAdd}`,
        updatedAt: new Date() 
      })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async removeCompany(id: string): Promise<{ success: boolean; message: string; deletedData?: any }> {
    const db = await this.getDb();
    
    try {
      // Get company details before deletion for logging
      const company = await this.getCompany(id);
      if (!company) {
        return { success: false, message: "Company not found" };
      }

      // Get related data for logging
      const proofs = await this.getProofsByCompany(id);
      const user = company.userId ? await this.getUser(company.userId) : null;
      
      // Get event registrations with the same email as the company
      const eventRegistrations = await db.select().from(eventRegistrations).where(eq(eventRegistrations.email, company.email));

      // Start transaction
      await db.transaction(async (tx) => {
        // Delete all proofs associated with this company
        if (proofs.length > 0) {
          await tx.delete(taskProofs).where(eq(taskProofs.companyId, id));
        }

        // Delete all event registrations with the same email as the company
        if (eventRegistrations.length > 0) {
          await tx.delete(eventRegistrations).where(eq(eventRegistrations.email, company.email));
        }

        // Delete the company
        await tx.delete(companies).where(eq(companies.id, id));

        // Optionally delete the associated user account
        if (company.userId && user) {
          await tx.delete(users).where(eq(users.id, company.userId));
        }
      });

      return {
        success: true,
        message: `Company "${company.name}" and all associated data have been successfully removed`,
        deletedData: {
          company: {
            id: company.id,
            name: company.name,
            email: company.email,
            totalPoints: company.totalPoints,
            totalCaloriesBurned: company.totalCaloriesBurned
          },
          proofsDeleted: proofs.length,
          eventRegistrationsDeleted: eventRegistrations.length,
          userDeleted: !!user,
          userEmail: user?.email
        }
      };
    } catch (error) {
      console.error('Error removing company:', error);
      return { 
        success: false, 
        message: `Failed to remove company: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Task operations
  async getAllTasks(): Promise<Task[]> {
    const db = await this.getDb();
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTaskById(id: string): Promise<Task | undefined> {
    const db = await this.getDb();
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(taskData: UpsertTask): Promise<Task> {
    const db = await this.getDb();
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<UpsertTask>): Promise<Task | undefined> {
    const db = await this.getDb();
    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    const db = await this.getDb();
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Proof operations
  async getProofsByCompany(companyId: string): Promise<TaskProof[]> {
    const db = await this.getDb();
    return await db.select().from(taskProofs).where(eq(taskProofs.companyId, companyId));
  }

  async getProofById(id: string): Promise<TaskProof | undefined> {
    const db = await this.getDb();
    const [proof] = await db.select().from(taskProofs).where(eq(taskProofs.id, id));
    return proof;
  }

  async getPendingProofs(): Promise<TaskProof[]> {
    const db = await this.getDb();
    return await db.select().from(taskProofs).where(eq(taskProofs.status, 'pending'));
  }

  async getAllProofs(): Promise<TaskProof[]> {
    const db = await this.getDb();
    return await db.select().from(taskProofs).orderBy(desc(taskProofs.submittedAt));
  }

  async createProof(proofData: UpsertTaskProof): Promise<TaskProof> {
    const db = await this.getDb();
    const [proof] = await db.insert(taskProofs).values(proofData).returning();
    return proof;
  }

  async updateProofStatus(
    id: string, 
    status: 'approved' | 'rejected', 
    adminNotes?: string
  ): Promise<TaskProof | undefined> {
    const db = await this.getDb();
    const [proof] = await db
      .update(taskProofs)
      .set({ 
        status, 
        adminNotes,
        reviewedAt: new Date()
      })
      .where(eq(taskProofs.id, id))
      .returning();
    return proof;
  }

  // Event operations
  async getAllEvents(): Promise<Event[]> {
    const db = await this.getDb();
    return await db.select().from(events).orderBy(desc(events.eventDate));
  }

  async getEventById(id: string): Promise<Event | undefined> {
    const db = await this.getDb();
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getActiveEvents(): Promise<Event[]> {
    const db = await this.getDb();
    const activeEvents = await db.select().from(events).where(eq(events.isActive, true)).orderBy(desc(events.eventDate));
    
    // Add registration counts to each event
    return Promise.all(activeEvents.map(async (event) => {
      const registrations = await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, event.id));
      return {
        ...event,
        totalRegistrations: registrations.length,
        approvedRegistrations: registrations.filter(r => r.status === 'approved').length,
        checkedInRegistrations: registrations.filter(r => r.checkedIn).length,
      } as any; // TypeScript workaround for adding dynamic fields
    }));
  }

  async createEvent(eventData: InsertEvent & { shortCode?: string }): Promise<Event> {
    const db = await this.getDb();
    
    // Normalize incoming values to satisfy DB constraints/types
    const normalized: any = { ...eventData };
    if (typeof (normalized as any).eventDate === 'string') {
      normalized.eventDate = new Date((normalized as any).eventDate);
    }
    if (normalized.youtubeUrl === '') normalized.youtubeUrl = null;
    if (normalized.description === undefined) normalized.description = null;
    if (normalized.emailSubject === undefined) normalized.emailSubject = null;
    if (normalized.emailBodyText === undefined) normalized.emailBodyText = null;

    // Generate unique short code with retry logic
    let shortCode = normalized.shortCode;
    if (!shortCode) {
      const { nanoid } = await import('nanoid');
      let attempts = 0;
      while (attempts < 10) {
        shortCode = nanoid(6).toUpperCase();
        const existing = await this.getEventByShortCode(shortCode);
        if (!existing) break;
        attempts++;
      }
      if (attempts === 10) {
        throw new Error('Failed to generate unique short code');
      }
    }
    
    const [event] = await db.insert(events).values({ ...normalized, shortCode }).returning();
    return event;
  }

  async getEventByShortCode(shortCode: string): Promise<Event | undefined> {
    const db = await this.getDb();
    const [event] = await db.select().from(events).where(eq(events.shortCode, shortCode));
    return event;
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const db = await this.getDb();
    const [event] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  // Event registration operations
  async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    const db = await this.getDb();
    return await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
  }

  async getEventRegistrationById(id: string): Promise<EventRegistration | undefined> {
    const db = await this.getDb();
    const [registration] = await db.select().from(eventRegistrations).where(eq(eventRegistrations.id, id));
    return registration;
  }

  async createEventRegistration(registrationData: InsertEventRegistration): Promise<EventRegistration> {
    const db = await this.getDb();
    const [registration] = await db.insert(eventRegistrations).values(registrationData).returning();
    return registration;
  }

  async updateRegistrationStatus(id: string, status: 'approved' | 'rejected'): Promise<EventRegistration | undefined> {
    const db = await this.getDb();
    const [registration] = await db
      .update(eventRegistrations)
      .set({ 
        status,
        approvedAt: status === 'approved' ? new Date() : null
      })
      .where(eq(eventRegistrations.id, id))
      .returning();
    return registration;
  }

  async checkInRegistration(id: string): Promise<EventRegistration | undefined> {
    const db = await this.getDb();
    const [registration] = await db
      .update(eventRegistrations)
      .set({ 
        checkedIn: true,
        checkedInAt: new Date()
      })
      .where(eq(eventRegistrations.id, id))
      .returning();
    return registration;
  }

  // Password reset operations
  async createPasswordResetToken(token: { userId: string; token: string; expiresAt: Date }): Promise<PasswordResetToken> {
    const db = await this.getDb();
    const result = await db.insert(passwordResetTokens).values(token).returning();
    return result[0];
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    const db = await this.getDb();
    const result = await db.select().from(passwordResetTokens).where(eq(passwordResetTokens.token, token)).limit(1);
    return result[0];
  }

  async markPasswordResetTokenAsUsed(id: string): Promise<void> {
    const db = await this.getDb();
    await db.update(passwordResetTokens)
      .set({ used: true })
      .where(eq(passwordResetTokens.id, id));
  }

  async updateUserPasswordForReset(userId: string, hashedPassword: string): Promise<void> {
    const db = await this.getDb();
    await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, userId));
  }
}

// In-memory storage for development/testing
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private companies: Map<string, Company> = new Map();
  private tasks: Map<string, Task> = new Map();
  private proofs: Map<string, TaskProof> = new Map();
  private events: Map<string, Event> = new Map();
  private eventRegistrations: Map<string, EventRegistration> = new Map();
  private passwordResetTokens: Map<string, PasswordResetToken> = new Map();

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(u => u.email === email);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    const user: User = {
      id: userData.id!,
      email: userData.email ?? null,
      password: userData.password ?? existingUser?.password ?? null,
      firstName: userData.firstName ?? null,
      lastName: userData.lastName ?? null,
      profileImageUrl: userData.profileImageUrl ?? null,
      isAdmin: userData.isAdmin ?? existingUser?.isAdmin ?? null,
      createdAt: existingUser?.createdAt ?? new Date(),
      updatedAt: new Date(),
    };
    this.users.set(userData.id!, user);
    return user;
  }

  async updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updated: User = {
      ...user,
      password: hashedPassword,
      updatedAt: new Date(),
    };
    this.users.set(id, updated);
    return updated;
  }

  async getAllAdmins(): Promise<User[]> {
    return Array.from(this.users.values()).filter(u => u.isAdmin === true);
  }

  async createAdmin(email: string, firstName: string, lastName: string, hashedPassword: string): Promise<User> {
    const id = `admin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const user: User = {
      id,
      email,
      firstName,
      lastName,
      password: hashedPassword,
      isAdmin: true,
      profileImageUrl: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.users.set(id, user);
    return user;
  }

  // Company operations
  async getCompany(id: string): Promise<Company | undefined> {
    return this.companies.get(id);
  }

  async getCompanyByUserId(userId: string): Promise<Company | undefined> {
    return Array.from(this.companies.values()).find(c => c.userId === userId);
  }

  async getAllCompanies(): Promise<Company[]> {
    return Array.from(this.companies.values()).sort((a, b) => (b.totalPoints ?? 0) - (a.totalPoints ?? 0));
  }

  async createCompany(companyData: UpsertCompany): Promise<Company> {
    const id = `company-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const company: Company = {
      id,
      name: companyData.name,
      email: companyData.email,
      contactPersonName: companyData.contactPersonName,
      phone: companyData.phone,
      logoUrl: companyData.logoUrl ?? null,
      brandingColor: companyData.brandingColor ?? null,
      totalPoints: companyData.totalPoints ?? null,
      totalCaloriesBurned: companyData.totalCaloriesBurned ?? null,
      dailyGoal: companyData.dailyGoal ?? null,
      teamSize: companyData.teamSize ?? null,
      userId: companyData.userId ?? null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    this.companies.set(id, company);
    return company;
  }

  async updateCompany(id: string, updates: Partial<UpsertCompany>): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (!company) return undefined;
    
    const updated: Company = {
      ...company,
      ...updates,
      updatedAt: new Date(),
    };
    this.companies.set(id, updated);
    return updated;
  }

  async updateCompanyPoints(id: string, pointsToAdd: number): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (!company) return undefined;
    
    const updated: Company = {
      ...company,
      totalPoints: (company.totalPoints ?? 0) + pointsToAdd,
      updatedAt: new Date(),
    };
    this.companies.set(id, updated);
    return updated;
  }

  async updateCompanyCalories(id: string, caloriesToAdd: number): Promise<Company | undefined> {
    const company = this.companies.get(id);
    if (!company) return undefined;
    
    const updated: Company = {
      ...company,
      totalCaloriesBurned: (company.totalCaloriesBurned ?? 0) + caloriesToAdd,
      updatedAt: new Date(),
    };
    this.companies.set(id, updated);
    return updated;
  }

  async removeCompany(id: string): Promise<{ success: boolean; message: string; deletedData?: any }> {
    try {
      // Get company details before deletion
      const company = this.companies.get(id);
      if (!company) {
        return { success: false, message: "Company not found" };
      }

      // Get related data for logging
      const proofs = await this.getProofsByCompany(id);
      const user = company.userId ? this.users.get(company.userId) : null;

      // Delete all proofs associated with this company
      for (const [proofId, proof] of this.proofs.entries()) {
        if (proof.companyId === id) {
          this.proofs.delete(proofId);
        }
      }

      // Delete the company
      this.companies.delete(id);

      // Optionally delete the associated user account
      if (company.userId && user) {
        this.users.delete(company.userId);
      }

      return {
        success: true,
        message: `Company "${company.name}" and all associated data have been successfully removed`,
        deletedData: {
          company: {
            id: company.id,
            name: company.name,
            email: company.email,
            totalPoints: company.totalPoints,
            totalCaloriesBurned: company.totalCaloriesBurned
          },
          proofsDeleted: proofs.length,
          eventRegistrationsDeleted: eventRegistrations.length,
          userDeleted: !!user,
          userEmail: user?.email
        }
      };
    } catch (error) {
      console.error('Error removing company:', error);
      return { 
        success: false, 
        message: `Failed to remove company: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  // Task operations
  async getAllTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values()).sort((a, b) => 
      (b.createdAt?.getTime() ?? 0) - (a.createdAt?.getTime() ?? 0)
    );
  }

  async getTaskById(id: string): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async createTask(taskData: UpsertTask): Promise<Task> {
    const id = `task-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const task: Task = {
      id,
      title: taskData.title,
      description: taskData.description ?? null,
      date: taskData.date ?? null,
      youtubeUrl: taskData.youtubeUrl ?? null,
      pointsReward: taskData.pointsReward ?? null,
      caloriesBurned: taskData.caloriesBurned ?? null,
      createdAt: new Date(),
    };
    this.tasks.set(id, task);
    return task;
  }

  async updateTask(id: string, updates: Partial<UpsertTask>): Promise<Task | undefined> {
    const task = this.tasks.get(id);
    if (!task) return undefined;
    
    const updated: Task = {
      ...task,
      ...updates,
    };
    this.tasks.set(id, updated);
    return updated;
  }

  async deleteTask(id: string): Promise<void> {
    this.tasks.delete(id);
  }

  // Proof operations
  async getProofsByCompany(companyId: string): Promise<TaskProof[]> {
    return Array.from(this.proofs.values()).filter(p => p.companyId === companyId);
  }

  async getProofById(id: string): Promise<TaskProof | undefined> {
    return this.proofs.get(id);
  }

  async getPendingProofs(): Promise<TaskProof[]> {
    return Array.from(this.proofs.values()).filter(p => p.status === 'pending');
  }

  async getAllProofs(): Promise<TaskProof[]> {
    return Array.from(this.proofs.values()).sort((a, b) => 
      (b.submittedAt?.getTime() ?? 0) - (a.submittedAt?.getTime() ?? 0)
    );
  }

  async createProof(proofData: UpsertTaskProof): Promise<TaskProof> {
    const id = `proof-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const proof: TaskProof = {
      id,
      taskId: proofData.taskId,
      companyId: proofData.companyId,
      contentUrls: proofData.contentUrls,
      contentType: proofData.contentType,
      status: proofData.status ?? 'pending',
      adminNotes: proofData.adminNotes ?? null,
      submittedAt: new Date(),
      reviewedAt: proofData.reviewedAt ?? null,
    };
    this.proofs.set(id, proof);
    return proof;
  }

  async updateProofStatus(
    id: string, 
    status: 'approved' | 'rejected', 
    adminNotes?: string
  ): Promise<TaskProof | undefined> {
    const proof = this.proofs.get(id);
    if (!proof) return undefined;
    
    const updated: TaskProof = {
      ...proof,
      status,
      adminNotes: adminNotes ?? null,
      reviewedAt: new Date(),
    };
    this.proofs.set(id, updated);
    return updated;
  }

  // Event operations
  async getAllEvents(): Promise<Event[]> {
    return Array.from(this.events.values()).sort(
      (a, b) => {
        const aTime = a.eventDate ? new Date(a.eventDate).getTime() : 0;
        const bTime = b.eventDate ? new Date(b.eventDate).getTime() : 0;
        return bTime - aTime;
      }
    );
  }

  async getEventById(id: string): Promise<Event | undefined> {
    return this.events.get(id);
  }

  async getActiveEvents(): Promise<Event[]> {
    const activeEvents = Array.from(this.events.values())
      .filter(event => event.isActive)
      .sort((a, b) => {
        const aTime = a.eventDate ? new Date(a.eventDate).getTime() : 0;
        const bTime = b.eventDate ? new Date(b.eventDate).getTime() : 0;
        return bTime - aTime;
      });
    
    // Add registration counts to each event
    return activeEvents.map(event => {
      const registrations = Array.from(this.eventRegistrations.values()).filter(r => r.eventId === event.id);
      return {
        ...event,
        totalRegistrations: registrations.length,
        approvedRegistrations: registrations.filter(r => r.status === 'approved').length,
        checkedInRegistrations: registrations.filter(r => r.checkedIn).length,
      } as any; // TypeScript workaround for adding dynamic fields
    });
  }

  async createEvent(eventData: InsertEvent & { shortCode?: string }): Promise<Event> {
    const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Generate unique short code for MemStorage
    let shortCode = eventData.shortCode;
    if (!shortCode) {
      const { nanoid } = await import('nanoid');
      shortCode = nanoid(6).toUpperCase();
    }
    const event: Event = {
      id,
      shortCode,
      title: eventData.title,
      description: eventData.description ?? null,
      youtubeUrl: eventData.youtubeUrl ?? null,
      eventDate: eventData.eventDate,
      brandingColor: eventData.brandingColor ?? "#211100",
      isActive: true,
      emailSubject: eventData.emailSubject ?? null,
      emailBodyText: eventData.emailBodyText ?? null,
      createdAt: new Date(),
    };
    this.events.set(id, event);
    return event;
  }

  async getEventByShortCode(shortCode: string): Promise<Event | undefined> {
    for (const event of Array.from(this.events.values())) {
      if (event.shortCode === shortCode) {
        return event;
      }
    }
    return undefined;
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const event = this.events.get(id);
    if (!event) return undefined;
    
    const updated: Event = {
      ...event,
      ...updates,
    };
    this.events.set(id, updated);
    return updated;
  }

  // Event registration operations
  async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    return Array.from(this.eventRegistrations.values()).filter(
      reg => reg.eventId === eventId
    );
  }

  async getEventRegistrationById(id: string): Promise<EventRegistration | undefined> {
    return this.eventRegistrations.get(id);
  }

  async createEventRegistration(registrationData: InsertEventRegistration): Promise<EventRegistration> {
    const id = `reg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const registration: EventRegistration = {
      id,
      eventId: registrationData.eventId,
      firstName: registrationData.firstName,
      lastName: registrationData.lastName,
      email: registrationData.email,
      phone: registrationData.phone,
      companyName: registrationData.companyName ?? null,
      status: 'pending',
      qrCode: null,
      qrCodePayload: null,
      qrCodeIssuedAt: null,
      checkedIn: false,
      checkedInAt: null,
      registeredAt: new Date(),
      approvedAt: null,
    };
    this.eventRegistrations.set(id, registration);
    return registration;
  }

  async updateRegistrationStatus(id: string, status: 'approved' | 'rejected'): Promise<EventRegistration | undefined> {
    const registration = this.eventRegistrations.get(id);
    if (!registration) return undefined;
    
    const updated: EventRegistration = {
      ...registration,
      status,
      approvedAt: status === 'approved' ? new Date() : null,
    };
    this.eventRegistrations.set(id, updated);
    return updated;
  }

  async checkInRegistration(id: string): Promise<EventRegistration | undefined> {
    const registration = this.eventRegistrations.get(id);
    if (!registration) return undefined;
    
    const updated: EventRegistration = {
      ...registration,
      checkedIn: true,
      checkedInAt: new Date(),
    };
    this.eventRegistrations.set(id, updated);
    return updated;
  }

  // Password reset operations
  async createPasswordResetToken(token: { userId: string; token: string; expiresAt: Date }): Promise<PasswordResetToken> {
    const resetToken: PasswordResetToken = {
      id: crypto.randomUUID(),
      userId: token.userId,
      token: token.token,
      expiresAt: token.expiresAt,
      used: false,
      createdAt: new Date(),
    };
    this.passwordResetTokens.set(resetToken.id, resetToken);
    return resetToken;
  }

  async getPasswordResetToken(token: string): Promise<PasswordResetToken | undefined> {
    for (const resetToken of Array.from(this.passwordResetTokens.values())) {
      if (resetToken.token === token) {
        return resetToken;
      }
    }
    return undefined;
  }

  async markPasswordResetTokenAsUsed(id: string): Promise<void> {
    const resetToken = this.passwordResetTokens.get(id);
    if (resetToken) {
      resetToken.used = true;
      this.passwordResetTokens.set(id, resetToken);
    }
  }

  async updateUserPasswordForReset(userId: string, hashedPassword: string): Promise<void> {
    const user = this.users.get(userId);
    if (user) {
      user.password = hashedPassword;
      user.updatedAt = new Date();
      this.users.set(userId, user);
    }
  }
}

// Use real database in all environments for data persistence
// To use in-memory storage for testing, set USE_DEV_STORAGE=true
const USE_MEM_STORAGE = process.env.USE_DEV_STORAGE === 'true';
const storageMode = USE_MEM_STORAGE ? 'MemStorage (Testing)' : 'DatabaseStorage (Persistent)';
console.log(`🔧 Storage mode: ${storageMode}`);
export const storage: IStorage = USE_MEM_STORAGE ? new MemStorage() : new DatabaseStorage();
