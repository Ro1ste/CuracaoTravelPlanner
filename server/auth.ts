import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import type { Request, Response, NextFunction } from 'express';
import { storage } from './storage';

// JWT configuration
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = '7d';

export interface AuthUser {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  isAdmin: boolean;
}

export interface JWTPayload {
  userId: string;
  email: string;
  isAdmin: boolean;
  iat?: number;
  exp?: number;
}

// Generate JWT token
export function generateToken(user: AuthUser): string {
  const payload: JWTPayload = {
    userId: user.id,
    email: user.email,
    isAdmin: user.isAdmin,
  };
  
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
}

// Verify JWT token
export function verifyToken(token: string): JWTPayload | null {
  try {
    return jwt.verify(token, JWT_SECRET) as JWTPayload;
  } catch (error) {
    return null;
  }
}

// Authentication middleware
export const isAuthenticated = async (req: Request, res: Response, next: NextFunction) => {
  try {
    // Try to get token from cookie first, then from Authorization header as fallback
    let token = (req as any).cookies?.auth_token;
    
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.substring(7); // Remove 'Bearer ' prefix
      }
    }
    
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    
    const payload = verifyToken(token);
    
    if (!payload) {
      return res.status(401).json({ message: 'Invalid token' });
    }
    
    // Handle different token payload structures
    const userId = payload.userId || payload.id;
    
    if (!userId) {
      return res.status(401).json({ message: 'Invalid token payload' });
    }
    
    // Get user from database to ensure they still exist
    const user = await storage.getUser(userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    
    // Add user to request object
    (req as any).user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin || false,
    };
    
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    return res.status(401).json({ message: 'Authentication failed' });
  }
};

// Admin authorization middleware
export const isAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user || !user.isAdmin) {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
};

// Login function
export async function loginUser(email: string, password: string): Promise<{ user: AuthUser; token: string } | null> {
  try {
    const user = await storage.getUserByEmail(email);
    
    if (!user || !user.password) {
      return null;
    }
    
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      return null;
    }
    
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin || false,
    };
    
    const token = generateToken(authUser);
    
    return { user: authUser, token };
  } catch (error) {
    console.error('Login error:', error);
    return null;
  }
}

// Register function
export async function registerUser(userData: {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  isAdmin?: boolean;
}): Promise<{ user: AuthUser; token: string } | null> {
  try {
    // Check if user already exists
    const existingUser = await storage.getUserByEmail(userData.email);
    if (existingUser) {
      return null;
    }
    
    // Hash password
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    // Create user
    const user = await storage.upsertUser({
      email: userData.email,
      password: hashedPassword,
      firstName: userData.firstName,
      lastName: userData.lastName,
      isAdmin: userData.isAdmin || false,
    });
    
    const authUser: AuthUser = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      isAdmin: user.isAdmin || false,
    };
    
    const token = generateToken(authUser);
    
    return { user: authUser, token };
  } catch (error) {
    console.error('Registration error:', error);
    return null;
  }
}

// Logout function (client-side token removal)
export function logoutUser(): void {
  // JWT tokens are stateless, so logout is handled client-side
  // by removing the token from storage
  console.log('User logged out (token removed from client)');
}
