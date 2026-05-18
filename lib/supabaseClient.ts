import { createClient } from '@supabase/supabase-js';

// Central configuration for API keys and feature flags
const SUPABASE_URL = 'https://heliemugpbhlyzbagnrp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhlbGllbXVncGJobHl6YmFnbnJwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzkxMTk1MDQsImV4cCI6MjA5NDY5NTUwNH0.rVj51qjZXA7D5uZclj5Cd2dD1rFZ3rWSIX7jKDliTLQ';


if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error("Supabase URL and Anon Key must be provided.");
}

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);