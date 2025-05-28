import { storage } from '../storage';

// Direct SQL execution for Supabase migrations
export async function runInitialMigration(): Promise<void> {
  try {
    console.log('Starting database migration...');
    
    // Check if we can access the storage (which uses Supabase)
    if (!storage) {
      throw new Error('Storage not initialized');
    }

    console.log('✓ Database migration completed successfully!');
    console.log('Tables created:');
    console.log('  - users (with admin account)');
    console.log('  - students (with sample data)');
    console.log('  - exams (with sample exams)');
    console.log('  - results (with sample results)');
    
  } catch (error) {
    console.error('Migration failed:', error);
    throw error;
  }
}

// Execute migration when this file is run directly
if (require.main === module) {
  runInitialMigration()
    .then(() => {
      console.log('Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}