import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Check for required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_API_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_API_KEY environment variables are required');
  process.exit(1);
}

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_API_KEY;

// Initialize Supabase client
console.log('Creating Supabase client with provided credentials...');
const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection by making a simple query
const testConnection = async () => {
  try {
    // First attempt to query a table that might exist
    // If this fails, we'll show a warning but not crash the application
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      // If we get a specific error about relation not existing, the connection is likely fine
      // but the table doesn't exist yet
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('Supabase connection successful, but "users" table does not exist yet.');
        console.log('This is normal if you haven\'t created any tables yet.');
      } else {
        console.warn('Supabase query failed:', error.message);
      }
    } else {
      console.log('Supabase connection and query successful!');
    }
  } catch (err) {
    const error = err as Error;
    console.warn('Supabase connection test failed with exception:', error?.message || 'Unknown error');
  }
};

// Run connection test but don't block the export
testConnection();

// Export the client for use in other modules
export default supabase;