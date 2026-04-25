// Supabase configuration for Capibrews
const supabaseUrl = 'https://ibvhxussfwlnllmzppnv.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlidmh4dXNzZndsbmxsbXpwcG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzMwOTMsImV4cCI6MjA5MjYwOTA5M30.V6ohr06gkla9YwpjBcwIqeIT1eJc7bCsWEyL0PsQ7GU';

// Initialize the Supabase client
// The Supabase library from CDN exposes 'supabase' globally
const supabaseClient = supabase.createClient(supabaseUrl, supabaseKey);

// We'll name it supabaseClient to avoid confusion if 'supabase' is used elsewhere, 
// but we can also export it as 'supabase' if preferred.
// For now, let's stick to 'supabase' as requested by the user's snippet.
const supabase = supabaseClient;
