import supabase from './db';
import { IStorage } from './storage';
import { hashPassword, verifyPassword } from './utils/password-utils';
import {
  User,
  Student,
  Exam,
  Result,
  ResultWithDetails,
  StudentDashboardData,
} from '@shared/schema';

/**
 * Supabase implementation of the storage interface
 * This handles all database operations using the Supabase client
 */
export class SupabaseStorage implements IStorage {
  // User operations
  async getUser(id: number): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  async createUser(user: any): Promise<User> {
    let userData = { ...user };
    
    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...userData,
        created_at: new Date(),
        updated_at: new Date()
      }])
      .select()
      .single();

    if (error) throw error;
    return data as User;
  }

  async updateUser(id: number, userData: Partial<any>): Promise<User | undefined> {
    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }
    
    const { data, error } = await supabase
      .from('users')
      .update({
        ...userData,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return data as User;
  }

  // Student operations
  async getStudents(): Promise<Student[]> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('name');
    
    if (error) throw error;
    return data as Student[];
  }

  async getStudent(id: number): Promise<Student | undefined> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Student;
  }

  async getStudentByEmail(email: string): Promise<Student | undefined> {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .eq('email', email)
      .single();
    
    if (error || !data) return undefined;
    return data as Student;
  }

  async createStudent(student: any): Promise<Student> {
    const { data, error } = await supabase
      .from('students')
      .insert([{
        ...student,
        created_at: new Date(),
        updated_at: new Date()
      }])
      .select()
      .single();

    if (error) throw error;
    return data as Student;
  }

  async updateStudent(id: number, student: Partial<any>): Promise<Student | undefined> {
    const { data, error } = await supabase
      .from('students')
      .update({
        ...student,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return data as Student;
  }

  async deleteStudent(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('students')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  async authenticateStudent(email: string, password: string): Promise<Student | null> {
    const student = await this.getStudentByEmail(email);
    if (!student) return null;
    
    const user = await this.getUserByEmail(email);
    if (!user || !(await verifyPassword(password, user.password))) {
      return null;
    }
    
    return student;
  }

  // Exam operations
  async getExams(): Promise<Exam[]> {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .order('date', { ascending: false });
    
    if (error) throw error;
    return data as Exam[];
  }

  async getExam(id: number): Promise<Exam | undefined> {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as Exam;
  }

  async getExamsByStatus(status: string): Promise<Exam[]> {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .eq('status', status)
      .order('date');
    
    if (error) throw error;
    return data as Exam[];
  }

  async createExam(exam: any): Promise<Exam> {
    const { data, error } = await supabase
      .from('exams')
      .insert([{
        ...exam,
        created_at: new Date(),
        updated_at: new Date()
      }])
      .select()
      .single();

    if (error) throw error;
    return data as Exam;
  }

  async updateExam(id: number, exam: Partial<any>): Promise<Exam | undefined> {
    const { data, error } = await supabase
      .from('exams')
      .update({
        ...exam,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return data as Exam;
  }

  async deleteExam(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('exams')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // Result operations
  async getResults(): Promise<ResultWithDetails[]> {
    const { data, error } = await supabase
      .from('results')
      .select(`
        *,
        student:students(*),
        exam:exams(*)
      `);
    
    if (error) throw error;
    return data as ResultWithDetails[];
  }

  async getResult(id: number): Promise<ResultWithDetails | undefined> {
    const { data, error } = await supabase
      .from('results')
      .select(`
        *,
        student:students(*),
        exam:exams(*)
      `)
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    return data as ResultWithDetails;
  }

  async getResultsByStudentId(studentId: number): Promise<ResultWithDetails[]> {
    const { data, error } = await supabase
      .from('results')
      .select(`
        *,
        student:students(*),
        exam:exams(*)
      `)
      .eq('student_id', studentId);
    
    if (error) throw error;
    return data as ResultWithDetails[];
  }

  async getResultsByExamId(examId: number): Promise<ResultWithDetails[]> {
    const { data, error } = await supabase
      .from('results')
      .select(`
        *,
        student:students(*),
        exam:exams(*)
      `)
      .eq('exam_id', examId);
    
    if (error) throw error;
    return data as ResultWithDetails[];
  }

  async createResult(result: any): Promise<Result> {
    const { data, error } = await supabase
      .from('results')
      .insert([{
        ...result,
        created_at: new Date(),
        updated_at: new Date()
      }])
      .select()
      .single();

    if (error) throw error;
    return data as Result;
  }

  async updateResult(id: number, result: Partial<any>): Promise<Result | undefined> {
    const { data, error } = await supabase
      .from('results')
      .update({
        ...result,
        updated_at: new Date()
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error || !data) return undefined;
    return data as Result;
  }

  async deleteResult(id: number): Promise<boolean> {
    const { error } = await supabase
      .from('results')
      .delete()
      .eq('id', id);
    
    return !error;
  }

  // Dashboard statistics
  async getStatistics(): Promise<{ 
    totalStudents: number; 
    activeExams: number; 
    completedExams: number; 
    upcomingExams: number;
  }> {
    const { count: totalStudents = 0 } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    const { data: examData = [] } = await supabase
      .from('exams')
      .select('status');
    
    const activeExams = examData.filter(exam => exam.status === 'active').length;
    const completedExams = examData.filter(exam => exam.status === 'completed').length;
    const upcomingExams = examData.filter(exam => exam.status === 'upcoming').length;
    
    return {
      totalStudents,
      activeExams,
      completedExams,
      upcomingExams
    };
  }
  
  async getStudentDashboardData(studentId: number): Promise<StudentDashboardData> {
    const student = await this.getStudent(studentId);
    if (!student) {
      throw new Error(`Student with ID ${studentId} not found`);
    }
    
    const allExams = await this.getExams();
    const studentResults = await this.getResultsByStudentId(studentId);
    
    const availableExams = allExams
      .filter(exam => exam.status === 'upcoming' || exam.status === 'active')
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    
    const averageScore = studentResults.length > 0
      ? studentResults.reduce((sum, result) => sum + result.percentage, 0) / studentResults.length
      : 0;
    
    const bestRank = 1; // Simplified implementation
    
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

export const supabaseStorage = new SupabaseStorage();