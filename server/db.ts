import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { users, students, exams, results, passwordResetTokens } from '../shared/schema.js';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Create the connection
const connectionString = process.env.DATABASE_URL;
const client = postgres(connectionString);
export const db = drizzle(client);

// Export tables for easy access
export { users, students, exams, results, passwordResetTokens };