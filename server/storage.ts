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
  users,
  companies,
  tasks,
  taskProofs,
  events,
  eventRegistrations
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  updateUserPassword(id: string, hashedPassword: string): Promise<User | undefined>;
  
  // Company operations
  getCompany(id: string): Promise<Company | undefined>;
  getCompanyByUserId(userId: string): Promise<Company | undefined>;
  getAllCompanies(): Promise<Company[]>;
  createCompany(company: UpsertCompany): Promise<Company>;
  updateCompany(id: string, updates: Partial<UpsertCompany>): Promise<Company | undefined>;
  updateCompanyPoints(id: string, pointsToAdd: number): Promise<Company | undefined>;
  
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
  updateProofContent(id: string, contentUrl: string): Promise<TaskProof | undefined>;
  
  // Event operations
  getAllEvents(): Promise<Event[]>;
  getEventById(id: string): Promise<Event | undefined>;
  getActiveEvents(): Promise<Event[]>;
  createEvent(event: InsertEvent): Promise<Event>;
  updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined>;
  
  // Event registration operations
  getEventRegistrations(eventId: string): Promise<EventRegistration[]>;
  getEventRegistrationById(id: string): Promise<EventRegistration | undefined>;
  createEventRegistration(registration: InsertEventRegistration): Promise<EventRegistration>;
  updateRegistrationStatus(id: string, status: 'approved' | 'rejected'): Promise<EventRegistration | undefined>;
  checkInRegistration(id: string): Promise<EventRegistration | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
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

  // Company operations
  async getCompany(id: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.id, id));
    return company;
  }

  async getCompanyByUserId(userId: string): Promise<Company | undefined> {
    const [company] = await db.select().from(companies).where(eq(companies.userId, userId));
    return company;
  }

  async getAllCompanies(): Promise<Company[]> {
    return await db.select().from(companies).orderBy(desc(companies.totalPoints));
  }

  async createCompany(companyData: UpsertCompany): Promise<Company> {
    const [company] = await db.insert(companies).values(companyData).returning();
    return company;
  }

  async updateCompany(id: string, updates: Partial<UpsertCompany>): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  async updateCompanyPoints(id: string, pointsToAdd: number): Promise<Company | undefined> {
    const [company] = await db
      .update(companies)
      .set({ 
        totalPoints: sql`${companies.totalPoints} + ${pointsToAdd}`,
        updatedAt: new Date() 
      })
      .where(eq(companies.id, id))
      .returning();
    return company;
  }

  // Task operations
  async getAllTasks(): Promise<Task[]> {
    return await db.select().from(tasks).orderBy(desc(tasks.createdAt));
  }

  async getTaskById(id: string): Promise<Task | undefined> {
    const [task] = await db.select().from(tasks).where(eq(tasks.id, id));
    return task;
  }

  async createTask(taskData: UpsertTask): Promise<Task> {
    const [task] = await db.insert(tasks).values(taskData).returning();
    return task;
  }

  async updateTask(id: string, updates: Partial<UpsertTask>): Promise<Task | undefined> {
    const [task] = await db
      .update(tasks)
      .set(updates)
      .where(eq(tasks.id, id))
      .returning();
    return task;
  }

  async deleteTask(id: string): Promise<void> {
    await db.delete(tasks).where(eq(tasks.id, id));
  }

  // Proof operations
  async getProofsByCompany(companyId: string): Promise<TaskProof[]> {
    return await db.select().from(taskProofs).where(eq(taskProofs.companyId, companyId));
  }

  async getProofById(id: string): Promise<TaskProof | undefined> {
    const [proof] = await db.select().from(taskProofs).where(eq(taskProofs.id, id));
    return proof;
  }

  async getPendingProofs(): Promise<TaskProof[]> {
    return await db.select().from(taskProofs).where(eq(taskProofs.status, 'pending'));
  }

  async getAllProofs(): Promise<TaskProof[]> {
    return await db.select().from(taskProofs).orderBy(desc(taskProofs.submittedAt));
  }

  async createProof(proofData: UpsertTaskProof): Promise<TaskProof> {
    const [proof] = await db.insert(taskProofs).values(proofData).returning();
    return proof;
  }

  async updateProofStatus(
    id: string, 
    status: 'approved' | 'rejected', 
    adminNotes?: string
  ): Promise<TaskProof | undefined> {
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

  async updateProofContent(id: string, contentUrl: string): Promise<TaskProof | undefined> {
    const [proof] = await db
      .update(taskProofs)
      .set({ contentUrl })
      .where(eq(taskProofs.id, id))
      .returning();
    return proof;
  }

  // Event operations
  async getAllEvents(): Promise<Event[]> {
    return await db.select().from(events).orderBy(desc(events.eventDate));
  }

  async getEventById(id: string): Promise<Event | undefined> {
    const [event] = await db.select().from(events).where(eq(events.id, id));
    return event;
  }

  async getActiveEvents(): Promise<Event[]> {
    return await db.select().from(events).where(eq(events.isActive, true)).orderBy(desc(events.eventDate));
  }

  async createEvent(eventData: InsertEvent): Promise<Event> {
    const [event] = await db.insert(events).values(eventData).returning();
    return event;
  }

  async updateEvent(id: string, updates: Partial<InsertEvent>): Promise<Event | undefined> {
    const [event] = await db
      .update(events)
      .set(updates)
      .where(eq(events.id, id))
      .returning();
    return event;
  }

  // Event registration operations
  async getEventRegistrations(eventId: string): Promise<EventRegistration[]> {
    return await db.select().from(eventRegistrations).where(eq(eventRegistrations.eventId, eventId));
  }

  async getEventRegistrationById(id: string): Promise<EventRegistration | undefined> {
    const [registration] = await db.select().from(eventRegistrations).where(eq(eventRegistrations.id, id));
    return registration;
  }

  async createEventRegistration(registrationData: InsertEventRegistration): Promise<EventRegistration> {
    const [registration] = await db.insert(eventRegistrations).values(registrationData).returning();
    return registration;
  }

  async updateRegistrationStatus(id: string, status: 'approved' | 'rejected'): Promise<EventRegistration | undefined> {
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
}

// In-memory storage for development/testing
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private companies: Map<string, Company> = new Map();
  private tasks: Map<string, Task> = new Map();
  private proofs: Map<string, TaskProof> = new Map();
  private events: Map<string, Event> = new Map();
  private eventRegistrations: Map<string, EventRegistration> = new Map();

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
      contentUrl: proofData.contentUrl,
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

  async updateProofContent(id: string, contentUrl: string): Promise<TaskProof | undefined> {
    const proof = this.proofs.get(id);
    if (!proof) return undefined;
    
    const updated: TaskProof = {
      ...proof,
      contentUrl,
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

  async createEvent(eventData: InsertEvent): Promise<Event> {
    const id = `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const event: Event = {
      id,
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
}

// Use in-memory storage in dev mode by default (aligns with fullstack_js guidelines)
// In development: defaults to MemStorage unless USE_DEV_STORAGE=false
// In production: always uses DatabaseStorage
const DEV_MODE = process.env.NODE_ENV === 'development' && process.env.USE_DEV_STORAGE !== 'false';
const storageMode = DEV_MODE ? 'MemStorage (Dev)' : 'DatabaseStorage (Production)';
console.log(`🔧 Storage mode: ${storageMode}`);
export const storage: IStorage = DEV_MODE ? new MemStorage() : new DatabaseStorage();
