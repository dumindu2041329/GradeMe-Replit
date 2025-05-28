import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Migration runner for Supabase database
export class MigrationRunner {
  private supabase;

  constructor() {
    const supabaseUrl = process.env.DATABASE_URL?.replace('postgresql://', '')?.split('@')[1]?.split('/')[0];
    const supabaseKey = process.env.SUPABASE_ANON_KEY || 'your-anon-key';
    
    if (!process.env.DATABASE_URL) {
      throw new Error('DATABASE_URL is required for migrations');
    }

    // Create Supabase client using the database URL
    this.supabase = createClient(`https://${supabaseUrl}`, supabaseKey);
  }

  async runMigration(migrationFile: string): Promise<boolean> {
    try {
      console.log(`Running migration: ${migrationFile}`);
      
      // Read the migration file
      const migrationPath = path.join(__dirname, migrationFile);
      const migrationSQL = fs.readFileSync(migrationPath, 'utf8');
      
      // Split the SQL into individual statements
      const statements = migrationSQL
        .split(';')
        .map(stmt => stmt.trim())
        .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));

      // Execute each statement
      for (const statement of statements) {
        if (statement.trim()) {
          const { error } = await this.supabase.rpc('exec_sql', { sql: statement });
          
          if (error) {
            console.error(`Error executing statement: ${statement.substring(0, 100)}...`);
            console.error('Error details:', error);
            return false;
          }
        }
      }

      console.log(`✓ Migration ${migrationFile} completed successfully`);
      return true;
    } catch (error) {
      console.error(`Failed to run migration ${migrationFile}:`, error);
      return false;
    }
  }

  async runAllMigrations(): Promise<void> {
    try {
      console.log('Starting database migrations...');
      
      // Get all migration files
      const migrationFiles = fs.readdirSync(__dirname)
        .filter(file => file.endsWith('.sql'))
        .sort();

      for (const file of migrationFiles) {
        const success = await this.runMigration(file);
        if (!success) {
          throw new Error(`Migration ${file} failed`);
        }
      }

      console.log('✓ All migrations completed successfully!');
    } catch (error) {
      console.error('Migration process failed:', error);
      throw error;
    }
  }
}

// Run migrations if this file is executed directly
if (require.main === module) {
  const runner = new MigrationRunner();
  runner.runAllMigrations()
    .then(() => {
      console.log('Database setup complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Database setup failed:', error);
      process.exit(1);
    });
}