import { Student as StudentType } from '@shared/schema';
import { BaseModel } from './BaseModel';

export class Student extends BaseModel {
  protected static tableName = 'students';

  /**
   * Find student by email
   */
  static async findByEmail(email: string): Promise<StudentType | null> {
    return this.findOneBy<StudentType>('email', email);
  }

  /**
   * Find students by class
   */
  static async findByClass(className: string): Promise<StudentType[]> {
    return this.findBy<StudentType>('class', className);
  }

  /**
   * Create new student
   */
  static async create(studentData: Omit<StudentType, 'id' | 'createdAt' | 'updatedAt'>): Promise<StudentType> {
    // Check if student already exists with this email
    const existingStudent = await this.findByEmail(studentData.email);
    if (existingStudent) {
      throw new Error('Student with this email already exists');
    }

    const studentDataWithTimestamps = {
      ...studentData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return super.create<StudentType>(studentDataWithTimestamps);
  }

  /**
   * Update student
   */
  static async updateById(id: number, studentData: Partial<StudentType>): Promise<StudentType | null> {
    const updateData = {
      ...studentData,
      updatedAt: new Date()
    };

    return super.updateById<StudentType>(id, updateData);
  }

  /**
   * Get students with recent activity
   */
  static async getRecentlyEnrolled(days: number = 30): Promise<StudentType[]> {
    const allStudents = await this.findAll<StudentType>();
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return allStudents.filter(student => 
      new Date(student.enrollmentDate) >= cutoffDate
    );
  }

  /**
   * Search students by name or email
   */
  static async search(searchTerm: string): Promise<StudentType[]> {
    const allStudents = await this.findAll<StudentType>();
    const lowercaseSearch = searchTerm.toLowerCase();
    
    return allStudents.filter(student => 
      student.name.toLowerCase().includes(lowercaseSearch) ||
      student.email.toLowerCase().includes(lowercaseSearch)
    );
  }

  /**
   * Get unique class names
   */
  static async getUniqueClasses(): Promise<string[]> {
    const allStudents = await this.findAll<StudentType>();
    const classes = allStudents.map(student => student.class);
    return [...new Set(classes)].sort();
  }

  /**
   * Check if student exists by email
   */
  static async existsByEmail(email: string): Promise<boolean> {
    const student = await this.findByEmail(email);
    return student !== null;
  }
}