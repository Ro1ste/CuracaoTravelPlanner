import { createClient } from '@supabase/supabase-js';

// Hardcoded Supabase credentials for production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bdfyyeuucanzdziikdma.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJkZnl5ZXV1Y2FuemR6aWlrZG1hIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk3MTc3OTksImV4cCI6MjA3NTI5Mzc5OX0.rKifnI2jLXBnwHQy4sMk5tTLtOzx2_zLfsSQ6FbcLzU';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


