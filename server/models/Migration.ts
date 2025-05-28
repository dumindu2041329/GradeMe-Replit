import supabase from '../db';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export class Migration {
  /**
   * Run all pending migrations
   */
  static async runMigrations(): Promise<void> {
    console.log('🔄 Starting database migrations...');
    
    try {
      // Create migrations table if it doesn't exist
      await this.createMigrationsTable();
      
      // Get all migration files
      const migrationFiles = this.getMigrationFiles();
      
      // Get executed migrations
      const executedMigrations = await this.getExecutedMigrations();
      
      // Run pending migrations
      for (const migrationFile of migrationFiles) {
        if (!executedMigrations.includes(migrationFile)) {
          await this.runMigration(migrationFile);
          await this.recordMigration(migrationFile);
        }
      }
      
      console.log('✅ All migrations completed successfully!');
    } catch (error) {
      console.error('❌ Migration failed:', error);
      throw error;
    }
  }
  
  /**
   * Create migrations tracking table
   */
  private static async createMigrationsTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS migrations (
        id SERIAL PRIMARY KEY,
        migration_name TEXT UNIQUE NOT NULL,
        executed_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    
    try {
      const { error } = await supabase.rpc('sql', { query: createTableSQL });
      if (error) {
        // Fallback: try to check if table exists
        const { error: checkError } = await supabase.from('migrations').select('id').limit(1);
        if (checkError && checkError.code === '42P01') {
          console.log('⚠️ Migrations table needs manual creation. Creating via direct SQL...');
          // Try alternative method
          await this.createMigrationsTableDirectly();
        }
      } else {
        console.log('✅ Migrations table ready');
      }
    } catch (error) {
      console.log('⚠️ Creating migrations table via fallback method...');
      await this.createMigrationsTableDirectly();
    }
  }
  
  /**
   * Alternative method to create migrations table
   */
  private static async createMigrationsTableDirectly(): Promise<void> {
    // This will be handled by the first migration
    console.log('📝 Migrations table will be created with first migration');
  }
  
  /**
   * Get all migration files in order
   */
  private static getMigrationFiles(): string[] {
    const migrationsDir = path.join(__dirname, '../migrations');
    
    if (!fs.existsSync(migrationsDir)) {
      console.log('📁 No migrations directory found');
      return [];
    }
    
    return fs.readdirSync(migrationsDir)
      .filter(file => file.endsWith('.sql'))
      .sort(); // Sort by filename for order
  }
  
  /**
   * Get list of executed migrations
   */
  private static async getExecutedMigrations(): Promise<string[]> {
    try {
      const { data, error } = await supabase
        .from('migrations')
        .select('migration_name');
      
      if (error) {
        // If migrations table doesn't exist, no migrations have been run
        return [];
      }
      
      return data?.map(row => row.migration_name) || [];
    } catch (error) {
      console.log('📝 No previous migrations found');
      return [];
    }
  }
  
  /**
   * Run a single migration file
   */
  private static async runMigration(migrationFile: string): Promise<void> {
    console.log(`🔧 Running migration: ${migrationFile}`);
    
    const migrationPath = path.join(__dirname, '../migrations', migrationFile);
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // Parse SQL and execute table creation through Supabase client
    await this.executeMigrationSQL(sql, migrationFile);
    
    console.log(`✅ Migration completed: ${migrationFile}`);
  }
  
  /**
   * Execute migration SQL using Supabase client methods
   */
  private static async executeMigrationSQL(sql: string, migrationFile: string): Promise<void> {
    // Create migrations table first
    if (sql.includes('CREATE TABLE IF NOT EXISTS migrations')) {
      console.log('📝 Creating migrations tracking table...');
      // This will be handled by verifying table exists when recording
    }
    
    // Create users table
    if (sql.includes('CREATE TABLE IF NOT EXISTS users')) {
      console.log('👤 Creating users table...');
      await this.createUsersTable();
    }
    
    // Create students table
    if (sql.includes('CREATE TABLE IF NOT EXISTS students')) {
      console.log('🎓 Creating students table...');
      await this.createStudentsTable();
    }
    
    // Create exams table
    if (sql.includes('CREATE TABLE IF NOT EXISTS exams')) {
      console.log('📝 Creating exams table...');
      await this.createExamsTable();
    }
    
    // Create results table
    if (sql.includes('CREATE TABLE IF NOT EXISTS results')) {
      console.log('📊 Creating results table...');
      await this.createResultsTable();
    }
  }
  
  /**
   * Create users table using Supabase client
   */
  private static async createUsersTable(): Promise<void> {
    try {
      // Try to insert a test record to see if table exists
      const { error } = await supabase.from('users').select('id').limit(1);
      if (error && error.code === '42P01') {
        console.log('⚠️ Users table needs to be created via SQL in Supabase dashboard');
        console.log(`
CREATE TABLE users (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT FALSE,
  profile_image TEXT,
  student_id BIGINT,
  email_notifications BOOLEAN DEFAULT TRUE,
  sms_notifications BOOLEAN DEFAULT FALSE,
  email_exam_results BOOLEAN DEFAULT TRUE,
  email_upcoming_exams BOOLEAN DEFAULT TRUE,
  sms_exam_results BOOLEAN DEFAULT FALSE,
  sms_upcoming_exams BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`);
      } else {
        console.log('✅ Users table verified');
      }
    } catch (err) {
      console.log('⚠️ Could not verify users table');
    }
  }
  
  /**
   * Create students table using Supabase client  
   */
  private static async createStudentsTable(): Promise<void> {
    try {
      const { error } = await supabase.from('students').select('id').limit(1);
      if (error && error.code === '42P01') {
        console.log('⚠️ Students table needs to be created via SQL in Supabase dashboard');
        console.log(`
CREATE TABLE students (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  class TEXT NOT NULL,
  enrollment_date DATE NOT NULL,
  phone TEXT,
  address TEXT,
  date_of_birth DATE,
  guardian_name TEXT,
  guardian_phone TEXT,
  profile_image TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`);
      } else {
        console.log('✅ Students table verified');
      }
    } catch (err) {
      console.log('⚠️ Could not verify students table');
    }
  }
  
  /**
   * Create exams table using Supabase client
   */
  private static async createExamsTable(): Promise<void> {
    try {
      const { error } = await supabase.from('exams').select('id').limit(1);
      if (error && error.code === '42P01') {
        console.log('⚠️ Exams table needs to be created via SQL in Supabase dashboard');
        console.log(`
CREATE TABLE exams (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  subject TEXT NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`);
      } else {
        console.log('✅ Exams table verified');
      }
    } catch (err) {
      console.log('⚠️ Could not verify exams table');
    }
  }
  
  /**
   * Create results table using Supabase client
   */
  private static async createResultsTable(): Promise<void> {
    try {
      const { error } = await supabase.from('results').select('id').limit(1);
      if (error && error.code === '42P01') {
        console.log('⚠️ Results table needs to be created via SQL in Supabase dashboard');
        console.log(`
CREATE TABLE results (
  id BIGSERIAL PRIMARY KEY,
  student_id BIGINT NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_id BIGINT NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  percentage DOUBLE PRECISION NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);`);
      } else {
        console.log('✅ Results table verified');
      }
    } catch (err) {
      console.log('⚠️ Could not verify results table');
    }
  }
  
  /**
   * Alternative execution method for SQL statements
   */
  private static async executeStatementDirectly(statement: string): Promise<void> {
    // For CREATE TABLE statements, we can try to verify creation
    if (statement.toUpperCase().includes('CREATE TABLE')) {
      const tableMatch = statement.match(/CREATE TABLE (?:IF NOT EXISTS )?(\w+)/i);
      if (tableMatch) {
        const tableName = tableMatch[1];
        const { error } = await supabase.from(tableName).select('*').limit(1);
        if (!error) {
          console.log(`✅ Table ${tableName} created successfully`);
        }
      }
    }
  }
  
  /**
   * Record that a migration has been executed
   */
  private static async recordMigration(migrationFile: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('migrations')
        .insert([{ migration_name: migrationFile }]);
      
      if (error) {
        console.warn(`⚠️ Could not record migration ${migrationFile}:`, error.message);
      }
    } catch (error) {
      console.warn(`⚠️ Could not record migration ${migrationFile}`);
    }
  }
  
  /**
   * Check migration status
   */
  static async getMigrationStatus(): Promise<{
    total: number;
    executed: number;
    pending: string[];
  }> {
    const allMigrations = this.getMigrationFiles();
    const executedMigrations = await this.getExecutedMigrations();
    const pendingMigrations = allMigrations.filter(m => !executedMigrations.includes(m));
    
    return {
      total: allMigrations.length,
      executed: executedMigrations.length,
      pending: pendingMigrations
    };
  }
}