import { 
  Student as StudentType, 
  InsertStudent, 
  UpdateStudent,
  StudentDashboardData,
  studentSchema,
  insertStudentSchema,
  updateStudentSchema
} from '@shared/db-schema';
import { storage } from '../storage';

export class StudentModel {
  // Validate student data
  static validateStudent(data: any): { success: boolean; data?: StudentType; errors?: any } {
    const result = studentSchema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error.errors
    };
  }

  static validateInsertStudent(data: any): { success: boolean; data?: InsertStudent; errors?: any } {
    const result = insertStudentSchema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error.errors
    };
  }

  static validateUpdateStudent(data: any): { success: boolean; data?: Partial<UpdateStudent>; errors?: any } {
    const result = updateStudentSchema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error.errors
    };
  }

  // Business logic methods
  static async findAll(): Promise<StudentType[]> {
    try {
      return await storage.getStudents();
    } catch (error) {
      console.error('Error finding all students:', error);
      return [];
    }
  }

  static async findById(id: number): Promise<StudentType | null> {
    try {
      const student = await storage.getStudent(id);
      return student || null;
    } catch (error) {
      console.error('Error finding student by ID:', error);
      return null;
    }
  }

  static async findByEmail(email: string): Promise<StudentType | null> {
    try {
      const student = await storage.getStudentByEmail(email);
      return student || null;
    } catch (error) {
      console.error('Error finding student by email:', error);
      return null;
    }
  }

  static async create(studentData: InsertStudent): Promise<StudentType | null> {
    try {
      // Check if student already exists
      const existingStudent = await this.findByEmail(studentData.email);
      if (existingStudent) {
        throw new Error('Student with this email already exists');
      }

      const newStudent = await storage.createStudent({
        ...studentData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return newStudent;
    } catch (error) {
      console.error('Error creating student:', error);
      return null;
    }
  }

  static async update(id: number, updateData: Partial<UpdateStudent>): Promise<StudentType | null> {
    try {
      // Check if email is being updated and already exists
      if (updateData.email) {
        const existingStudent = await this.findByEmail(updateData.email);
        if (existingStudent && existingStudent.id !== id) {
          throw new Error('Email is already in use by another student');
        }
      }

      const updatedStudent = await storage.updateStudent(id, {
        ...updateData,
        updatedAt: new Date()
      });

      return updatedStudent || null;
    } catch (error) {
      console.error('Error updating student:', error);
      return null;
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      return await storage.deleteStudent(id);
    } catch (error) {
      console.error('Error deleting student:', error);
      return false;
    }
  }

  static async authenticate(email: string, password: string): Promise<StudentType | null> {
    try {
      const student = await storage.authenticateStudent(email, password);
      return student || null;
    } catch (error) {
      console.error('Error authenticating student:', error);
      return null;
    }
  }

  static async getDashboardData(studentId: number): Promise<StudentDashboardData | null> {
    try {
      return await storage.getStudentDashboardData(studentId);
    } catch (error) {
      console.error('Error getting student dashboard data:', error);
      return null;
    }
  }

  // Business logic for student operations
  static async getStudentsByClass(className: string): Promise<StudentType[]> {
    try {
      const allStudents = await this.findAll();
      return allStudents.filter(student => student.class === className);
    } catch (error) {
      console.error('Error finding students by class:', error);
      return [];
    }
  }

  static async getRecentlyEnrolled(days: number = 30): Promise<StudentType[]> {
    try {
      const allStudents = await this.findAll();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      
      return allStudents.filter(student => 
        new Date(student.enrollmentDate) >= cutoffDate
      );
    } catch (error) {
      console.error('Error finding recently enrolled students:', error);
      return [];
    }
  }
}