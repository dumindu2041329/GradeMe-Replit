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
    // Hash the password if it exists
    let userData = { ...user };
    
    if (userData.password) {
      // Use the password utility to hash the password
      userData.password = await hashPassword(userData.password);
    }
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        ...userData,
        createdAt: new Date(),
        updatedAt: new Date()
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data as User;
  }

  async updateUser(id: number, userData: Partial<any>): Promise<User | undefined> {
    let updatedData = { ...userData };
    
    // If password is being updated, hash it
    if (updatedData.password) {
      updatedData.password = await hashPassword(updatedData.password);
    }
    
    const { data, error } = await supabase
      .from('users')
      .update({
        ...updatedData,
        updatedAt: new Date()
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
      .order('id', { ascending: true });
    
    if (error) throw error;
    return (data || []) as Student[];
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
        createdAt: new Date(),
        updatedAt: new Date()
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
        updatedAt: new Date()
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
    // Find user with student role first
    const user = await this.getUserByEmail(email);
    
    console.log("Authenticating student:", email);
    console.log("User found:", user ? "Yes" : "No");
    
    if (!user || user.role !== 'student') {
      console.log("Authentication failed: User not found or not a student");
      return null;
    }
    
    // Compare password using our verification utility
    try {
      const passwordMatch = await verifyPassword(password, user.password);
      console.log("Password check:", passwordMatch ? "Pass" : "Fail");
      
      if (!passwordMatch) {
        return null;
      }
    } catch (error) {
      console.error("Password comparison error:", error);
      return null;
    }
    
    // Get the associated student - try direct lookup by email first
    const studentByEmail = await this.getStudentByEmail(email);
    if (studentByEmail) {
      console.log("Found student directly by email");
      return studentByEmail;
    }
    
    // Then try by student ID if it exists
    if (user.studentId) {
      console.log("Looking up student by ID:", user.studentId);
      const student = await this.getStudent(user.studentId);
      console.log("Student found by ID:", student ? "Yes" : "No");
      return student || null;
    }
    
    console.log("No student record found");
    return null;
  }
  
  // Exam operations
  async getExams(): Promise<Exam[]> {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .order('date', { ascending: true });
    
    if (error) throw error;
    return (data || []) as Exam[];
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
      .order('date', { ascending: true });
    
    if (error) throw error;
    return (data || []) as Exam[];
  }

  async createExam(exam: any): Promise<Exam> {
    const { data, error } = await supabase
      .from('exams')
      .insert([{
        ...exam,
        createdAt: new Date(),
        updatedAt: new Date()
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
        updatedAt: new Date()
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
    // For ResultWithDetails, we need to join with students and exams
    const { data, error } = await supabase
      .from('results')
      .select(`
        *,
        student:studentId(id, name, email, class, enrollmentDate),
        exam:examId(id, name, subject, date, duration, totalMarks, status)
      `);
    
    if (error) throw error;
    
    // Transform to match ResultWithDetails type
    return (data || []).map(result => {
      const { student, exam, ...resultData } = result;
      return {
        ...resultData,
        student: student as Student,
        exam: exam as Exam
      } as ResultWithDetails;
    });
  }

  async getResult(id: number): Promise<ResultWithDetails | undefined> {
    const { data, error } = await supabase
      .from('results')
      .select(`
        *,
        student:studentId(id, name, email, class, enrollmentDate),
        exam:examId(id, name, subject, date, duration, totalMarks, status)
      `)
      .eq('id', id)
      .single();
    
    if (error || !data) return undefined;
    
    // Transform to match ResultWithDetails type
    const { student, exam, ...resultData } = data;
    return {
      ...resultData,
      student: student as Student,
      exam: exam as Exam
    } as ResultWithDetails;
  }

  async getResultsByStudentId(studentId: number): Promise<ResultWithDetails[]> {
    const { data, error } = await supabase
      .from('results')
      .select(`
        *,
        student:studentId(id, name, email, class, enrollmentDate),
        exam:examId(id, name, subject, date, duration, totalMarks, status)
      `)
      .eq('studentId', studentId);
    
    if (error) throw error;
    
    // Transform to match ResultWithDetails type
    return (data || []).map(result => {
      const { student, exam, ...resultData } = result;
      return {
        ...resultData,
        student: student as Student,
        exam: exam as Exam
      } as ResultWithDetails;
    });
  }

  async getResultsByExamId(examId: number): Promise<ResultWithDetails[]> {
    const { data, error } = await supabase
      .from('results')
      .select(`
        *,
        student:studentId(id, name, email, class, enrollmentDate),
        exam:examId(id, name, subject, date, duration, totalMarks, status)
      `)
      .eq('examId', examId);
    
    if (error) throw error;
    
    // Calculate ranks for this exam
    const rankedResults = (data || [])
      .map(result => {
        const { student, exam, ...resultData } = result;
        return {
          ...resultData,
          student: student as Student,
          exam: exam as Exam
        } as ResultWithDetails;
      })
      .sort((a, b) => b.score - a.score);
    
    // Add rank and total participants
    return rankedResults.map((result, index) => ({
      ...result,
      rank: index + 1,
      totalParticipants: rankedResults.length
    }));
  }

  async createResult(result: any): Promise<Result> {
    const { data, error } = await supabase
      .from('results')
      .insert([{
        ...result,
        createdAt: new Date(),
        updatedAt: new Date()
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
        updatedAt: new Date()
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
    // Count total students
    const { count: totalStudents = 0 } = await supabase
      .from('students')
      .select('*', { count: 'exact', head: true });
    
    // Count exams by status
    const { data: examData = [] } = await supabase
      .from('exams')
      .select('status');
    
    // Filter and count exams by status
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
  
  // Student dashboard data
  async getStudentDashboardData(studentId: number): Promise<StudentDashboardData> {
    // Get student's results with exams
    const { data: resultData = [], error } = await supabase
      .from('results')
      .select(`
        *,
        student:studentId(id, name, email, class, enrollmentDate),
        exam:examId(id, name, subject, date, duration, totalMarks, status)
      `)
      .eq('studentId', studentId);
    
    if (error) throw error;
    
    // Get available exams (active and upcoming)
    const { data: examData = [], error: examError } = await supabase
      .from('exams')
      .select('*')
      .in('status', ['active', 'upcoming'])
      .order('date', { ascending: true });
    
    if (examError) throw examError;
    
    // Transform results to match ResultWithDetails type
    const examResults = resultData.map(result => {
      const { student, exam, ...resultData } = result;
      return {
        ...resultData,
        student: student as Student,
        exam: exam as Exam
      } as ResultWithDetails;
    });
    
    // Calculate average score
    const totalScore = examResults.reduce((sum, result) => sum + result.score, 0);
    const averageScore = examResults.length > 0 ? totalScore / examResults.length : 0;
    
    // Calculate best rank (minimum rank)
    let bestRank = Number.MAX_SAFE_INTEGER;
    for (const result of examResults) {
      // Get all results for this exam
      const { data = [] } = await supabase
        .from('results')
        .select('score')
        .eq('examId', result.examId)
        .order('score', { ascending: false });
      
      // Find student's position (rank)
      const studentScore = result.score;
      const rank = data.findIndex(r => r.score <= studentScore) + 1;
      if (rank < bestRank) {
        bestRank = rank;
      }
    }
    
    return {
      totalExams: examResults.length,
      averageScore,
      bestRank: bestRank === Number.MAX_SAFE_INTEGER ? 0 : bestRank,
      availableExams: examData as Exam[],
      examHistory: examResults
    };
  }
}

// Export a single instance of SupabaseStorage for use in the application
export const supabaseStorage = new SupabaseStorage();