import { type User, type UpsertUser } from "@shared/schema";
import { randomUUID } from "crypto";

// Interface for storage operations
export interface IStorage {
  // User operations - required for Replit Auth
  getUser(id: string): Promise<User | undefined>;
  upsertUser(user: UpsertUser): Promise<User>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;

  constructor() {
    this.users = new Map();
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const id = userData.id || randomUUID();
    const now = new Date();
    
    const existingUser = this.users.get(id);
    const user: User = {
      id,
      email: userData.email || existingUser?.email || null,
      firstName: userData.firstName || existingUser?.firstName || null,
      lastName: userData.lastName || existingUser?.lastName || null,
      profileImageUrl: userData.profileImageUrl || existingUser?.profileImageUrl || null,
      isAdmin: userData.isAdmin ?? existingUser?.isAdmin ?? false,
      createdAt: existingUser?.createdAt || now,
      updatedAt: now,
    };
    
    this.users.set(id, user);
    return user;
  }
}

export const storage = new MemStorage();
