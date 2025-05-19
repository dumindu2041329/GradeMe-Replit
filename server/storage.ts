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
  updateUser(id: number, user: Partial<User>): Promise<User | undefined>;
  
  // Student operations
  getStudents(): Promise<Student[]>;
  getStudent(id: number): Promise<Student | undefined>;
  getStudentByEmail(email: string): Promise<Student | undefined>;
  createStudent(student: InsertStudent): Promise<Student>;
  updateStudent(id: number, student: Partial<Student>): Promise<Student | undefined>;
  deleteStudent(id: number): Promise<boolean>;
  authenticateStudent(email: string, password: string): Promise<Student | null>;
  
  // Exam operations
  getExams(): Promise<Exam[]>;
  getExam(id: number): Promise<Exam | undefined>;
  getExamsByStatus(status: string): Promise<Exam[]>;
  createExam(exam: InsertExam): Promise<Exam>;
  updateExam(id: number, exam: Partial<Exam>): Promise<Exam | undefined>;
  deleteExam(id: number): Promise<boolean>;
  
  // Result operations
  getResults(): Promise<ResultWithDetails[]>;
  getResult(id: number): Promise<ResultWithDetails | undefined>;
  getResultsByStudentId(studentId: number): Promise<ResultWithDetails[]>;
  getResultsByExamId(examId: number): Promise<ResultWithDetails[]>;
  createResult(result: InsertResult): Promise<Result>;
  updateResult(id: number, result: Partial<Result>): Promise<Result | undefined>;
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
      email: "john@student.com",
      class: "10A",
      phone: "123-456-7890",
      address: "123 Student St",
      dateOfBirth: new Date(2005, 5, 15)
    });
    
    const sarah = await this.createStudent({
      name: "Sarah Johnson",
      email: "sarah@student.com",
      class: "10B",
      phone: "987-654-3210",
      address: "456 Student Ave",
      dateOfBirth: new Date(2005, 8, 22)
    });
    
    const michael = await this.createStudent({
      name: "Michael Smith",
      email: "michael@student.com",
      class: "11A",
      phone: "555-123-4567",
      address: "789 Student Blvd",
      dateOfBirth: new Date(2004, 3, 10)
    });

    // Create student user accounts
    await this.createUser({
      email: "john@student.com",
      password: "password123",
      name: "John Doe",
      role: "student",
      isAdmin: false,
      studentId: john.id,
      profileImage: null
    });
    
    await this.createUser({
      email: "sarah@student.com",
      password: "password123",
      name: "Sarah Johnson",
      role: "student",
      isAdmin: false,
      studentId: sarah.id,
      profileImage: null
    });
    
    await this.createUser({
      email: "michael@student.com",
      password: "password123",
      name: "Michael Smith",
      role: "student",
      isAdmin: false,
      studentId: michael.id,
      profileImage: null
    });

    // Create sample exams
    const mathExam = await this.createExam({
      name: "Mid-Term Math Exam",
      subject: "Mathematics",
      date: new Date(2023, 6, 15),
      duration: 90,
      totalMarks: 100,
      status: "upcoming",
      description: "Algebra, Geometry, and Calculus"
    });
    
    const scienceExam = await this.createExam({
      name: "Science Quiz",
      subject: "Science",
      date: new Date(2023, 6, 5),
      duration: 60,
      totalMarks: 50,
      status: "completed",
      description: "Physics and Chemistry basics"
    });
    
    const englishExam = await this.createExam({
      name: "English Literature Test",
      subject: "English",
      date: new Date(2023, 6, 20),
      duration: 120,
      totalMarks: 80,
      status: "active",
      description: "Shakespearean Literature and Poetry Analysis"
    });

    // Create sample results
    await this.createResult({
      studentId: sarah.id,
      examId: scienceExam.id,
      score: 42,
      percentage: 84,
      submittedAt: new Date(2023, 6, 5, 10, 30)
    });
    
    await this.createResult({
      studentId: john.id,
      examId: scienceExam.id,
      score: 38,
      percentage: 76,
      submittedAt: new Date(2023, 6, 5, 10, 15)
    });
    
    await this.createResult({
      studentId: michael.id,
      examId: scienceExam.id,
      score: 45,
      percentage: 90,
      submittedAt: new Date(2023, 6, 5, 10, 45)
    });
  }

  private mapToArray<T>(map: Map<number, T>): T[] {
    return Array.from(map.values());
  }

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
    const now = new Date();
    const newUser: User = { 
      ...user, 
      id, 
      createdAt: now, 
      updatedAt: now,
      emailNotifications: false,
      smsNotifications: false,
      emailExamResults: false,
      emailUpcomingExams: false,
      smsExamResults: false,
      smsUpcomingExams: false
    };
    this.users.set(id, newUser);
    return newUser;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = { 
      ...user, 
      ...userData, 
      updatedAt: new Date() 
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async getStudents(): Promise<Student[]> {
    return this.mapToArray(this.students);
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
    const now = new Date();
    const newStudent: Student = { 
      ...student, 
      id, 
      enrollmentDate: student.enrollmentDate || now,
      phone: student.phone || null,
      address: student.address || null,
      dateOfBirth: student.dateOfBirth || null,
      guardianName: student.guardianName || null,
      guardianPhone: student.guardianPhone || null,
      profileImage: student.profileImage || null,
      createdAt: now, 
      updatedAt: now 
    };
    this.students.set(id, newStudent);
    return newStudent;
  }

  async updateStudent(id: number, student: Partial<Student>): Promise<Student | undefined> {
    const existingStudent = this.students.get(id);
    if (!existingStudent) return undefined;
    
    const updatedStudent: Student = { 
      ...existingStudent, 
      ...student, 
      updatedAt: new Date() 
    };
    this.students.set(id, updatedStudent);
    return updatedStudent;
  }

  async deleteStudent(id: number): Promise<boolean> {
    return this.students.delete(id);
  }

  async authenticateStudent(email: string, password: string): Promise<Student | null> {
    // Find user with student role
    let studentUser: User | undefined;
    for (const user of this.users.values()) {
      if (user.email === email && user.password === password && user.role === "student") {
        studentUser = user;
        break;
      }
    }
    
    if (!studentUser || !studentUser.studentId) return null;
    
    const student = this.students.get(studentUser.studentId);
    return student || null;
  }

  async getExams(): Promise<Exam[]> {
    return this.mapToArray(this.exams);
  }

  async getExam(id: number): Promise<Exam | undefined> {
    return this.exams.get(id);
  }

  async getExamsByStatus(status: string): Promise<Exam[]> {
    return this.mapToArray(this.exams).filter(exam => exam.status === status);
  }

  async createExam(exam: InsertExam): Promise<Exam> {
    const id = this.examIdCounter++;
    const now = new Date();
    const newExam: Exam = { 
      ...exam, 
      id, 
      createdAt: now, 
      updatedAt: now 
    };
    this.exams.set(id, newExam);
    return newExam;
  }

  async updateExam(id: number, examData: Partial<Exam>): Promise<Exam | undefined> {
    const exam = this.exams.get(id);
    if (!exam) return undefined;
    
    const updatedExam: Exam = { 
      ...exam, 
      ...examData, 
      updatedAt: new Date() 
    };
    this.exams.set(id, updatedExam);
    return updatedExam;
  }

  async deleteExam(id: number): Promise<boolean> {
    return this.exams.delete(id);
  }

  async getResults(): Promise<ResultWithDetails[]> {
    const results = this.mapToArray(this.results);
    const resultsWithDetails: ResultWithDetails[] = [];
    
    for (const result of results) {
      const student = this.students.get(result.studentId);
      const exam = this.exams.get(result.examId);
      
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

  async getResult(id: number): Promise<ResultWithDetails | undefined> {
    const result = this.results.get(id);
    if (!result) return undefined;
    
    const student = this.students.get(result.studentId);
    const exam = this.exams.get(result.examId);
    
    if (student && exam) {
      return {
        ...result,
        student,
        exam
      };
    }
    
    return undefined;
  }

  async getResultsByStudentId(studentId: number): Promise<ResultWithDetails[]> {
    const results = this.mapToArray(this.results).filter(r => r.studentId === studentId);
    const resultsWithDetails: ResultWithDetails[] = [];
    
    for (const result of results) {
      const student = this.students.get(result.studentId);
      const exam = this.exams.get(result.examId);
      
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

  async getResultsByExamId(examId: number): Promise<ResultWithDetails[]> {
    const results = this.mapToArray(this.results).filter(r => r.examId === examId);
    const resultsWithDetails: ResultWithDetails[] = [];
    
    for (const result of results) {
      const student = this.students.get(result.studentId);
      const exam = this.exams.get(result.examId);
      
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

  async createResult(result: InsertResult): Promise<Result> {
    const id = this.resultIdCounter++;
    const now = new Date();
    const newResult: Result = { 
      ...result, 
      id, 
      submittedAt: result.submittedAt || now,
      createdAt: now, 
      updatedAt: now 
    };
    this.results.set(id, newResult);
    return newResult;
  }

  async updateResult(id: number, resultData: Partial<Result>): Promise<Result | undefined> {
    const result = this.results.get(id);
    if (!result) return undefined;
    
    const updatedResult: Result = { 
      ...result, 
      ...resultData, 
      updatedAt: new Date() 
    };
    this.results.set(id, updatedResult);
    return updatedResult;
  }

  async deleteResult(id: number): Promise<boolean> {
    return this.results.delete(id);
  }

  async getStatistics(): Promise<{ 
    totalStudents: number; 
    activeExams: number; 
    completedExams: number; 
    upcomingExams: number; 
  }> {
    const activeExams = this.mapToArray(this.exams).filter(e => e.status === 'active');
    const completedExams = this.mapToArray(this.exams).filter(e => e.status === 'completed');
    const upcomingExams = this.mapToArray(this.exams).filter(e => e.status === 'upcoming');
    
    return {
      totalStudents: this.students.size,
      activeExams: activeExams.length,
      completedExams: completedExams.length,
      upcomingExams: upcomingExams.length
    };
  }

  async getStudentDashboardData(studentId: number): Promise<StudentDashboardData> {
    const results = await this.getResultsByStudentId(studentId);
    
    // Calculate average score
    const totalScore = results.reduce((acc, result) => acc + result.percentage, 0);
    const averageScore = results.length > 0 ? totalScore / results.length : 0;
    
    // Get active and upcoming exams
    const allExams = this.mapToArray(this.exams);
    const availableExamStatuses = allExams.filter(e => e.status === 'active' || e.status === 'upcoming');
    
    // Get exams the student has already completed (by extracting exam IDs from results)
    const completedExamIds = results.map(result => result.examId);
    
    // Filter out exams the student has already taken
    const availableExams = availableExamStatuses.filter(exam => !completedExamIds.includes(exam.id))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    // Mock best rank data (in a real app, this would need more complex calculation)
    const bestRank = results.length > 0 ? 1 : 0;
    
    return {
      totalExams: results.length,
      averageScore,
      bestRank,
      availableExams: availableExams,
      examHistory: results.sort((a, b) => 
        new Date(b.submittedAt).getTime() - new Date(a.submittedAt).getTime()
      )
    };
  }
}

export const storage = new MemStorage();