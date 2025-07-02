import { getDb } from './db-connection.js';
import { users, students } from '../shared/schema.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

const db = getDb();

export async function setupInitialData() {
  try {
    // First, ensure the password column exists in the students table
    try {
      await db.execute(`
        DO $$ 
        BEGIN 
          IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='students' AND column_name='password') THEN
            ALTER TABLE students ADD COLUMN password TEXT;
          END IF;
        END $$;
      `);
    } catch (error) {
      // Password column setup failed, continuing...
    }
    
    // Check if admin user already exists
    const existingAdmin = await db.select().from(users).where(eq(users.email, 'admin@example.com')).limit(1);
    
    if (existingAdmin.length === 0) {
      // Create admin user
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.insert(users).values({
        email: 'admin@example.com',
        password: hashedPassword,
        name: 'Admin User',
        role: 'admin',
        isAdmin: true,
        profileImage: null,
        studentId: null,
        emailNotifications: true,
        emailExamResults: true,
        emailUpcomingExams: true
      });
    } else {
      // Update existing admin password to admin123
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, 'admin@example.com'));
    }
    
    // Check if sample student exists in students table
    let studentRecord = await db.select().from(students).where(eq(students.email, 'student@example.com')).limit(1);
    
    if (studentRecord.length === 0) {
      // Create sample student with password
      const hashedPassword = await bcrypt.hash('student123', 10);
      const newStudent = await db.insert(students).values({
        name: 'John Doe',
        email: 'student@example.com',
        password: hashedPassword,
        class: '12th Grade',
        enrollmentDate: new Date(),
        phone: '123-456-7890',
        address: '123 Student St',
        dateOfBirth: new Date('2005-01-15'),
        guardianName: 'Jane Doe',
        guardianPhone: '123-456-7891',
        profileImage: null
      }).returning();
      
      studentRecord = newStudent;
    }
    
    // Also create a student user entry in the users table
    const existingStudentUser = await db.select().from(users).where(eq(users.email, 'student@example.com')).limit(1);
    
    if (existingStudentUser.length === 0) {
      const studentHashedPassword = await bcrypt.hash('student123', 10);
      await db.insert(users).values({
        email: 'student@example.com',
        password: studentHashedPassword,
        name: 'John Doe',
        role: 'student',
        isAdmin: false,
        profileImage: null,
        studentId: studentRecord[0].id,
        emailNotifications: true,
        emailExamResults: true,
        emailUpcomingExams: true
      });
    }
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}