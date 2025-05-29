import { Result as ResultType, ResultWithDetails } from '@shared/schema';
import { BaseModel } from './BaseModel';
import supabase from '../db';

export class Result extends BaseModel {
  protected static tableName = 'results';

  /**
   * Find results by student ID
   */
  static async findByStudentId(studentId: number): Promise<ResultWithDetails[]> {
    const { data, error } = await supabase
      .from('results')
      .select(`
        *,
        student:students(*),
        exam:exams(*)
      `)
      .eq('student_id', studentId);

    if (error) {
      throw new Error(`Error fetching results by student ID: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Find results by exam ID
   */
  static async findByExamId(examId: number): Promise<ResultWithDetails[]> {
    const { data, error } = await supabase
      .from('results')
      .select(`
        *,
        student:students(*),
        exam:exams(*)
      `)
      .eq('exam_id', examId);

    if (error) {
      throw new Error(`Error fetching results by exam ID: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get all results with student and exam details
   */
  static async findAllWithDetails(): Promise<ResultWithDetails[]> {
    const { data, error } = await supabase
      .from('results')
      .select(`
        *,
        student:students(*),
        exam:exams(*)
      `);

    if (error) {
      throw new Error(`Error fetching results with details: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Create new result
   */
  static async create(resultData: Omit<ResultType, 'id' | 'createdAt' | 'updatedAt'>): Promise<ResultType> {
    const resultDataWithTimestamps = {
      ...resultData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return super.create<ResultType>(resultDataWithTimestamps);
  }

  /**
   * Update result
   */
  static async updateById(id: number, resultData: Partial<ResultType>): Promise<ResultType | null> {
    const updateData = {
      ...resultData,
      updatedAt: new Date()
    };

    return super.updateById<ResultType>(id, updateData);
  }

  /**
   * Get student exam history with rankings
   */
  static async getStudentExamHistory(studentId: number): Promise<ResultWithDetails[]> {
    const results = await this.findByStudentId(studentId);
    
    // Add ranking information for each result
    for (const result of results) {
      const examResults = await this.findByExamId(result.examId);
      const sortedResults = examResults.sort((a, b) => b.score - a.score);
      const rank = sortedResults.findIndex(r => r.id === result.id) + 1;
      
      result.rank = rank;
      result.totalParticipants = examResults.length;
    }

    return results;
  }

  /**
   * Get top performers for an exam
   */
  static async getTopPerformers(examId: number, limit: number = 10): Promise<ResultWithDetails[]> {
    const results = await this.findByExamId(examId);
    return results
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);
  }

  /**
   * Calculate statistics for an exam
   */
  static async getExamStatistics(examId: number): Promise<{
    totalParticipants: number;
    averageScore: number;
    highestScore: number;
    lowestScore: number;
    passRate: number;
  }> {
    const results = await this.findByExamId(examId);
    
    if (results.length === 0) {
      return {
        totalParticipants: 0,
        averageScore: 0,
        highestScore: 0,
        lowestScore: 0,
        passRate: 0
      };
    }

    const scores = results.map(r => r.score);
    const totalParticipants = results.length;
    const averageScore = scores.reduce((sum, score) => sum + score, 0) / totalParticipants;
    const highestScore = Math.max(...scores);
    const lowestScore = Math.min(...scores);
    
    // Assuming 50% is pass mark
    const passedCount = results.filter(r => r.percentage >= 50).length;
    const passRate = (passedCount / totalParticipants) * 100;

    return {
      totalParticipants,
      averageScore: Math.round(averageScore * 100) / 100,
      highestScore,
      lowestScore,
      passRate: Math.round(passRate * 100) / 100
    };
  }
}