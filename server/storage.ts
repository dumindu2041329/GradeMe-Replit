import { eq, and, desc, asc, sql } from 'drizzle-orm';
import { db } from './db';
import * as schema from '@shared/schema';
import { 
  users, 
  students, 
  exams, 
  results 
} from '@shared/schema';

export interface IStorage {
  // User operations
  getUser(id: number): Promise<schema.User | undefined>;
  getUserByEmail(email: string): Promise<schema.User | undefined>;
  createUser(user: schema.InsertUser): Promise<schema.User>;
  updateUser(id: number, user: Partial<schema.User>): Promise<schema.User | undefined>;
  
  // Student operations
  getStudents(): Promise<schema.Student[]>;
  getStudent(id: number): Promise<schema.Student | undefined>;
  getStudentByEmail(email: string): Promise<schema.Student | undefined>;
  createStudent(student: Partial<schema.Student>): Promise<schema.Student>;
  updateStudent(id: number, student: Partial<schema.Student>): Promise<schema.Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  authenticateStudent(email: string, password: string): Promise<schema.Student | null>;
  
  // Exam operations
  getExams(): Promise<schema.Exam[]>;
  getExam(id: number): Promise<schema.Exam | undefined>;
  getExamsByStatus(status: string): Promise<schema.Exam[]>;
  createExam(exam: Partial<schema.Exam>): Promise<schema.Exam>;
  updateExam(id: number, exam: Partial<schema.Exam>): Promise<schema.Exam | undefined>;
  deleteExam(id: number): Promise<boolean>;
  
  // Result operations
  getResults(): Promise<schema.ResultWithDetails[]>;
  getResult(id: number): Promise<schema.ResultWithDetails | undefined>;
  getResultsByStudentId(studentId: number): Promise<schema.ResultWithDetails[]>;
  getResultsByExamId(examId: number): Promise<schema.ResultWithDetails[]>;
  createResult(result: Partial<schema.Result>): Promise<schema.Result>;
  updateResult(id: number, result: Partial<schema.Result>): Promise<schema.Result | undefined>;
  deleteResult(id: number): Promise<boolean>;

  // Dashboard statistics
  getStatistics(): Promise<{ 
    totalStudents: number; 
    activeExams: number; 
    completedExams: number; 
    upcomingExams: number;
  }>;
  
  // Student dashboard data
  getStudentDashboardData(studentId: number): Promise<schema.StudentDashboardData>;
}

export class DatabaseStorage implements IStorage {
  // USER OPERATIONS
  async getUser(id: number): Promise<schema.User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<schema.User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(user: schema.InsertUser): Promise<schema.User> {
    const [newUser] = await db.insert(users).values(user).returning();
    return newUser;
  }

  async updateUser(id: number, userData: Partial<schema.User>): Promise<schema.User | undefined> {
    const [updatedUser] = await db
      .update(users)
      .set({
        ...userData,
        updatedAt: new Date()
      })
      .where(eq(users.id, id))
      .returning();
    return updatedUser;
  }

  // STUDENT OPERATIONS
  async getStudents(): Promise<schema.Student[]> {
    return await db.select().from(students);
  }

  async getStudent(id: number): Promise<schema.Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByEmail(email: string): Promise<schema.Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.email, email));
    return student;
  }

  async createStudent(student: Partial<schema.Student>): Promise<schema.Student> {
    // Ensure we have the required fields for insert
    if (!student.name || !student.email || !student.class) {
      throw new Error("Missing required fields for student creation");
    }
    
    const [newStudent] = await db.insert(students).values({
      name: student.name,
      email: student.email,
      class: student.class,
      // Add optional fields if they exist
      enrollmentDate: student.enrollmentDate,
      phone: student.phone,
      address: student.address,
      dateOfBirth: student.dateOfBirth,
      guardianName: student.guardianName,
      guardianPhone: student.guardianPhone,
      profileImage: student.profileImage
    }).returning();
    
    return newStudent;
  }

  async updateStudent(id: number, studentData: Partial<schema.Student>): Promise<schema.Student | undefined> {
    // Create an object with only the fields that exist in studentData
    const updateObj: Record<string, any> = { updatedAt: new Date() };
    
    if (studentData.name !== undefined) updateObj.name = studentData.name;
    if (studentData.email !== undefined) updateObj.email = studentData.email;
    if (studentData.class !== undefined) updateObj.class = studentData.class;
    if (studentData.phone !== undefined) updateObj.phone = studentData.phone;
    if (studentData.address !== undefined) updateObj.address = studentData.address;
    if (studentData.dateOfBirth !== undefined) updateObj.dateOfBirth = studentData.dateOfBirth;
    if (studentData.guardianName !== undefined) updateObj.guardianName = studentData.guardianName;
    if (studentData.guardianPhone !== undefined) updateObj.guardianPhone = studentData.guardianPhone;
    if (studentData.profileImage !== undefined) updateObj.profileImage = studentData.profileImage;
    if (studentData.enrollmentDate !== undefined) updateObj.enrollmentDate = studentData.enrollmentDate;
    
    const [updatedStudent] = await db
      .update(students)
      .set(updateObj)
      .where(eq(students.id, id))
      .returning();
      
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db.delete(students).where(eq(students.id, id));
    return true; // In PostgreSQL with Drizzle, no rows affected would throw an error
  }

  async authenticateStudent(email: string, password: string): Promise<schema.Student | null> {
    // First find the user with this email
    const [user] = await db.select().from(users).where(
      and(eq(users.email, email), eq(users.password, password), eq(users.role, 'student'))
    );

    if (!user || !user.studentId) return null;

    // If found, get the student record
    const [student] = await db.select().from(students).where(eq(students.id, user.studentId));
    return student || null;
  }

  // EXAM OPERATIONS
  async getExams(): Promise<schema.Exam[]> {
    return await db.select().from(exams);
  }

  async getExam(id: number): Promise<schema.Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async getExamsByStatus(status: string): Promise<schema.Exam[]> {
    return await db.select().from(exams).where(eq(exams.status, status as any));
  }

  async createExam(exam: Partial<schema.Exam>): Promise<schema.Exam> {
    // Ensure we have the required fields for exam creation
    if (!exam.name || !exam.subject || !exam.date || 
        exam.duration === undefined || exam.totalMarks === undefined) {
      throw new Error("Missing required fields for exam creation");
    }
    
    const [newExam] = await db.insert(exams).values({
      name: exam.name,
      subject: exam.subject,
      date: exam.date,
      duration: exam.duration,
      totalMarks: exam.totalMarks,
      status: exam.status || 'upcoming',
      description: exam.description
    }).returning();
    
    return newExam;
  }

  async updateExam(id: number, examData: Partial<schema.Exam>): Promise<schema.Exam | undefined> {
    // Create an object with only the fields that exist in examData
    const updateObj: Record<string, any> = { updatedAt: new Date() };
    
    if (examData.name !== undefined) updateObj.name = examData.name;
    if (examData.subject !== undefined) updateObj.subject = examData.subject;
    if (examData.date !== undefined) updateObj.date = examData.date;
    if (examData.duration !== undefined) updateObj.duration = examData.duration;
    if (examData.totalMarks !== undefined) updateObj.totalMarks = examData.totalMarks;
    if (examData.status !== undefined) updateObj.status = examData.status;
    if (examData.description !== undefined) updateObj.description = examData.description;
    
    const [updatedExam] = await db
      .update(exams)
      .set(updateObj)
      .where(eq(exams.id, id))
      .returning();
      
    return updatedExam;
  }

  async deleteExam(id: number): Promise<boolean> {
    await db.delete(exams).where(eq(exams.id, id));
    return true;
  }

  // RESULT OPERATIONS
  async getResults(): Promise<schema.ResultWithDetails[]> {
    const resultsList = await db.select().from(results);
    const resultsWithDetails: schema.ResultWithDetails[] = [];

    for (const result of resultsList) {
      const [student] = await db.select().from(students).where(eq(students.id, result.studentId));
      const [exam] = await db.select().from(exams).where(eq(exams.id, result.examId));
      
      if (student && exam) {
        resultsWithDetails.push({
          ...result,
          student,
          exam
        });
      }
    }

    return resultsWithDetails;
  }

  async getResult(id: number): Promise<schema.ResultWithDetails | undefined> {
    const [result] = await db.select().from(results).where(eq(results.id, id));
    if (!result) return undefined;

    const [student] = await db.select().from(students).where(eq(students.id, result.studentId));
    const [exam] = await db.select().from(exams).where(eq(exams.id, result.examId));
    
    if (student && exam) {
      return {
        ...result,
        student,
        exam
      };
    }
    
    return undefined;
  }

  async getResultsByStudentId(studentId: number): Promise<schema.ResultWithDetails[]> {
    const resultsList = await db.select().from(results).where(eq(results.studentId, studentId));
    const resultsWithDetails: schema.ResultWithDetails[] = [];

    for (const result of resultsList) {
      const [student] = await db.select().from(students).where(eq(students.id, result.studentId));
      const [exam] = await db.select().from(exams).where(eq(exams.id, result.examId));
      
      if (student && exam) {
        resultsWithDetails.push({
          ...result,
          student,
          exam
        });
      }
    }

    return resultsWithDetails;
  }

  async getResultsByExamId(examId: number): Promise<schema.ResultWithDetails[]> {
    const resultsList = await db.select().from(results).where(eq(results.examId, examId));
    const resultsWithDetails: schema.ResultWithDetails[] = [];

    for (const result of resultsList) {
      const [student] = await db.select().from(students).where(eq(students.id, result.studentId));
      const [exam] = await db.select().from(exams).where(eq(exams.id, result.examId));
      
      if (student && exam) {
        resultsWithDetails.push({
          ...result,
          student,
          exam
        });
      }
    }

    return resultsWithDetails;
  }

  async createResult(result: Partial<schema.Result>): Promise<schema.Result> {
    // Ensure we have the required fields for result creation
    if (result.studentId === undefined || result.examId === undefined || 
        result.score === undefined || result.percentage === undefined) {
      throw new Error("Missing required fields for result creation");
    }
    
    const [newResult] = await db.insert(results).values({
      studentId: result.studentId,
      examId: result.examId,
      score: result.score,
      percentage: result.percentage,
      submittedAt: result.submittedAt || new Date()
    }).returning();
    
    return newResult;
  }

  async updateResult(id: number, resultData: Partial<schema.Result>): Promise<schema.Result | undefined> {
    // Create an object with only the fields that exist in resultData
    const updateObj: Record<string, any> = { updatedAt: new Date() };
    
    if (resultData.studentId !== undefined) updateObj.studentId = resultData.studentId;
    if (resultData.examId !== undefined) updateObj.examId = resultData.examId;
    if (resultData.score !== undefined) updateObj.score = resultData.score;
    if (resultData.percentage !== undefined) updateObj.percentage = resultData.percentage;
    if (resultData.submittedAt !== undefined) updateObj.submittedAt = resultData.submittedAt;
    
    const [updatedResult] = await db
      .update(results)
      .set(updateObj)
      .where(eq(results.id, id))
      .returning();
      
    return updatedResult;
  }

  async deleteResult(id: number): Promise<boolean> {
    await db.delete(results).where(eq(results.id, id));
    return true;
  }

  // DASHBOARD STATISTICS
  async getStatistics(): Promise<{ 
    totalStudents: number; 
    activeExams: number; 
    completedExams: number; 
    upcomingExams: number; 
  }> {
    const studentCount = await db.select({ count: sql<number>`count(*)` }).from(students);
    const activeExams = await db.select().from(exams).where(eq(exams.status, 'active'));
    const completedExams = await db.select().from(exams).where(eq(exams.status, 'completed'));
    const upcomingExams = await db.select().from(exams).where(eq(exams.status, 'upcoming'));

    return {
      totalStudents: studentCount[0]?.count || 0,
      activeExams: activeExams.length,
      completedExams: completedExams.length,
      upcomingExams: upcomingExams.length
    };
  }

  // STUDENT DASHBOARD DATA
  async getStudentDashboardData(studentId: number): Promise<schema.StudentDashboardData> {
    // Get all results for this student
    const studentResults = await this.getResultsByStudentId(studentId);
    
    // Calculate average score
    const totalScore = studentResults.reduce((acc, result) => acc + result.percentage, 0);
    const averageScore = studentResults.length > 0 ? totalScore / studentResults.length : 0;
    
    // Get all active exams
    const activeExams = await db.select().from(exams).where(eq(exams.status, 'active'));
    
    // Mock best rank data since we need more complex logic for real ranking
    const bestRank = studentResults.length > 0 ? 1 : 0;
    
    return {
      totalExams: studentResults.length,
      averageScore,
      bestRank,
      availableExams: activeExams,
      examHistory: studentResults.sort((a, b) => new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime())
    };
  }
}

export const storage = new DatabaseStorage();