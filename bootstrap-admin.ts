#!/usr/bin/env tsx
/**
 * Bootstrap Admin Account Creator
 * 
 * This script creates an admin account in the production database.
 * Run this ONCE on your published Repl to create the first admin account.
 * 
 * Usage: tsx bootstrap-admin.ts
 */

import { DatabaseStorage } from './server/storage';
import dotenv from 'dotenv';

dotenv.config();

async function bootstrapAdmin() {
  try {
    const storage = new DatabaseStorage();
    
    const adminEmail = 'admin@curacaointernationalsportsweek.com';
    const adminPassword = 'Admin2024!';
    
    console.log('🔍 Checking for existing admin account...');
    
    // Check if admin already exists
    const existingAdmin = await storage.getUserByEmail(adminEmail);
    if (existingAdmin) {
      console.log('✅ Admin account already exists!');
      console.log('📧 Email:', adminEmail);
      console.log('🔑 Password: Admin2024!');
      console.log('\n✨ You can now log in at /login');
      return;
    }
    
    console.log('🔨 Creating admin account...');
    
    // Create new admin
    await storage.createAdmin({
      email: adminEmail,
      password: adminPassword,
      firstName: 'Admin',
      lastName: 'User'
    });
    
    console.log('\n✅ Admin account created successfully!');
    console.log('━'.repeat(50));
    console.log('📧 Email:', adminEmail);
    console.log('🔑 Password:', adminPassword);
    console.log('━'.repeat(50));
    console.log('\n✨ You can now log in at /login');
    console.log('💡 After logging in, you can create more admins from the Administrators page');
    
  } catch (error: any) {
    console.error('\n❌ Error creating admin:', error.message);
    console.error('\nFull error:', error);
    process.exit(1);
  }
}

bootstrapAdmin();
