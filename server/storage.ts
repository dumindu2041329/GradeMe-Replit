import type { User, Student, Exam, Result, ResultWithDetails, StudentDashboardData } from "@shared/schema";
import { drizzle } from 'drizzle-orm/postgres-js';
import { eq, desc } from 'drizzle-orm';
import postgres from 'postgres';
import { users, students, exams, results } from '../shared/schema.js';
import { getDb } from './db-connection.js';
import { paperFileStorage } from './paper-file-storage.js';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: any): Promise<User>;
  updateUser(id: number, user: Partial<any>): Promise<User | undefined>;
  
  // Student operations
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByEmail(email: string): Promise<Student | undefined>;
  createStudent(student: any): Promise<Student>;
  updateStudent(id: number, student: Partial<any>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  authenticateStudent(email: string, password: string): Promise<Student | null>;
  
  // Exam operations
  getExams(): Promise<Exam[]>;
  getExam(id: number): Promise<Exam | undefined>;
  getExamsByStatus(status: string): Promise<Exam[]>;
  createExam(exam: any): Promise<Exam>;
  updateExam(id: number, exam: Partial<any>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<boolean>;
  
  // Result operations
  getResults(): Promise<ResultWithDetails[]>;
  getResult(id: number): Promise<ResultWithDetails | undefined>;
  getResultsByStudentId(studentId: number): Promise<ResultWithDetails[]>;
  getResultsByExamId(examId: number): Promise<ResultWithDetails[]>;
  createResult(result: any): Promise<Result>;
  updateResult(id: number, result: Partial<any>): Promise<Result | undefined>;
  deleteResult(id: number): Promise<boolean>;

  // Dashboard statistics
  getStatistics(): Promise<{ 
    totalStudents: number; 
    activeExams: number; 
    completedExams: number; 
    upcomingExams: number;
  }>;
  
  // Student dashboard data
  getStudentDashboardData(studentId: number): Promise<StudentDashboardData>;
}

export class SupabaseStorage implements IStorage {
  private db = getDb();

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(userData: any): Promise<User> {
    const result = await this.db.insert(users).values(userData).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<any>): Promise<User | undefined> {
    const updateData = { ...userData, updatedAt: new Date() };
    const result = await this.db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return result[0];
  }

  // Student operations
  async getStudents(): Promise<Student[]> {
    const result = await this.db.select().from(students).orderBy(desc(students.createdAt));
    return result;
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const result = await this.db.select().from(students).where(eq(students.id, id)).limit(1);
    return result[0];
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const result = await this.db.select().from(students).where(eq(students.email, email)).limit(1);
    return result[0];
  }

  async createStudent(studentData: any): Promise<Student> {
    // First create the student record
    const studentResult = await this.db.insert(students).values(studentData).returning();
    const newStudent = studentResult[0];
    
    // Then create a corresponding user record for login
    const userData = {
      name: studentData.name,
      email: studentData.email,
      password: studentData.password, // Password should already be hashed at this point
      role: 'student' as const,
      studentId: newStudent.id,
      emailNotifications: true,
      smsNotifications: false,
      emailExamResults: true,
      emailUpcomingExams: true,
      smsExamResults: false,
      smsUpcomingExams: false,
      profileImage: null
    };
    
    try {
      await this.db.insert(users).values(userData);
    } catch (error) {
      console.error('Failed to create user record for student:', error);
      // If user creation fails, we should still return the student
      // but log the error for investigation
    }
    
    return newStudent;
  }

  async updateStudent(id: number, studentData: Partial<any>): Promise<Student | undefined> {
    const updateData = { ...studentData, updatedAt: new Date() };
    const result = await this.db.update(students).set(updateData).where(eq(students.id, id)).returning();
    const updatedStudent = result[0];
    
    if (updatedStudent) {
      // Also update the corresponding user record if it exists
      const userUpdateData: any = {};
      if (studentData.name) userUpdateData.name = studentData.name;
      if (studentData.email) userUpdateData.email = studentData.email;
      if (studentData.password) userUpdateData.password = studentData.password;
      
      if (Object.keys(userUpdateData).length > 0) {
        try {
          await this.db.update(users)
            .set({ ...userUpdateData, updatedAt: new Date() })
            .where(eq(users.studentId, id));
        } catch (error) {
          console.error('Failed to update user record for student:', error);
          // Continue even if user update fails
        }
      }
    }
    
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    try {
      // First check if the student exists
      const existingStudent = await this.getStudent(id);
      if (!existingStudent) {
        return false;
      }
      
      // Delete the corresponding user record first
      try {
        await this.db.delete(users).where(eq(users.studentId, id));
      } catch (error) {
        console.log(`User record deletion failed for student ${id}, but continuing with student deletion:`, error);
      }
      
      // Then delete the student record
      await this.db.delete(students).where(eq(students.id, id));
      return true; // If no error is thrown, deletion was successful
    } catch (error) {
      console.error(`Error deleting student ${id}:`, error);
      return false;
    }
  }

  async authenticateStudent(email: string, password: string): Promise<Student | null> {
    const student = await this.getStudentByEmail(email);
    if (!student) {
      return null;
    }
    
    // Use bcrypt to compare the password
    const bcrypt = await import('bcrypt');
    const isValid = await bcrypt.compare(password, student.password);
    if (!isValid) {
      return null;
    }
    
    return student;
  }

  // Exam operations
  async getExams(): Promise<Exam[]> {
    const result = await this.db.select().from(exams).orderBy(desc(exams.date));
    return result;
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const result = await this.db.select().from(exams).where(eq(exams.id, id)).limit(1);
    return result[0];
  }

  async getExamsByStatus(status: string): Promise<Exam[]> {
    const result = await this.db.select().from(exams).where(eq(exams.status, status as any));
    return result;
  }

  async createExam(examData: any): Promise<Exam> {
    const result = await this.db.insert(exams).values(examData).returning();
    return result[0];
  }

  async updateExam(id: number, examData: Partial<any>): Promise<Exam | undefined> {
    const updateData = { ...examData, updatedAt: new Date() };
    const result = await this.db.update(exams).set(updateData).where(eq(exams.id, id)).returning();
    return result[0];
  }

  async deleteExam(id: number): Promise<boolean> {
    try {
      // First check if the exam exists
      const existingExam = await this.getExam(id);
      if (!existingExam) {
        return false;
      }
      
      // Delete the exam record from the database first
      await this.db.delete(exams).where(eq(exams.id, id));
      
      // Then delete the associated paper from Supabase storage
      // This can fail without affecting the main deletion
      try {
        await paperFileStorage.deletePaper(id);
      } catch (paperError) {
        console.log(`Paper deletion failed for exam ${id}, but exam was deleted successfully:`, paperError);
      }
      
      return true; // Exam was successfully deleted
    } catch (error) {
      console.error(`Error deleting exam ${id}:`, error);
      return false;
    }
  }

  // Result operations
  async getResults(): Promise<ResultWithDetails[]> {
    const result = await this.db
      .select()
      .from(results)
      .leftJoin(students, eq(results.studentId, students.id))
      .leftJoin(exams, eq(results.examId, exams.id))
      .orderBy(desc(results.submittedAt));

    return result.map(row => ({
      ...row.results,
      student: row.students!,
      exam: row.exams!
    }));
  }

  async getResult(id: number): Promise<ResultWithDetails | undefined> {
    const result = await this.db
      .select()
      .from(results)
      .leftJoin(students, eq(results.studentId, students.id))
      .leftJoin(exams, eq(results.examId, exams.id))
      .where(eq(results.id, id))
      .limit(1);

    if (result.length === 0) return undefined;

    const row = result[0];
    return {
      ...row.results,
      student: row.students!,
      exam: row.exams!
    };
  }

  async getResultsByStudentId(studentId: number): Promise<ResultWithDetails[]> {
    const result = await this.db
      .select()
      .from(results)
      .leftJoin(students, eq(results.studentId, students.id))
      .leftJoin(exams, eq(results.examId, exams.id))
      .where(eq(results.studentId, studentId))
      .orderBy(desc(results.submittedAt));

    return result.map(row => ({
      ...row.results,
      student: row.students!,
      exam: row.exams!
    }));
  }

  async getResultsByExamId(examId: number): Promise<ResultWithDetails[]> {
    const result = await this.db
      .select()
      .from(results)
      .leftJoin(students, eq(results.studentId, students.id))
      .leftJoin(exams, eq(results.examId, exams.id))
      .where(eq(results.examId, examId))
      .orderBy(desc(results.submittedAt));

    return result.map(row => ({
      ...row.results,
      student: row.students!,
      exam: row.exams!
    }));
  }

  async createResult(resultData: any): Promise<Result> {
    const result = await this.db.insert(results).values(resultData).returning();
    return result[0];
  }

  async updateResult(id: number, resultData: Partial<any>): Promise<Result | undefined> {
    const updateData = { ...resultData, updatedAt: new Date() };
    const result = await this.db.update(results).set(updateData).where(eq(results.id, id)).returning();
    return result[0];
  }

  async deleteResult(id: number): Promise<boolean> {
    const result = await this.db.delete(results).where(eq(results.id, id));
    return Array.isArray(result) ? result.length > 0 : false;
  }

  // Dashboard statistics
  async getStatistics(): Promise<{ 
    totalStudents: number; 
    activeExams: number; 
    completedExams: number; 
    upcomingExams: number;
  }> {
    const [studentCount] = await this.db.select().from(students);
    const allExams = await this.db.select().from(exams);

    return {
      totalStudents: await this.db.select().from(students).then(r => r.length),
      activeExams: allExams.filter(exam => exam.status === 'active').length,
      completedExams: allExams.filter(exam => exam.status === 'completed').length,
      upcomingExams: allExams.filter(exam => exam.status === 'upcoming').length
    };
  }
  
  // Student dashboard data
  async getStudentDashboardData(studentId: number): Promise<StudentDashboardData> {
    const student = await this.getStudent(studentId);
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }
    
    const allExams = await this.getExams();
    const studentResults = await this.getResultsByStudentId(studentId);
    
    const availableExams = allExams
      .filter(exam => exam.status === 'upcoming')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const activeExams = allExams
      .filter(exam => exam.status === 'active')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const averageScore = studentResults.length > 0
      ? studentResults.reduce((sum, result) => sum + parseFloat(result.percentage), 0) / studentResults.length
      : 0;
    
    const bestRank = 1; // Simplified implementation
    
    return {
      totalExams: studentResults.length,
      averageScore,
      bestRank,
      availableExams,
      activeExams,
      examHistory: studentResults
    };
  }
}

// Export storage instance
export const storage = new SupabaseStorage();