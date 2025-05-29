import { Exam as ExamType } from '@shared/schema';
import { BaseModel } from './BaseModel';

export class Exam extends BaseModel {
  protected static tableName = 'exams';

  /**
   * Find exams by status
   */
  static async findByStatus(status: string): Promise<ExamType[]> {
    return this.findBy<ExamType>('status', status);
  }

  /**
   * Find exams by subject
   */
  static async findBySubject(subject: string): Promise<ExamType[]> {
    return this.findBy<ExamType>('subject', subject);
  }

  /**
   * Create new exam
   */
  static async create(examData: Omit<ExamType, 'id' | 'createdAt' | 'updatedAt'>): Promise<ExamType> {
    const examDataWithTimestamps = {
      ...examData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return super.create<ExamType>(examDataWithTimestamps);
  }

  /**
   * Update exam
   */
  static async updateById(id: number, examData: Partial<ExamType>): Promise<ExamType | null> {
    const updateData = {
      ...examData,
      updatedAt: new Date()
    };

    return super.updateById<ExamType>(id, updateData);
  }

  /**
   * Get upcoming exams
   */
  static async getUpcoming(): Promise<ExamType[]> {
    return this.findByStatus('upcoming');
  }

  /**
   * Get active exams
   */
  static async getActive(): Promise<ExamType[]> {
    return this.findByStatus('active');
  }

  /**
   * Get completed exams
   */
  static async getCompleted(): Promise<ExamType[]> {
    return this.findByStatus('completed');
  }

  /**
   * Get exams by date range
   */
  static async getByDateRange(startDate: Date, endDate: Date): Promise<ExamType[]> {
    const allExams = await this.findAll<ExamType>();
    
    return allExams.filter(exam => {
      const examDate = new Date(exam.date);
      return examDate >= startDate && examDate <= endDate;
    });
  }

  /**
   * Get unique subjects
   */
  static async getUniqueSubjects(): Promise<string[]> {
    const allExams = await this.findAll<ExamType>();
    const subjects = allExams.map(exam => exam.subject);
    return [...new Set(subjects)].sort();
  }

  /**
   * Search exams by name or subject
   */
  static async search(searchTerm: string): Promise<ExamType[]> {
    const allExams = await this.findAll<ExamType>();
    const lowercaseSearch = searchTerm.toLowerCase();
    
    return allExams.filter(exam => 
      exam.name.toLowerCase().includes(lowercaseSearch) ||
      exam.subject.toLowerCase().includes(lowercaseSearch)
    );
  }
}