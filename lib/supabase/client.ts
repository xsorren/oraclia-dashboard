import { Database } from '@/types/database';
import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  return createBrowserClient<Database>(
    'https://ztfjongqrnrvdrdlfsmc.supabase.co',
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp0Zmpvbmdxcm5ydmRyZGxmc21jIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTcwOTU5MTcsImV4cCI6MjA3MjY3MTkxN30.0q4K_-EiwljAg5_MnHIxxSRu6kYUV7jp8gqEnwm113M'
  );
}
