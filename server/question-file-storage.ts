import { createClient } from '@supabase/supabase-js';
import { getDb } from './db-connection.js';
import { exams } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

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
  private bucketInitialized = false;
  private db = getDb();

  constructor() {
    // Initialize bucket asynchronously without blocking constructor
    this.initializeBucket().catch(console.error);
  }

  private async ensureBucketExists() {
    if (!this.bucketInitialized) {
      await this.initializeBucket();
    }
  }

  // Manual bucket creation for when automatic creation fails
  async createBucketManually(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage.createBucket(this.bucketName, {
        public: false,
        allowedMimeTypes: ['application/json'],
        fileSizeLimit: 10485760 // 10MB
      });
      
      if (error) {
        console.error('Manual bucket creation error:', error);
        return false;
      }
      
      this.bucketInitialized = true;
      console.log('Bucket created manually successfully');
      return true;
    } catch (error) {
      console.error('Manual bucket creation failed:', error);
      return false;
    }
  }

  private async initializeBucket() {
    try {
      // Check if bucket exists, create if it doesn't
      const { data: buckets, error: listError } = await supabase.storage.listBuckets();
      
      if (listError) {
        console.error('Error listing buckets:', listError);
        return;
      }
      
      const bucketExists = buckets?.some(bucket => bucket.name === this.bucketName);
      
      if (!bucketExists) {
        console.log(`Creating storage bucket: ${this.bucketName}`);
        const { data, error } = await supabase.storage.createBucket(this.bucketName, {
          public: false,
          allowedMimeTypes: ['application/json'],
          fileSizeLimit: 10485760 // 10MB
        });
        
        if (error) {
          console.error('Error creating storage bucket:', error);
        } else {
          console.log('Storage bucket created successfully');
          this.bucketInitialized = true;
        }
      } else {
        console.log('Storage bucket already exists');
        this.bucketInitialized = true;
      }
    } catch (error) {
      console.error('Error initializing storage bucket:', error);
    }
  }

  private async getExamName(examId: number): Promise<string> {
    try {
      const result = await this.db.select({ name: exams.name }).from(exams).where(eq(exams.id, examId)).limit(1);
      if (result.length > 0) {
        // Sanitize exam name for folder creation (remove special characters)
        return result[0].name.replace(/[^a-zA-Z0-9\s-_]/g, '').replace(/\s+/g, '-');
      }
      return `exam-${examId}`; // fallback to ID if name not found
    } catch (error) {
      console.error('Error fetching exam name:', error);
      return `exam-${examId}`; // fallback to ID on error
    }
  }

  private async getFileName(paperId: number, examId?: number): Promise<string> {
    if (examId) {
      const examName = await this.getExamName(examId);
      return `${examName}/paper-${paperId}-questions.json`;
    }
    return `paper-${paperId}-questions.json`;
  }

  async getQuestionsByPaperId(paperId: number, examId?: number): Promise<QuestionData[]> {
    try {
      await this.ensureBucketExists();
      
      let fileName;
      if (examId) {
        fileName = await this.getFileName(paperId, examId);
      } else {
        // If examId not provided, try both new and old format
        fileName = await this.getFileName(paperId);
      }
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(fileName);

      if (error) {
        if (error.message.includes('Object not found') || error.message.includes('not found')) {
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
      await this.ensureBucketExists();
      
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

      const fileName = await this.getFileName(paperId, examId);
      const fileContent = JSON.stringify(questionFile, null, 2);
      
      // For Node.js environment, use Buffer instead of Blob
      const fileBuffer = Buffer.from(fileContent, 'utf-8');
      
      const { error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, fileBuffer, {
          contentType: 'application/json',
          upsert: true
        });

      if (error) {
        console.error('Supabase upload error:', error);
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
      const existingQuestions = await this.getQuestionsByPaperId(paperId, examId);
      
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
      const existingQuestions = await this.getQuestionsByPaperId(paperId, examId);
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
      const existingQuestions = await this.getQuestionsByPaperId(paperId, examId);
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

  async deleteAllQuestions(paperId: number, examId?: number): Promise<boolean> {
    try {
      const fileName = await this.getFileName(paperId, examId);
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

  async getQuestionFile(paperId: number, examId?: number): Promise<QuestionFile | null> {
    try {
      const fileName = await this.getFileName(paperId, examId);
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

  // Method to get all questions for an entire exam (all papers)
  async getAllQuestionsByExamId(examId: number): Promise<{ paperId: number; questions: QuestionData[]; paperTitle?: string }[]> {
    try {
      const examName = await this.getExamName(examId);
      const { data: files, error } = await supabase.storage
        .from(this.bucketName)
        .list(`${examName}/`);

      if (error || !files) {
        return [];
      }

      const examQuestions = [];
      for (const file of files) {
        if (file.name.endsWith('.json')) {
          const paperIdMatch = file.name.match(/paper-(\d+)-questions\.json/);
          if (paperIdMatch) {
            const paperId = parseInt(paperIdMatch[1]);
            const questions = await this.getQuestionsByPaperId(paperId, examId);
            examQuestions.push({ paperId, questions });
          }
        }
      }

      return examQuestions;
    } catch (error) {
      console.error('Error fetching all questions for exam:', error);
      return [];
    }
  }

  // Method to delete all questions for an entire exam
  async deleteAllQuestionsForExam(examId: number): Promise<boolean> {
    try {
      const examName = await this.getExamName(examId);
      const { data: files, error } = await supabase.storage
        .from(this.bucketName)
        .list(`${examName}/`);

      if (error || !files) {
        return true; // No files to delete
      }

      const filesToDelete = files.map(file => `${examName}/${file.name}`);
      
      if (filesToDelete.length > 0) {
        const { error: deleteError } = await supabase.storage
          .from(this.bucketName)
          .remove(filesToDelete);

        if (deleteError) {
          throw deleteError;
        }
      }

      return true;
    } catch (error) {
      console.error('Error deleting all questions for exam:', error);
      return false;
    }
  }
}

export const questionFileStorage = new QuestionFileStorage();