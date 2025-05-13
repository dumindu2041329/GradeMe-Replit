import { drizzle } from 'drizzle-orm/neon-serverless';
import { migrate } from 'drizzle-orm/neon-serverless/migrator';
import { Pool, neonConfig } from '@neondatabase/serverless';
import ws from 'ws';
import * as schema from './shared/schema';

// Support WebSocket for Neon serverless
neonConfig.webSocketConstructor = ws;

// Exit if DATABASE_URL is not set
if (!process.env.DATABASE_URL) {
  console.error('❌ DATABASE_URL environment variable is not set.');
  process.exit(1);
}

async function main() {
  console.log('🔄 Creating/updating database schema...');
  
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  const db = drizzle(pool, { schema });
  
  // Push schema to database
  try {
    // Create enum types if they don't exist
    try {
      await db.execute(`CREATE TYPE "role" AS ENUM ('admin', 'student');`);
      console.log('Created role enum type');
    } catch (error) {
      console.log('Role enum type already exists, skipping...');
    }
    
    try {
      await db.execute(`CREATE TYPE "exam_status" AS ENUM ('upcoming', 'active', 'completed');`);
      console.log('Created exam_status enum type');
    } catch (error) {
      console.log('Exam status enum type already exists, skipping...');
    }
    
    // Create tables if they don't exist
    await db.execute(`
      CREATE TABLE IF NOT EXISTS "students" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "class" VARCHAR(100) NOT NULL,
        "enrollment_date" DATE NOT NULL DEFAULT CURRENT_DATE,
        "phone" VARCHAR(20),
        "address" TEXT,
        "date_of_birth" DATE,
        "guardian_name" VARCHAR(255),
        "guardian_phone" VARCHAR(20),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS "users" (
        "id" SERIAL PRIMARY KEY,
        "email" VARCHAR(255) NOT NULL UNIQUE,
        "password" VARCHAR(255) NOT NULL,
        "name" VARCHAR(255) NOT NULL,
        "role" role NOT NULL DEFAULT 'student',
        "is_admin" BOOLEAN NOT NULL DEFAULT FALSE,
        "profile_image" TEXT,
        "student_id" INTEGER REFERENCES "students"("id"),
        "email_notifications" BOOLEAN DEFAULT FALSE,
        "sms_notifications" BOOLEAN DEFAULT FALSE,
        "email_exam_results" BOOLEAN DEFAULT FALSE,
        "email_upcoming_exams" BOOLEAN DEFAULT FALSE,
        "sms_exam_results" BOOLEAN DEFAULT FALSE,
        "sms_upcoming_exams" BOOLEAN DEFAULT FALSE,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS "exams" (
        "id" SERIAL PRIMARY KEY,
        "name" VARCHAR(255) NOT NULL,
        "subject" VARCHAR(100) NOT NULL,
        "date" TIMESTAMP NOT NULL,
        "duration" INTEGER NOT NULL,
        "total_marks" INTEGER NOT NULL,
        "status" exam_status NOT NULL DEFAULT 'upcoming',
        "description" TEXT,
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
      
      CREATE TABLE IF NOT EXISTS "results" (
        "id" SERIAL PRIMARY KEY,
        "student_id" INTEGER NOT NULL REFERENCES "students"("id"),
        "exam_id" INTEGER NOT NULL REFERENCES "exams"("id"),
        "score" DOUBLE PRECISION NOT NULL,
        "percentage" DOUBLE PRECISION NOT NULL,
        "submitted_at" TIMESTAMP NOT NULL DEFAULT NOW(),
        "created_at" TIMESTAMP DEFAULT NOW(),
        "updated_at" TIMESTAMP DEFAULT NOW()
      );
    `);
    
    console.log('✅ Database schema created/updated successfully.');
    
    // Insert sample data if tables are empty
    const studentCountResult = await pool.query(`SELECT COUNT(*) FROM students`);
    const studentCount = parseInt(studentCountResult.rows[0].count);
    
    if (studentCount === 0) {
      console.log('🔄 Inserting sample data...');
      
      // Insert a sample student
      await db.execute(`
        INSERT INTO students (name, email, class, enrollment_date) 
        VALUES ('John Doe', 'john@example.com', 'Class 10A', '2023-01-15');
      `);
      
      // Insert sample users
      await db.execute(`
        INSERT INTO users (email, password, name, role, is_admin) 
        VALUES ('admin@example.com', 'admin123', 'Admin User', 'admin', TRUE);
        
        INSERT INTO users (email, password, name, role, is_admin, student_id) 
        VALUES ('john@example.com', 'student123', 'John Doe', 'student', FALSE, 1);
      `);
      
      // Insert sample exams
      await db.execute(`
        INSERT INTO exams (name, subject, date, duration, total_marks, status, description)
        VALUES 
        ('Midterm Exam', 'Mathematics', NOW() + INTERVAL '7 days', 120, 100, 'upcoming', 'Covers chapters 1-5'),
        ('Final Exam', 'Science', NOW() - INTERVAL '7 days', 180, 100, 'completed', 'Comprehensive exam covering all topics');
      `);
      
      // Insert sample results
      await db.execute(`
        INSERT INTO results (student_id, exam_id, score, percentage, submitted_at)
        VALUES (1, 2, 85, 85, NOW() - INTERVAL '2 days');
      `);
      
      console.log('✅ Sample data inserted successfully.');
    } else {
      console.log('ℹ️ Database already contains data. Skipping sample data insertion.');
    }
    
  } catch (error) {
    console.error('❌ Error pushing schema to database:', error);
    process.exit(1);
  }
  
  await pool.end();
}

main().catch((error) => {
  console.error('❌ An unexpected error occurred:', error);
  process.exit(1);
});