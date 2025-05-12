import { 
  users, type User, type InsertUser, 
  students, type Student, type InsertStudent,
  exams, type Exam, type InsertExam,
  results, type Result, type InsertResult,
  type ResultWithDetails,
  type StudentDashboardData,
  type ExamStatus
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, sql, gte, lte } from "drizzle-orm";
import bcrypt from "bcryptjs";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined>;
  
  // Student operations
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByEmail(email: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  authenticateStudent(email: string, password: string): Promise<Student | null>;
  
  // Exam operations
  getExams(): Promise<Exam[]>;
  getExam(id: number): Promise<Exam | undefined>;
  getExamsByStatus(status: string): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<boolean>;
  
  // Result operations
  getResults(): Promise<ResultWithDetails[]>;
  getResult(id: number): Promise<ResultWithDetails | undefined>;
  getResultsByStudentId(studentId: number): Promise<ResultWithDetails[]>;
  getResultsByExamId(examId: number): Promise<ResultWithDetails[]>;
  createResult(result: InsertResult): Promise<Result>;
  updateResult(id: number, result: Partial<InsertResult>): Promise<Result | undefined>;
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

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private students: Map<number, Student>;
  private exams: Map<number, Exam>;
  private results: Map<number, Result>;
  private userIdCounter: number;
  private studentIdCounter: number;
  private examIdCounter: number;
  private resultIdCounter: number;

  constructor() {
    this.users = new Map();
    this.students = new Map();
    this.exams = new Map();
    this.results = new Map();
    this.userIdCounter = 1;
    this.studentIdCounter = 1;
    this.examIdCounter = 1;
    this.resultIdCounter = 1;

    // Add default admin user
    this.createUser({
      email: "admin@grademe.com",
      password: "password123",
      name: "Admin User",
      role: "admin",
      isAdmin: true,
      profileImage: null,
      studentId: null
    });

    // Add sample data
    this.initSampleData();
  }

  private async initSampleData() {
    // Create sample students
    const john = await this.createStudent({
      name: "John Doe",
      email: "john@example.com",
      class: "Class 10A",
      password: "student123",
      enrollmentDate: new Date("2024-01-15")
    });

    const jane = await this.createStudent({
      name: "Jane Smith",
      email: "jane@example.com",
      class: "Class 10B",
      password: "student123",
      enrollmentDate: new Date("2024-01-20")
    });

    // Create sample exams
    const mathExam = await this.createExam({
      name: "Mathematics Final",
      subject: "Mathematics",
      date: new Date("2024-03-25"),
      duration: 180, // 3 hours
      totalMarks: 100,
      status: "upcoming"
    });

    const physicsExam = await this.createExam({
      name: "Physics Mid-term",
      subject: "Physics",
      date: new Date("2024-03-15"),
      duration: 120, // 2 hours
      totalMarks: 75,
      status: "completed"
    });

    const chemistryExam = await this.createExam({
      name: "Chemistry Quiz",
      subject: "Chemistry",
      date: new Date("2024-03-10"),
      duration: 60, // 1 hour
      totalMarks: 50,
      status: "completed"
    });

    // Create sample results
    await this.createResult({
      studentId: john.id,
      examId: mathExam.id,
      score: 85,
      percentage: 85,
      submittedAt: new Date("2024-03-20")
    });

    await this.createResult({
      studentId: jane.id,
      examId: physicsExam.id,
      score: 69,
      percentage: 92,
      submittedAt: new Date("2024-03-15")
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return undefined;
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, user: Partial<InsertUser>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }
    const updatedUser = { ...existingUser, ...user };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Student operations
  async getStudents(): Promise<Student[]> {
    return Array.from(this.students.values());
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    for (const student of this.students.values()) {
      if (student.email === email) {
        return student;
      }
    }
    return undefined;
  }

  async createStudent(student: InsertStudent): Promise<Student> {
    const id = this.studentIdCounter++;
    const newStudent: Student = { ...student, id };
    this.students.set(id, newStudent);
    return newStudent;
  }

  async updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined> {
    const existingStudent = this.students.get(id);
    if (!existingStudent) {
      return undefined;
    }
    const updatedStudent = { ...existingStudent, ...student };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.students.delete(id);
  }

  async authenticateStudent(email: string, password: string): Promise<Student | null> {
    const student = await this.getStudentByEmail(email);
    if (!student) {
      return null;
    }
    
    // Simple password comparison (in a real app, use bcrypt.compare)
    if (student.password !== password) {
      return null;
    }
    
    return student;
  }

  // Exam operations
  async getExams(): Promise<Exam[]> {
    return Array.from(this.exams.values());
  }

  async getExam(id: number): Promise<Exam | undefined> {
    return this.exams.get(id);
  }

  async getExamsByStatus(status: string): Promise<Exam[]> {
    return Array.from(this.exams.values()).filter(exam => exam.status === status);
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const id = this.examIdCounter++;
    const newExam: Exam = { ...exam, id };
    this.exams.set(id, newExam);
    return newExam;
  }

  async updateExam(id: number, exam: Partial<InsertExam>): Promise<Exam | undefined> {
    const existingExam = this.exams.get(id);
    if (!existingExam) {
      return undefined;
    }
    const updatedExam = { ...existingExam, ...exam };
    this.exams.set(id, updatedExam);
    return updatedExam;
  }

  async deleteExam(id: number): Promise<boolean> {
    return this.exams.delete(id);
  }

  // Result operations
  async getResults(): Promise<ResultWithDetails[]> {
    return Array.from(this.results.values()).map(result => {
      const student = this.students.get(result.studentId);
      const exam = this.exams.get(result.examId);
      
      if (!student || !exam) {
        throw new Error(`Missing related entities for result ${result.id}`);
      }
      
      return {
        ...result,
        student,
        exam
      };
    });
  }

  async getResult(id: number): Promise<ResultWithDetails | undefined> {
    const result = this.results.get(id);
    if (!result) {
      return undefined;
    }
    
    const student = this.students.get(result.studentId);
    const exam = this.exams.get(result.examId);
    
    if (!student || !exam) {
      return undefined;
    }
    
    return {
      ...result,
      student,
      exam
    };
  }

  async getResultsByStudentId(studentId: number): Promise<ResultWithDetails[]> {
    return Array.from(this.results.values())
      .filter(result => result.studentId === studentId)
      .map(result => {
        const student = this.students.get(result.studentId);
        const exam = this.exams.get(result.examId);
        
        if (!student || !exam) {
          throw new Error(`Missing related entities for result ${result.id}`);
        }
        
        return {
          ...result,
          student,
          exam
        };
      });
  }

  async getResultsByExamId(examId: number): Promise<ResultWithDetails[]> {
    return Array.from(this.results.values())
      .filter(result => result.examId === examId)
      .map(result => {
        const student = this.students.get(result.studentId);
        const exam = this.exams.get(result.examId);
        
        if (!student || !exam) {
          throw new Error(`Missing related entities for result ${result.id}`);
        }
        
        return {
          ...result,
          student,
          exam
        };
      });
  }

  async createResult(result: InsertResult): Promise<Result> {
    const id = this.resultIdCounter++;
    const newResult: Result = { ...result, id };
    this.results.set(id, newResult);
    return newResult;
  }

  async updateResult(id: number, result: Partial<InsertResult>): Promise<Result | undefined> {
    const existingResult = this.results.get(id);
    if (!existingResult) {
      return undefined;
    }
    const updatedResult = { ...existingResult, ...result };
    this.results.set(id, updatedResult);
    return updatedResult;
  }

  async deleteResult(id: number): Promise<boolean> {
    return this.results.delete(id);
  }

  // Dashboard statistics
  async getStatistics(): Promise<{ 
    totalStudents: number; 
    activeExams: number; 
    completedExams: number; 
    upcomingExams: number;
  }> {
    const allExams = await this.getExams();
    
    return {
      totalStudents: this.students.size,
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
      ? studentResults.reduce((sum, result) => sum + result.percentage, 0) / studentResults.length
      : 0;
    
    // For best rank, we would need to compare against other students
    // This is a simplified implementation
    const bestRank = 1; // Placeholder
    
    return {
      totalExams: studentResults.length,
      averageScore,
      bestRank,
      availableExams,
      examHistory: studentResults.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )
    };
  }
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  // Student operations
  async getStudents(): Promise<Student[]> {
    return db.select().from(students);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.id, id));
    return student;
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const [student] = await db.select().from(students).where(eq(students.email, email));
    return student;
  }

  async createStudent(studentData: InsertStudent): Promise<Student> {
    // In the DB implementation, we should hash passwords
    let hashedPassword = null;
    if (studentData.password) {
      hashedPassword = await bcrypt.hash(studentData.password, 10);
    }
    
    const [student] = await db
      .insert(students)
      .values({
        ...studentData,
        password: hashedPassword
      })
      .returning();
    return student;
  }

  async updateStudent(id: number, studentData: Partial<InsertStudent>): Promise<Student | undefined> {
    // If password is included, hash it
    if (studentData.password) {
      studentData.password = await bcrypt.hash(studentData.password, 10);
    }
    
    const [student] = await db
      .update(students)
      .set(studentData)
      .where(eq(students.id, id))
      .returning();
    return student;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const result = await db
      .delete(students)
      .where(eq(students.id, id))
      .returning({ id: students.id });
    return result.length > 0;
  }

  async authenticateStudent(email: string, password: string): Promise<Student | null> {
    const student = await this.getStudentByEmail(email);
    if (!student || !student.password) {
      return null;
    }
    
    const validPassword = await bcrypt.compare(password, student.password);
    if (!validPassword) {
      return null;
    }
    
    return student;
  }

  // Exam operations
  async getExams(): Promise<Exam[]> {
    return db.select().from(exams);
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const [exam] = await db.select().from(exams).where(eq(exams.id, id));
    return exam;
  }

  async getExamsByStatus(status: string): Promise<Exam[]> {
    return db.select().from(exams).where(eq(exams.status, status as ExamStatus));
  }

  async createExam(examData: InsertExam): Promise<Exam> {
    const [exam] = await db.insert(exams).values(examData).returning();
    return exam;
  }

  async updateExam(id: number, examData: Partial<InsertExam>): Promise<Exam | undefined> {
    const [exam] = await db
      .update(exams)
      .set(examData)
      .where(eq(exams.id, id))
      .returning();
    return exam;
  }

  async deleteExam(id: number): Promise<boolean> {
    const result = await db
      .delete(exams)
      .where(eq(exams.id, id))
      .returning({ id: exams.id });
    return result.length > 0;
  }

  // Result operations
  async getResults(): Promise<ResultWithDetails[]> {
    const resultsList = await db.select().from(results);
    const resultDetails: ResultWithDetails[] = [];
    
    for (const result of resultsList) {
      const student = await this.getStudent(result.studentId);
      const exam = await this.getExam(result.examId);
      
      if (student && exam) {
        resultDetails.push({
          ...result,
          student,
          exam
        });
      }
    }
    
    return resultDetails;
  }

  async getResult(id: number): Promise<ResultWithDetails | undefined> {
    const [result] = await db.select().from(results).where(eq(results.id, id));
    
    if (!result) {
      return undefined;
    }
    
    const student = await this.getStudent(result.studentId);
    const exam = await this.getExam(result.examId);
    
    if (!student || !exam) {
      return undefined;
    }
    
    return {
      ...result,
      student,
      exam
    };
  }

  async getResultsByStudentId(studentId: number): Promise<ResultWithDetails[]> {
    const resultsList = await db
      .select()
      .from(results)
      .where(eq(results.studentId, studentId));
    
    const resultDetails: ResultWithDetails[] = [];
    
    for (const result of resultsList) {
      const student = await this.getStudent(result.studentId);
      const exam = await this.getExam(result.examId);
      
      if (student && exam) {
        resultDetails.push({
          ...result,
          student,
          exam
        });
      }
    }
    
    return resultDetails;
  }

  async getResultsByExamId(examId: number): Promise<ResultWithDetails[]> {
    const resultsList = await db
      .select()
      .from(results)
      .where(eq(results.examId, examId));
    
    const resultDetails: ResultWithDetails[] = [];
    
    for (const result of resultsList) {
      const student = await this.getStudent(result.studentId);
      const exam = await this.getExam(result.examId);
      
      if (student && exam) {
        resultDetails.push({
          ...result,
          student,
          exam
        });
      }
    }
    
    return resultDetails;
  }

  async createResult(resultData: InsertResult): Promise<Result> {
    const [result] = await db.insert(results).values(resultData).returning();
    return result;
  }

  async updateResult(id: number, resultData: Partial<InsertResult>): Promise<Result | undefined> {
    const [result] = await db
      .update(results)
      .set(resultData)
      .where(eq(results.id, id))
      .returning();
    return result;
  }

  async deleteResult(id: number): Promise<boolean> {
    const result = await db
      .delete(results)
      .where(eq(results.id, id))
      .returning({ id: results.id });
    return result.length > 0;
  }

  // Dashboard statistics
  async getStatistics(): Promise<{ 
    totalStudents: number; 
    activeExams: number; 
    completedExams: number; 
    upcomingExams: number;
  }> {
    const totalStudents = await db.select({ count: sql`count(*)` }).from(students);
    const activeExams = await db.select({ count: sql`count(*)` }).from(exams).where(eq(exams.status, 'active'));
    const completedExams = await db.select({ count: sql`count(*)` }).from(exams).where(eq(exams.status, 'completed'));
    const upcomingExams = await db.select({ count: sql`count(*)` }).from(exams).where(eq(exams.status, 'upcoming'));
    
    return {
      totalStudents: Number(totalStudents[0]?.count || 0),
      activeExams: Number(activeExams[0]?.count || 0),
      completedExams: Number(completedExams[0]?.count || 0),
      upcomingExams: Number(upcomingExams[0]?.count || 0)
    };
  }
  
  // Student dashboard data
  async getStudentDashboardData(studentId: number): Promise<StudentDashboardData> {
    // Check if student exists
    const student = await this.getStudent(studentId);
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }
    
    // Get student exam results
    const examHistory = await this.getResultsByStudentId(studentId);
    
    // Calculate total exams and average score
    const totalExams = examHistory.length;
    const averageScore = totalExams > 0
      ? examHistory.reduce((sum, result) => sum + result.percentage, 0) / totalExams
      : 0;
    
    // Get upcoming and active exams
    const upcomingExams = await this.getExamsByStatus('upcoming');
    const activeExams = await this.getExamsByStatus('active');
    const availableExams = [...upcomingExams, ...activeExams]
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // For best rank calculation - this is a simplified version
    // In a real app, would require more complex query to determine ranking
    const bestRank = 1; // Placeholder implementation
    
    return {
      totalExams,
      averageScore,
      bestRank,
      availableExams,
      examHistory: examHistory.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )
    };
  }
}

export const storage = new DatabaseStorage();