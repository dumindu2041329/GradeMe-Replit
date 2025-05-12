import { 
  users, type User, type InsertUser, 
  students, type Student, type InsertStudent,
  exams, type Exam, type InsertExam,
  results, type Result, type InsertResult,
  type ResultWithDetails
} from "@shared/schema";

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Student operations
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByEmail(email: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<InsertStudent>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  
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
      isAdmin: true
    });

    // Add sample data
    this.initSampleData();
  }

  private initSampleData() {
    // Create sample students
    const john = this.createStudent({
      name: "John Doe",
      email: "john@example.com",
      class: "Class 10A",
      enrollmentDate: new Date("2024-01-15")
    });

    const jane = this.createStudent({
      name: "Jane Smith",
      email: "jane@example.com",
      class: "Class 10B",
      enrollmentDate: new Date("2024-01-20")
    });

    // Create sample exams
    const mathExam = this.createExam({
      name: "Mathematics Final",
      subject: "Mathematics",
      date: new Date("2024-03-25"),
      duration: 180, // 3 hours
      totalMarks: 100,
      status: "upcoming"
    });

    const physicsExam = this.createExam({
      name: "Physics Mid-term",
      subject: "Physics",
      date: new Date("2024-03-15"),
      duration: 120, // 2 hours
      totalMarks: 75,
      status: "completed"
    });

    const chemistryExam = this.createExam({
      name: "Chemistry Quiz",
      subject: "Chemistry",
      date: new Date("2024-03-10"),
      duration: 60, // 1 hour
      totalMarks: 50,
      status: "completed"
    });

    // Create sample results
    this.createResult({
      studentId: john.id,
      examId: mathExam.id,
      score: 85,
      percentage: 85,
      submittedAt: new Date("2024-03-20")
    });

    this.createResult({
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
}

export const storage = new MemStorage();
