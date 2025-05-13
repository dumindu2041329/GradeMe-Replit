import { 
  type User, 
  type Student,
  type Exam,
  type Result,
  type ResultWithDetails,
  type StudentDashboardData,
  type ExamStatus,
  type InsertUser,
  type InsertStudent,
  type InsertExam,
  type InsertResult
} from "@shared/schema";

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
    
    // Create student user accounts
    await this.createUser({
      email: john.email,
      password: "student123",
      name: john.name,
      role: "student",
      isAdmin: false,
      profileImage: null,
      studentId: john.id
    });
    
    await this.createUser({
      email: jane.email,
      password: "student123",
      name: jane.name,
      role: "student",
      isAdmin: false,
      profileImage: null,
      studentId: jane.id
    });

    // Create sample exams
    const mathExam = await this.createExam({
      name: "Mathematics Final",
      subject: "Mathematics",
      date: new Date("2024-06-25"),
      duration: 180, // 3 hours
      totalMarks: 100,
      status: "upcoming"
    });

    const physicsExam = await this.createExam({
      name: "Physics Mid-term",
      subject: "Physics",
      date: new Date("2024-05-15"),
      duration: 120, // 2 hours
      totalMarks: 75,
      status: "active"
    });

    const chemistryExam = await this.createExam({
      name: "Chemistry Quiz",
      subject: "Chemistry",
      date: new Date("2024-04-10"),
      duration: 60, // 1 hour
      totalMarks: 50,
      status: "completed"
    });
    
    const biologyExam = await this.createExam({
      name: "Biology Semester Test",
      subject: "Biology",
      date: new Date("2024-03-20"),
      duration: 90,
      totalMarks: 60,
      status: "completed"
    });

    // Create sample results
    await this.createResult({
      studentId: john.id,
      examId: biologyExam.id,
      score: 52,
      percentage: 87,
      submittedAt: new Date("2024-03-20")
    });
    
    await this.createResult({
      studentId: john.id,
      examId: chemistryExam.id,
      score: 43,
      percentage: 86,
      submittedAt: new Date("2024-04-10")
    });

    await this.createResult({
      studentId: jane.id,
      examId: chemistryExam.id,
      score: 44,
      percentage: 88,
      submittedAt: new Date("2024-04-10")
    });
    
    await this.createResult({
      studentId: jane.id,
      examId: biologyExam.id,
      score: 54,
      percentage: 90,
      submittedAt: new Date("2024-03-20")
    });
  }

  // Convert map values to array safely
  private mapToArray<T>(map: Map<number, T>): T[] {
    const result: T[] = [];
    map.forEach(item => result.push(item));
    return result;
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const userArray = this.mapToArray(this.users);
    return userArray.find(user => user.email === email);
  }

  async createUser(user: InsertUser): Promise<User> {
    const id = this.userIdCounter++;
    const newUser: User = { ...user, id };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
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
    
    // Simple password comparison for mock data
    if (student.password !== password) {
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
    const allExams = this.mapToArray(this.exams);
    return allExams.filter(exam => exam.status === status);
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
    const allResults = this.mapToArray(this.results);
    return allResults.map(result => {
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
    const allResults = this.mapToArray(this.results);
    return allResults
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
    const allResults = this.mapToArray(this.results);
    return allResults
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

export const storage = new MemStorage();