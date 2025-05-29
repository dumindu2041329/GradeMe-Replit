import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

// Check for required environment variables
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('Error: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables are required');
  process.exit(1);
}

// Get Supabase credentials from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Initialize Supabase client
console.log('Creating Supabase client with provided credentials...');
const supabase = createClient(supabaseUrl, supabaseKey);

// Test the connection
const testConnection = async () => {
  try {
    console.log('Testing Supabase connection...');
    const { data, error } = await supabase.from('users').select('*').limit(1);
    
    if (error) {
      if (error.message.includes('relation') && error.message.includes('does not exist')) {
        console.log('✓ Supabase connection successful! Tables need to be created.');
      } else {
        console.warn('Supabase connection issue:', error.message);
      }
    } else {
      console.log('✓ Supabase connection and database access successful!');
    }
  } catch (err) {
    const error = err as Error;
    console.warn('Supabase connection test failed:', error?.message || 'Unknown error');
  }
};

// Run connection test
testConnection();

// Export the client for use in other modules
export default supabase;