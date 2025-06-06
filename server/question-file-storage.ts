import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

export interface QuestionData {
  id: string;
  question: string;
  type: 'multiple_choice' | 'short_answer' | 'essay' | 'true_false';
  options?: string[];
  correctAnswer?: string;
  marks: number;
  orderIndex: number;
  createdAt: string;
  updatedAt: string;
}

export interface QuestionFile {
  paperId: number;
  examId: number;
  questions: QuestionData[];
  metadata: {
    totalQuestions: number;
    totalMarks: number;
    lastUpdated: string;
  };
}

export class QuestionFileStorage {
  private bucketName = 'exam-questions';

  constructor() {
    this.initializeBucket();
  }

  private async initializeBucket() {
    try {
      // Check if bucket exists, create if it doesn't
      const { data: buckets } = await supabase.storage.listBuckets();
      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        await supabase.storage.createBucket(this.bucketName, {
          public: false,
          allowedMimeTypes: ['application/json'],
          fileSizeLimit: 10485760 // 10MB
        });
      }
    } catch (error) {
      console.error('Error initializing storage bucket:', error);
    }
  }

  private getFileName(paperId: number): string {
    return `paper-${paperId}-questions.json`;
  }

  async getQuestionsByPaperId(paperId: number): Promise<QuestionData[]> {
    try {
      const fileName = this.getFileName(paperId);
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(fileName);

      if (error) {
        if (error.message.includes('Object not found')) {
          return []; // Return empty array if file doesn't exist
        }
        throw error;
      }

      const text = await data.text();
      const questionFile: QuestionFile = JSON.parse(text);
      return questionFile.questions || [];
    } catch (error) {
      console.error('Error fetching questions from file storage:', error);
      return [];
    }
  }

  async saveQuestions(paperId: number, examId: number, questions: QuestionData[]): Promise<boolean> {
    try {
      const questionFile: QuestionFile = {
        paperId,
        examId,
        questions,
        metadata: {
          totalQuestions: questions.length,
          totalMarks: questions.reduce((sum, q) => sum + q.marks, 0),
          lastUpdated: new Date().toISOString()
        }
      };

      const fileName = this.getFileName(paperId);
      const fileContent = JSON.stringify(questionFile, null, 2);
      
      const { error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, fileContent, {
          contentType: 'application/json',
          upsert: true
        });

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error saving questions to file storage:', error);
      return false;
    }
  }

  async addQuestion(paperId: number, examId: number, questionData: Omit<QuestionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuestionData | null> {
    try {
      const existingQuestions = await this.getQuestionsByPaperId(paperId);
      
      const newQuestion: QuestionData = {
        ...questionData,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const updatedQuestions = [...existingQuestions, newQuestion];
      const success = await this.saveQuestions(paperId, examId, updatedQuestions);
      
      return success ? newQuestion : null;
    } catch (error) {
      console.error('Error adding question:', error);
      return null;
    }
  }

  async updateQuestion(paperId: number, examId: number, questionId: string, updateData: Partial<Omit<QuestionData, 'id' | 'createdAt'>>): Promise<QuestionData | null> {
    try {
      const existingQuestions = await this.getQuestionsByPaperId(paperId);
      const questionIndex = existingQuestions.findIndex(q => q.id === questionId);
      
      if (questionIndex === -1) {
        return null;
      }

      const updatedQuestion: QuestionData = {
        ...existingQuestions[questionIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };

      const updatedQuestions = [...existingQuestions];
      updatedQuestions[questionIndex] = updatedQuestion;

      const success = await this.saveQuestions(paperId, examId, updatedQuestions);
      return success ? updatedQuestion : null;
    } catch (error) {
      console.error('Error updating question:', error);
      return null;
    }
  }

  async deleteQuestion(paperId: number, examId: number, questionId: string): Promise<boolean> {
    try {
      const existingQuestions = await this.getQuestionsByPaperId(paperId);
      const filteredQuestions = existingQuestions.filter(q => q.id !== questionId);
      
      if (filteredQuestions.length === existingQuestions.length) {
        return false; // Question not found
      }

      return await this.saveQuestions(paperId, examId, filteredQuestions);
    } catch (error) {
      console.error('Error deleting question:', error);
      return false;
    }
  }

  async deleteAllQuestions(paperId: number): Promise<boolean> {
    try {
      const fileName = this.getFileName(paperId);
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([fileName]);

      if (error) {
        throw error;
      }

      return true;
    } catch (error) {
      console.error('Error deleting question file:', error);
      return false;
    }
  }

  async getQuestionFile(paperId: number): Promise<QuestionFile | null> {
    try {
      const fileName = this.getFileName(paperId);
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(fileName);

      if (error) {
        if (error.message.includes('Object not found')) {
          return null;
        }
        throw error;
      }

      const text = await data.text();
      return JSON.parse(text) as QuestionFile;
    } catch (error) {
      console.error('Error fetching question file:', error);
      return null;
    }
  }
}

export const questionFileStorage = new QuestionFileStorage();