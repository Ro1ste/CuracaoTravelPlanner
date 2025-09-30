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
}

export const storage = new DatabaseStorage();
