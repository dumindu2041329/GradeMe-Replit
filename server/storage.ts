import type { User, Student, Exam, Result, ResultWithDetails, StudentDashboardData } from "@shared/schema";

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
    
    // Initialize with sample data
    this.initSampleData();
  }

  private async initSampleData() {
    // Sample admin user
    this.users.set(1, {
      id: 1,
      email: "admin@example.com",
      password: "admin", // In production, this should be hashed
      name: "Admin User",
      role: "admin",
      isAdmin: true,
      profileImage: null,
      studentId: null,
      emailNotifications: true,
      smsNotifications: false,
      emailExamResults: true,
      emailUpcomingExams: true,
      smsExamResults: false,
      smsUpcomingExams: false,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    this.userIdCounter = 2;
  }

  private mapToArray<T>(map: Map<number, T>): T[] {
    return Array.from(map.values());
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const userArray = this.mapToArray(this.users);
    return userArray.find(user => user.email === email);
  }

  async createUser(user: any): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<any>): Promise<User | undefined> {
    const existingUser = this.users.get(id);
    if (!existingUser) {
      return undefined;
    }
    const updatedUser = { ...existingUser, ...userData };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  // Student operations
  async getStudents(): Promise<Student[]> {
    return this.mapToArray(this.students);
  }

  async getStudent(id: number): Promise<Student | undefined> {
    return this.students.get(id);
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const studentArray = this.mapToArray(this.students);
    return studentArray.find(student => student.email === email);
  }

  async createStudent(student: any): Promise<Student> {
    const id = this.studentIdCounter++;
    const newStudent: Student = { ...student, id };
    this.students.set(id, newStudent);
    return newStudent;
  }

  async updateStudent(id: number, student: Partial<any>): Promise<Student | undefined> {
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
    
    // Get the corresponding user to check password
    const users = this.mapToArray(this.users);
    const userAccount = users.find(user => 
      user.email === email && 
      user.role === "student" && 
      user.studentId === student.id
    );
    
    // Check if user exists and password matches
    if (!userAccount || userAccount.password !== password) {
      return null;
    }
    
    return student;
  }

  // Exam operations
  async getExams(): Promise<Exam[]> {
    return this.mapToArray(this.exams);
  }

  async getExam(id: number): Promise<Exam | undefined> {
    return this.exams.get(id);
  }

  async getExamsByStatus(status: string): Promise<Exam[]> {
    const allExams = await this.getExams();
    return allExams.filter(exam => exam.status === status);
  }

  async createExam(exam: any): Promise<Exam> {
    const id = this.examIdCounter++;
    const newExam: Exam = { ...exam, id };
    this.exams.set(id, newExam);
    return newExam;
  }

  async updateExam(id: number, exam: Partial<any>): Promise<Exam | undefined> {
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
    const results = this.mapToArray(this.results);
    const students = this.mapToArray(this.students);
    const exams = this.mapToArray(this.exams);
    
    return results
      .map(result => {
        const student = students.find(s => s.id === result.studentId);
        const exam = exams.find(e => e.id === result.examId);
        
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
    const allResults = await this.getResults();
    return allResults.filter(result => result.studentId === studentId);
  }

  async getResultsByExamId(examId: number): Promise<ResultWithDetails[]> {
    const allResults = await this.getResults();
    return allResults.filter(result => result.examId === examId);
  }

  async createResult(result: any): Promise<Result> {
    const id = this.resultIdCounter++;
    const newResult: Result = { ...result, id };
    this.results.set(id, newResult);
    return newResult;
  }

  async updateResult(id: number, result: Partial<any>): Promise<Result | undefined> {
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
      ? studentResults.reduce((sum: number, result) => sum + parseFloat(result.percentage), 0) / studentResults.length
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

// Use Supabase storage implementation
import { SupabaseStorage } from './supabase-storage.js';
import { isDbConnected } from './db-connection.js';

// Lazy-loaded storage instance
let storageInstance: SupabaseStorage | null = null;

export const storage = {
  get instance() {
    if (!storageInstance) {
      storageInstance = new SupabaseStorage();
    }
    return storageInstance;
  },
  
  // Proxy all IStorage methods to the lazy-loaded instance
  getUser: (id: number) => storage.instance.getUser(id),
  getUserByEmail: (email: string) => storage.instance.getUserByEmail(email),
  createUser: (user: any) => storage.instance.createUser(user),
  updateUser: (id: number, user: any) => storage.instance.updateUser(id, user),
  getStudents: () => storage.instance.getStudents(),
  getStudent: (id: number) => storage.instance.getStudent(id),
  getStudentByEmail: (email: string) => storage.instance.getStudentByEmail(email),
  createStudent: (student: any) => storage.instance.createStudent(student),
  updateStudent: (id: number, student: any) => storage.instance.updateStudent(id, student),
  deleteStudent: (id: number) => storage.instance.deleteStudent(id),
  authenticateStudent: (email: string, password: string) => storage.instance.authenticateStudent(email, password),
  getExams: () => storage.instance.getExams(),
  getExam: (id: number) => storage.instance.getExam(id),
  getExamsByStatus: (status: string) => storage.instance.getExamsByStatus(status),
  createExam: (exam: any) => storage.instance.createExam(exam),
  updateExam: (id: number, exam: any) => storage.instance.updateExam(id, exam),
  deleteExam: (id: number) => storage.instance.deleteExam(id),
  getResults: () => storage.instance.getResults(),
  getResult: (id: number) => storage.instance.getResult(id),
  getResultsByStudentId: (studentId: number) => storage.instance.getResultsByStudentId(studentId),
  getResultsByExamId: (examId: number) => storage.instance.getResultsByExamId(examId),
  createResult: (result: any) => storage.instance.createResult(result),
  updateResult: (id: number, result: any) => storage.instance.updateResult(id, result),
  deleteResult: (id: number) => storage.instance.deleteResult(id),
  getStatistics: () => storage.instance.getStatistics(),
  getStudentDashboardData: (studentId: number) => storage.instance.getStudentDashboardData(studentId)
};