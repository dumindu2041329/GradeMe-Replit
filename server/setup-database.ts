import { getDb } from './db-connection.js';
import { users, students } from '../shared/schema.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

const db = getDb();

export async function setupInitialData() {
  try {
    console.log('Setting up initial database data...');
    
    // First, ensure the password column exists in the students table
    try {
      await db.execute(`ALTER TABLE students ADD COLUMN IF NOT EXISTS password TEXT`);
      console.log('Password column added to students table (if not exists)');
    } catch (error) {
      console.log('Password column might already exist, continuing...');
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
        smsNotifications: false,
        emailExamResults: true,
        emailUpcomingExams: true,
        smsExamResults: false,
        smsUpcomingExams: false
      });
      console.log('Admin user created: admin@example.com / admin123');
    } else {
      // Update existing admin password to admin123
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await db.update(users)
        .set({ password: hashedPassword })
        .where(eq(users.email, 'admin@example.com'));
      console.log('Admin password updated to: admin123');
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
      console.log('Sample student created in students table: student@example.com / student123');
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
        smsNotifications: false,
        emailExamResults: true,
        emailUpcomingExams: true,
        smsExamResults: false,
        smsUpcomingExams: false
      });
      console.log('Sample student user created in users table: student@example.com / student123');
    }
    
    console.log('Database setup completed successfully!');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}