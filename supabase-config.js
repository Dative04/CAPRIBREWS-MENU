const supabaseUrl = 'https://ibvhxussfwlnllmzppnv.supabase.co'; 
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlidmh4dXNzZndsbmxsbXpwcG52Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzcwMzMwOTMsImV4cCI6MjA5MjYwOTA5M30.V6ohr06gkla9YwpjBcwIqeIT1eJc7bCsWEyL0PsQ7GU'; 

// Check if it already exists to avoid the 'already declared' error 
if (!window.supabaseClient) { 
    // The 'supabase' variable comes from the CDN script
    window.supabaseClient = supabase.createClient(supabaseUrl, supabaseKey); 
}
