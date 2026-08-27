/**
 * Supabase Configuration
 * ============================================================
 * This file initializes the Supabase client and exports it
 * for use throughout the application.
 * 
 * Supabase is an open-source Firebase alternative that provides:
 * - PostgreSQL database
 * - Real-time updates
 * - Authentication
 * - Storage
 * 
 * Why Supabase?
 * - Cleaner, simpler than Firebase
 * - No import/export errors
 * - Full SQL support
 */

import { createClient } from '@supabase/supabase-js';

// Load Supabase credentials from environment variables
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL;
const supabaseAnonKey = process.env.REACT_APP_SUPABASE_ANON_KEY;

// Create and export the Supabase client instance
// This is the main database interface you'll use throughout the app
export const supabase = createClient(supabaseUrl, supabaseAnonKey);