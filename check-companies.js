// Check existing companies in the database
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bdfyyeuucanzdziikdma.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkZnl5ZXV1Y2FuemR6aWlrZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTc3OTksImV4cCI6MjA3NTI5Mzc5OX0.rKifnI2jLXBnwHQy4sMk5tTLtOzx2_zLfsSQ6FbcLzU';
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function checkCompanies() {
  console.log('🏢 Checking existing companies...\n');

  try {
    // Check users table
    const { data: users, error: usersError } = await supabase
      .from('users')
      .select('*')
      .limit(10);

    if (usersError) {
      console.log('❌ Error fetching users:', usersError.message);
    } else {
      console.log('👥 Users in database:');
      users?.forEach(user => {
        console.log(`   - ${user.email} (ID: ${user.id}, Admin: ${user.isAdmin})`);
      });
    }

    // Check companies table
    const { data: companies, error: companiesError } = await supabase
      .from('companies')
      .select('*')
      .limit(10);

    if (companiesError) {
      console.log('❌ Error fetching companies:', companiesError.message);
    } else {
      console.log('\n🏢 Companies in database:');
      companies?.forEach(company => {
        console.log(`   - ${company.name} (${company.email}) - Points: ${company.totalPoints || 0}`);
      });
    }

    // Try different email formats for testing
    console.log('\n🧪 Testing different email formats...');
    const testEmails = [
      'company3@test.com',
      'company3@example.org',
      'test@company3.com'
    ];

    for (const email of testEmails) {
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: email,
          password: 'testpass123'
        });

        if (!error) {
          console.log(`✅ Login successful with: ${email}`);
          break;
        } else {
          console.log(`❌ Login failed with: ${email} - ${error.message}`);
        }
      } catch (err) {
        console.log(`❌ Error testing: ${email} - ${err.message}`);
      }
    }

  } catch (error) {
    console.error('❌ Check error:', error);
  }
}

checkCompanies();
