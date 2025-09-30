import { 
  type User, 
  type UpsertUser,
  type Company,
  type UpsertCompany,
  type Task,
  type UpsertTask,
  type TaskProof,
  type UpsertTaskProof,
  users,
  companies,
  tasks,
  taskProofs
} from "@shared/schema";
import { db } from "./db";
import { eq, desc, sql } from "drizzle-orm";

// Interface for storage operations
export interface IStorage {
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
  
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
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
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
}

// In-memory storage for development/testing
export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private companies: Map<string, Company> = new Map();
  private tasks: Map<string, Task> = new Map();
  private proofs: Map<string, TaskProof> = new Map();

  // User operations
  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const existingUser = this.users.get(userData.id!);
    const user: User = {
      id: userData.id!,
      email: userData.email ?? null,
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
      videoUrl: taskData.videoUrl ?? null,
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
}

// Use in-memory storage in dev mode by default (aligns with fullstack_js guidelines)
// In development: defaults to MemStorage unless USE_DEV_STORAGE=false
// In production: always uses DatabaseStorage
const DEV_MODE = process.env.NODE_ENV === 'development' && process.env.USE_DEV_STORAGE !== 'false';
const storageMode = DEV_MODE ? 'MemStorage (Dev)' : 'DatabaseStorage (Production)';
console.log(`🔧 Storage mode: ${storageMode}`);
export const storage: IStorage = DEV_MODE ? new MemStorage() : new DatabaseStorage();
