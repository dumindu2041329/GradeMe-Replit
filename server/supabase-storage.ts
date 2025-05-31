import { eq, and, desc, sql } from 'drizzle-orm';
import bcrypt from 'bcrypt';
import { getDb } from './db-connection.js';
import { users, students, exams, results } from '../shared/schema.js';
import type { 
  User, 
  Student, 
  Exam, 
  Result, 
  ResultWithDetails, 
  StudentDashboardData,
  InsertUser,
  InsertStudent,
  InsertExam,
  InsertResult 
} from '../shared/schema.js';
import type { IStorage } from './storage.js';

export class SupabaseStorage implements IStorage {
  private db = getDb();
  
  async getUser(id: number): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id)).limit(1);
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email)).limit(1);
    return result[0];
  }

  async createUser(userData: InsertUser): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    const result = await this.db.insert(users).values({
      ...userData,
      password: hashedPassword,
    }).returning();
    return result[0];
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const updateData: any = { ...userData };
    if (userData.password) {
      updateData.password = await bcrypt.hash(userData.password, 10);
    }
    updateData.updatedAt = new Date();
    
    const result = await this.db.update(users)
      .set(updateData)
      .where(eq(users.id, id))
      .returning();
    return result[0];
  }

  async getStudents(): Promise<Student[]> {
    return await this.db.select().from(students).orderBy(students.name);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const result = await this.db.select().from(students).where(eq(students.id, id)).limit(1);
    return result[0];
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const result = await this.db.select().from(students).where(eq(students.email, email)).limit(1);
    return result[0];
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    const result = await this.db.insert(students).values(studentData).returning();
    return result[0];
  }

  async updateStudent(id: number, studentData: Partial<InsertStudent>): Promise<Student | undefined> {
    const updateData = { ...studentData, updatedAt: new Date() };
    const result = await this.db.update(students)
      .set(updateData)
      .where(eq(students.id, id))
      .returning();
    return result[0];
  }

  async deleteStudent(id: number): Promise<boolean> {
    try {
      // First delete related results
      await this.db.delete(results).where(eq(results.studentId, id));
      
      // Then delete the student
      const result = await this.db.delete(students).where(eq(students.id, id));
      return true; // If no error thrown, deletion was successful
    } catch (error) {
      console.error("Error deleting student:", error);
      return false;
    }
  }

  async authenticateStudent(email: string, password: string): Promise<Student | null> {
    // For now, we'll assume students don't have passwords in the students table
    // You might want to add a password field to students or use a different approach
    const student = await this.getStudentByEmail(email);
    return student || null;
  }

  async getExams(): Promise<Exam[]> {
    return await this.db.select().from(exams).orderBy(desc(exams.date));
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const result = await this.db.select().from(exams).where(eq(exams.id, id)).limit(1);
    return result[0];
  }

  async getExamsByStatus(status: string): Promise<Exam[]> {
    return await this.db.select().from(exams)
      .where(eq(exams.status, status as any))
      .orderBy(exams.date);
  }

  async createExam(examData: InsertExam): Promise<Exam> {
    const result = await this.db.insert(exams).values(examData).returning();
    return result[0];
  }

  async updateExam(id: number, examData: Partial<InsertExam>): Promise<Exam | undefined> {
    const updateData = { ...examData, updatedAt: new Date() };
    const result = await this.db.update(exams)
      .set(updateData)
      .where(eq(exams.id, id))
      .returning();
    return result[0];
  }

  async deleteExam(id: number): Promise<boolean> {
    try {
      // First delete related results
      await this.db.delete(results).where(eq(results.examId, id));
      
      // Then delete the exam
      const result = await this.db.delete(exams).where(eq(exams.id, id));
      return true; // If no error thrown, deletion was successful
    } catch (error) {
      console.error("Error deleting exam:", error);
      return false;
    }
  }

  async getResults(): Promise<ResultWithDetails[]> {
    const query = this.db.select({
      id: results.id,
      studentId: results.studentId,
      examId: results.examId,
      score: results.score,
      percentage: results.percentage,
      submittedAt: results.submittedAt,
      createdAt: results.createdAt,
      updatedAt: results.updatedAt,
      student: students,
      exam: exams,
    })
    .from(results)
    .leftJoin(students, eq(results.studentId, students.id))
    .leftJoin(exams, eq(results.examId, exams.id))
    .orderBy(desc(results.submittedAt));

    const rawResults = await query;
    return rawResults.map(row => ({
      ...row,
      student: row.student!,
      exam: row.exam!,
    }));
  }

  async getResult(id: number): Promise<ResultWithDetails | undefined> {
    const query = this.db.select({
      id: results.id,
      studentId: results.studentId,
      examId: results.examId,
      score: results.score,
      percentage: results.percentage,
      submittedAt: results.submittedAt,
      createdAt: results.createdAt,
      updatedAt: results.updatedAt,
      student: students,
      exam: exams,
    })
    .from(results)
    .leftJoin(students, eq(results.studentId, students.id))
    .leftJoin(exams, eq(results.examId, exams.id))
    .where(eq(results.id, id))
    .limit(1);

    const rawResults = await query;
    if (rawResults.length === 0) return undefined;

    const row = rawResults[0];
    return {
      ...row,
      student: row.student!,
      exam: row.exam!,
    };
  }

  async getResultsByStudentId(studentId: number): Promise<ResultWithDetails[]> {
    const query = this.db.select({
      id: results.id,
      studentId: results.studentId,
      examId: results.examId,
      score: results.score,
      percentage: results.percentage,
      submittedAt: results.submittedAt,
      createdAt: results.createdAt,
      updatedAt: results.updatedAt,
      student: students,
      exam: exams,
    })
    .from(results)
    .leftJoin(students, eq(results.studentId, students.id))
    .leftJoin(exams, eq(results.examId, exams.id))
    .where(eq(results.studentId, studentId))
    .orderBy(desc(results.submittedAt));

    const rawResults = await query;
    return rawResults.map(row => ({
      ...row,
      student: row.student!,
      exam: row.exam!,
    }));
  }

  async getResultsByExamId(examId: number): Promise<ResultWithDetails[]> {
    const query = this.db.select({
      id: results.id,
      studentId: results.studentId,
      examId: results.examId,
      score: results.score,
      percentage: results.percentage,
      submittedAt: results.submittedAt,
      createdAt: results.createdAt,
      updatedAt: results.updatedAt,
      student: students,
      exam: exams,
    })
    .from(results)
    .leftJoin(students, eq(results.studentId, students.id))
    .leftJoin(exams, eq(results.examId, exams.id))
    .where(eq(results.examId, examId))
    .orderBy(desc(results.submittedAt));

    const rawResults = await query;
    return rawResults.map(row => ({
      ...row,
      student: row.student!,
      exam: row.exam!,
    }));
  }

  async createResult(resultData: InsertResult): Promise<Result> {
    // Convert numbers to strings for database storage
    const dbData = {
      ...resultData,
      score: resultData.score.toString(),
      percentage: resultData.percentage.toString(),
    };
    const result = await this.db.insert(results).values(dbData).returning();
    return result[0];
  }

  async updateResult(id: number, resultData: Partial<InsertResult>): Promise<Result | undefined> {
    const updateData: any = { ...resultData, updatedAt: new Date() };
    // Convert numbers to strings for database storage
    if (updateData.score !== undefined) {
      updateData.score = updateData.score.toString();
    }
    if (updateData.percentage !== undefined) {
      updateData.percentage = updateData.percentage.toString();
    }
    
    const result = await this.db.update(results)
      .set(updateData)
      .where(eq(results.id, id))
      .returning();
    return result[0];
  }

  async deleteResult(id: number): Promise<boolean> {
    const result = await this.db.delete(results).where(eq(results.id, id));
    return Array.isArray(result) ? result.length > 0 : false;
  }

  async getStatistics(): Promise<{ 
    totalStudents: number; 
    activeExams: number; 
    completedExams: number; 
    upcomingExams: number;
  }> {
    const [studentCount] = await this.db.select({ count: sql<number>`count(*)` }).from(students);
    const [activeExamCount] = await this.db.select({ count: sql<number>`count(*)` }).from(exams).where(eq(exams.status, 'active'));
    const [completedExamCount] = await this.db.select({ count: sql<number>`count(*)` }).from(exams).where(eq(exams.status, 'completed'));
    const [upcomingExamCount] = await this.db.select({ count: sql<number>`count(*)` }).from(exams).where(eq(exams.status, 'upcoming'));

    return {
      totalStudents: studentCount.count,
      activeExams: activeExamCount.count,
      completedExams: completedExamCount.count,
      upcomingExams: upcomingExamCount.count,
    };
  }

  async getStudentDashboardData(studentId: number): Promise<StudentDashboardData> {
    const student = await this.getStudent(studentId);
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }

    // Get all exams
    const allExams = await this.getExams();
    
    // Get results for this student
    const studentResults = await this.getResultsByStudentId(studentId);
    
    // Get available exams (upcoming and active)
    const availableExams = allExams
      .filter(exam => exam.status === 'upcoming' || exam.status === 'active')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Calculate average score
    const averageScore = studentResults.length > 0
      ? studentResults.reduce((sum, result) => sum + Number(result.percentage), 0) / studentResults.length
      : 0;
    
    // Calculate best rank (simplified - would need more complex logic for real ranking)
    const bestRank = studentResults.length > 0 ? 1 : 0;

    return {
      totalExams: allExams.length,
      averageScore: Math.round(averageScore * 100) / 100,
      bestRank,
      availableExams,
      examHistory: studentResults,
    };
  }
}