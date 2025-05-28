import { 
  Result as ResultType, 
  InsertResult,
  ResultWithDetails,
  resultSchema,
  insertResultSchema
} from '@shared/db-schema';
import { storage } from '../storage';
import { ExamModel } from './Exam';
import { StudentModel } from './Student';

export class ResultModel {
  // Validate result data
  static validateResult(data: any): { success: boolean; data?: ResultType; errors?: any } {
    const result = resultSchema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error.errors
    };
  }

  static validateInsertResult(data: any): { success: boolean; data?: InsertResult; errors?: any } {
    const result = insertResultSchema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error.errors
    };
  }

  // Business logic methods
  static async findAll(): Promise<ResultWithDetails[]> {
    try {
      return await storage.getResults();
    } catch (error) {
      console.error('Error finding all results:', error);
      return [];
    }
  }

  static async findById(id: number): Promise<ResultWithDetails | null> {
    try {
      const result = await storage.getResult(id);
      return result || null;
    } catch (error) {
      console.error('Error finding result by ID:', error);
      return null;
    }
  }

  static async findByStudentId(studentId: number): Promise<ResultWithDetails[]> {
    try {
      return await storage.getResultsByStudentId(studentId);
    } catch (error) {
      console.error('Error finding results by student ID:', error);
      return [];
    }
  }

  static async findByExamId(examId: number): Promise<ResultWithDetails[]> {
    try {
      return await storage.getResultsByExamId(examId);
    } catch (error) {
      console.error('Error finding results by exam ID:', error);
      return [];
    }
  }

  static async create(resultData: InsertResult): Promise<ResultType | null> {
    try {
      // Verify student exists
      const student = await StudentModel.findById(resultData.studentId);
      if (!student) {
        throw new Error('Student not found');
      }

      // Verify exam exists
      const exam = await ExamModel.findById(resultData.examId);
      if (!exam) {
        throw new Error('Exam not found');
      }

      // Calculate percentage
      const percentage = (resultData.score / exam.totalMarks) * 100;

      // Convert submittedAt string to Date object if needed
      let submittedAt = resultData.submittedAt;
      if (typeof submittedAt === 'string') {
        submittedAt = new Date(submittedAt);
      }

      const newResult = await storage.createResult({
        ...resultData,
        percentage,
        submittedAt,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return newResult;
    } catch (error) {
      console.error('Error creating result:', error);
      return null;
    }
  }

  static async update(id: number, updateData: Partial<InsertResult>): Promise<ResultType | null> {
    try {
      // If score is being updated, recalculate percentage
      if (updateData.score !== undefined) {
        const currentResult = await this.findById(id);
        if (!currentResult) {
          throw new Error('Result not found');
        }

        const exam = await ExamModel.findById(currentResult.exam.id);
        if (exam) {
          updateData.percentage = (updateData.score / exam.totalMarks) * 100;
        }
      }

      // Convert submittedAt string to Date object if needed
      if (updateData.submittedAt && typeof updateData.submittedAt === 'string') {
        updateData.submittedAt = new Date(updateData.submittedAt);
      }

      const updatedResult = await storage.updateResult(id, {
        ...updateData,
        updatedAt: new Date()
      });

      return updatedResult || null;
    } catch (error) {
      console.error('Error updating result:', error);
      return null;
    }
  }

  static async delete(id: number): Promise<boolean> {
    try {
      return await storage.deleteResult(id);
    } catch (error) {
      console.error('Error deleting result:', error);
      return false;
    }
  }

  // Business logic for result analytics
  static async getStudentAverageScore(studentId: number): Promise<number> {
    try {
      const results = await this.findByStudentId(studentId);
      if (results.length === 0) return 0;

      const totalPercentage = results.reduce((sum, result) => sum + result.percentage, 0);
      return totalPercentage / results.length;
    } catch (error) {
      console.error('Error calculating student average score:', error);
      return 0;
    }
  }

  static async getExamAverageScore(examId: number): Promise<number> {
    try {
      const results = await this.findByExamId(examId);
      if (results.length === 0) return 0;

      const totalPercentage = results.reduce((sum, result) => sum + result.percentage, 0);
      return totalPercentage / results.length;
    } catch (error) {
      console.error('Error calculating exam average score:', error);
      return 0;
    }
  }

  static async getStudentRankInExam(studentId: number, examId: number): Promise<number | null> {
    try {
      const examResults = await this.findByExamId(examId);
      
      // Sort by score descending
      examResults.sort((a, b) => b.score - a.score);
      
      const studentRank = examResults.findIndex(result => result.student.id === studentId);
      return studentRank !== -1 ? studentRank + 1 : null;
    } catch (error) {
      console.error('Error calculating student rank:', error);
      return null;
    }
  }

  static async getTopPerformers(examId: number, limit: number = 10): Promise<ResultWithDetails[]> {
    try {
      const results = await this.findByExamId(examId);
      return results
        .sort((a, b) => b.score - a.score)
        .slice(0, limit);
    } catch (error) {
      console.error('Error getting top performers:', error);
      return [];
    }
  }

  static async getResultsByScoreRange(examId: number, minScore: number, maxScore: number): Promise<ResultWithDetails[]> {
    try {
      const results = await this.findByExamId(examId);
      return results.filter(result => 
        result.score >= minScore && result.score <= maxScore
      );
    } catch (error) {
      console.error('Error getting results by score range:', error);
      return [];
    }
  }
}