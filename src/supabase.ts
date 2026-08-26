import { createClient } from '@supabase/supabase-js';

const supabaseUrl =
  import.meta.env.VITE_SUPABASE_URL || 'https://jpdqaawqztrmqwkwrrin.supabase.co';
const supabaseAnonKey =
  import.meta.env.VITE_SUPABASE_ANON_KEY ||
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpwZHFhYXdxenRybXF3a3dycmluIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc3MjQ1MzIsImV4cCI6MjEwMzMwMDUzMn0.-pW3ZJedOiatTFeMfQwWGnIUXLI-Hj_OsBv8L40BSyY';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);
