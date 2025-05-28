import { 
  Exam as ExamType, 
  InsertExam,
  ExamStatus,
  examSchema,
  insertExamSchema
} from '@shared/db-schema';
import { storage } from '../storage';

export class ExamModel {
  // Validate exam data
  static validateExam(data: any): { success: boolean; data?: ExamType; errors?: any } {
    const result = examSchema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error.errors
    };
  }

  static validateInsertExam(data: any): { success: boolean; data?: InsertExam; errors?: any } {
    const result = insertExamSchema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error.errors
    };
  }

  // Business logic methods
  static async findAll(): Promise<ExamType[]> {
    try {
      return await storage.getExams();
    } catch (error) {
      console.error('Error finding all exams:', error);
      return [];
    }
  }

  static async findById(id: number): Promise<ExamType | null> {
    try {
      const exam = await storage.getExam(id);
      return exam || null;
    } catch (error) {
      console.error('Error finding exam by ID:', error);
      return null;
    }
  }

  static async findByStatus(status: ExamStatus): Promise<ExamType[]> {
    try {
      return await storage.getExamsByStatus(status);
    } catch (error) {
      console.error('Error finding exams by status:', error);
      return [];
    }
  }

  static async create(examData: InsertExam): Promise<ExamType | null> {
    try {
      // Convert date string to Date object if needed
      if (typeof examData.date === 'string') {
        examData.date = new Date(examData.date);
      }

      const newExam = await storage.createExam({
        ...examData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return newExam;
    } catch (error) {
      console.error('Error creating exam:', error);
      return null;
    }
  }

  static async update(id: number, updateData: Partial<InsertExam>): Promise<ExamType | null> {
    try {
      // Convert date string to Date object if needed
      if (updateData.date && typeof updateData.date === 'string') {
        updateData.date = new Date(updateData.date);
      }

      const updatedExam = await storage.updateExam(id, {
        ...updateData,
        updatedAt: new Date()
      });

      return updatedExam || null;
    } catch (error) {
      console.error('Error updating exam:', error);
      return null;
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      return await storage.deleteExam(id);
    } catch (error) {
      console.error('Error deleting exam:', error);
      return false;
    }
  }

  // Business logic for exam operations
  static async getUpcomingExams(): Promise<ExamType[]> {
    return this.findByStatus('upcoming');
  }

  static async getActiveExams(): Promise<ExamType[]> {
    return this.findByStatus('active');
  }

  static async getCompletedExams(): Promise<ExamType[]> {
    return this.findByStatus('completed');
  }

  static async getExamsBySubject(subject: string): Promise<ExamType[]> {
    try {
      const allExams = await this.findAll();
      return allExams.filter(exam => exam.subject.toLowerCase() === subject.toLowerCase());
    } catch (error) {
      console.error('Error finding exams by subject:', error);
      return [];
    }
  }

  static async getExamsInDateRange(startDate: Date, endDate: Date): Promise<ExamType[]> {
    try {
      const allExams = await this.findAll();
      return allExams.filter(exam => {
        const examDate = new Date(exam.date);
        return examDate >= startDate && examDate <= endDate;
      });
    } catch (error) {
      console.error('Error finding exams in date range:', error);
      return [];
    }
  }

  // Utility method to update exam status based on current date
  static async updateExamStatuses(): Promise<void> {
    try {
      const allExams = await this.findAll();
      const now = new Date();

      for (const exam of allExams) {
        const examDate = new Date(exam.date);
        const examEndTime = new Date(examDate.getTime() + exam.duration * 60000); // duration in minutes

        let newStatus: ExamStatus;
        if (now < examDate) {
          newStatus = 'upcoming';
        } else if (now >= examDate && now <= examEndTime) {
          newStatus = 'active';
        } else {
          newStatus = 'completed';
        }

        if (newStatus !== exam.status) {
          await this.update(exam.id, { status: newStatus });
        }
      }
    } catch (error) {
      console.error('Error updating exam statuses:', error);
    }
  }
}