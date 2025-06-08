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

export interface PaperData {
  id: string;
  examId: number;
  title: string;
  instructions: string;
  totalQuestions: number;
  totalMarks: number;
  questions: QuestionData[];
  createdAt: string;
  updatedAt: string;
  metadata: {
    examName: string;
    lastUpdated: string;
    version: string;
  };
}

export class PaperFileStorage {
  private bucketName = 'exam-papers';
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
        fileSizeLimit: 52428800 // 50MB
      });
      
      if (error) {
        console.error('Manual bucket creation error:', error);
        return false;
      }
      
      this.bucketInitialized = true;
      console.log('Paper bucket created manually successfully');
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
          fileSizeLimit: 52428800 // 50MB
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
      console.error('Error initializing bucket:', error);
    }
  }

  private async getExamName(examId: number): Promise<string> {
    try {
      const exam = await this.db.select().from(exams).where(eq(exams.id, examId)).limit(1);
      return exam[0]?.name || `Exam ${examId}`;
    } catch (error) {
      console.error('Error fetching exam name:', error);
      return `Exam ${examId}`;
    }
  }

  private async getFileName(examId: number): Promise<string> {
    const examName = await this.getExamName(examId);
    // Sanitize the exam name for file system
    const sanitizedName = examName.replace(/[^a-zA-Z0-9\-_\s]/g, '').replace(/\s+/g, '_');
    return `exam_${examId}_${sanitizedName}_paper.json`;
  }

  async getPaperByExamId(examId: number): Promise<PaperData | null> {
    try {
      await this.ensureBucketExists();
      
      const fileName = await this.getFileName(examId);
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .download(fileName);
      
      if (error) {
        if (error.message.includes('Object not found')) {
          return null; // Paper doesn't exist yet
        }
        console.error('Error downloading paper:', error);
        return null;
      }
      
      const text = await data.text();
      const paperData: PaperData = JSON.parse(text);
      
      return paperData;
    } catch (error) {
      console.error('Error getting paper by exam ID:', error);
      return null;
    }
  }

  async savePaper(examId: number, paperData: Omit<PaperData, 'id' | 'examId' | 'createdAt' | 'updatedAt' | 'metadata'>): Promise<PaperData | null> {
    try {
      await this.ensureBucketExists();
      
      const fileName = await this.getFileName(examId);
      const examName = await this.getExamName(examId);
      const now = new Date().toISOString();
      
      // Check if paper already exists
      const existingPaper = await this.getPaperByExamId(examId);
      
      const fullPaperData: PaperData = {
        id: existingPaper?.id || `paper_${examId}_${Date.now()}`,
        examId,
        ...paperData,
        totalQuestions: paperData.questions.length,
        totalMarks: paperData.questions.reduce((sum, q) => sum + q.marks, 0),
        createdAt: existingPaper?.createdAt || now,
        updatedAt: now,
        metadata: {
          examName,
          lastUpdated: now,
          version: '1.0'
        }
      };
      
      const { data, error } = await supabase.storage
        .from(this.bucketName)
        .upload(fileName, JSON.stringify(fullPaperData, null, 2), {
          cacheControl: '3600',
          upsert: true
        });
      
      if (error) {
        console.error('Error saving paper:', error);
        return null;
      }
      
      return fullPaperData;
    } catch (error) {
      console.error('Error saving paper:', error);
      return null;
    }
  }

  async updatePaperDetails(examId: number, updateData: Partial<Pick<PaperData, 'title' | 'instructions'>>): Promise<PaperData | null> {
    try {
      const existingPaper = await this.getPaperByExamId(examId);
      
      if (!existingPaper) {
        // Create new paper if it doesn't exist
        const examName = await this.getExamName(examId);
        const newPaper: Omit<PaperData, 'id' | 'examId' | 'createdAt' | 'updatedAt' | 'metadata'> = {
          title: updateData.title || '',
          instructions: updateData.instructions || '',
          totalQuestions: 0,
          totalMarks: 0,
          questions: []
        };
        return await this.savePaper(examId, newPaper);
      }
      
      const updatedPaper: Omit<PaperData, 'id' | 'examId' | 'createdAt' | 'updatedAt' | 'metadata'> = {
        ...existingPaper,
        ...updateData,
        totalQuestions: existingPaper.questions.length,
        totalMarks: existingPaper.questions.reduce((sum, q) => sum + q.marks, 0)
      };
      
      return await this.savePaper(examId, updatedPaper);
    } catch (error) {
      console.error('Error updating paper details:', error);
      return null;
    }
  }

  async addQuestion(examId: number, questionData: Omit<QuestionData, 'id' | 'createdAt' | 'updatedAt'>): Promise<QuestionData | null> {
    try {
      const existingPaper = await this.getPaperByExamId(examId);
      
      if (!existingPaper) {
        console.error('Paper not found for exam ID:', examId);
        return null;
      }
      
      const now = new Date().toISOString();
      const newQuestion: QuestionData = {
        ...questionData,
        id: `question_${examId}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        createdAt: now,
        updatedAt: now
      };
      
      const updatedQuestions = [...existingPaper.questions, newQuestion];
      
      const updatedPaper: Omit<PaperData, 'id' | 'examId' | 'createdAt' | 'updatedAt' | 'metadata'> = {
        ...existingPaper,
        questions: updatedQuestions,
        totalQuestions: updatedQuestions.length,
        totalMarks: updatedQuestions.reduce((sum, q) => sum + q.marks, 0)
      };
      
      const savedPaper = await this.savePaper(examId, updatedPaper);
      return savedPaper ? newQuestion : null;
    } catch (error) {
      console.error('Error adding question:', error);
      return null;
    }
  }

  async updateQuestion(examId: number, questionId: string, updateData: Partial<Omit<QuestionData, 'id' | 'createdAt'>>): Promise<QuestionData | null> {
    try {
      const existingPaper = await this.getPaperByExamId(examId);
      
      if (!existingPaper) {
        console.error('Paper not found for exam ID:', examId);
        return null;
      }
      
      const questionIndex = existingPaper.questions.findIndex(q => q.id === questionId);
      if (questionIndex === -1) {
        console.error('Question not found:', questionId);
        return null;
      }
      
      const updatedQuestion: QuestionData = {
        ...existingPaper.questions[questionIndex],
        ...updateData,
        updatedAt: new Date().toISOString()
      };
      
      const updatedQuestions = [...existingPaper.questions];
      updatedQuestions[questionIndex] = updatedQuestion;
      
      const updatedPaper: Omit<PaperData, 'id' | 'examId' | 'createdAt' | 'updatedAt' | 'metadata'> = {
        ...existingPaper,
        questions: updatedQuestions,
        totalQuestions: updatedQuestions.length,
        totalMarks: updatedQuestions.reduce((sum, q) => sum + q.marks, 0)
      };
      
      const savedPaper = await this.savePaper(examId, updatedPaper);
      return savedPaper ? updatedQuestion : null;
    } catch (error) {
      console.error('Error updating question:', error);
      return null;
    }
  }

  async deleteQuestion(examId: number, questionId: string): Promise<boolean> {
    try {
      const existingPaper = await this.getPaperByExamId(examId);
      
      if (!existingPaper) {
        console.error('Paper not found for exam ID:', examId);
        return false;
      }
      
      const updatedQuestions = existingPaper.questions.filter(q => q.id !== questionId);
      
      const updatedPaper: Omit<PaperData, 'id' | 'examId' | 'createdAt' | 'updatedAt' | 'metadata'> = {
        ...existingPaper,
        questions: updatedQuestions,
        totalQuestions: updatedQuestions.length,
        totalMarks: updatedQuestions.reduce((sum, q) => sum + q.marks, 0)
      };
      
      const savedPaper = await this.savePaper(examId, updatedPaper);
      return !!savedPaper;
    } catch (error) {
      console.error('Error deleting question:', error);
      return false;
    }
  }

  async deletePaper(examId: number): Promise<boolean> {
    try {
      await this.ensureBucketExists();
      
      const fileName = await this.getFileName(examId);
      
      const { error } = await supabase.storage
        .from(this.bucketName)
        .remove([fileName]);
      
      if (error) {
        console.error('Error deleting paper:', error);
        return false;
      }
      
      return true;
    } catch (error) {
      console.error('Error deleting paper:', error);
      return false;
    }
  }

  async getAllPapers(): Promise<PaperData[]> {
    try {
      await this.ensureBucketExists();
      
      const { data: files, error } = await supabase.storage
        .from(this.bucketName)
        .list();
      
      if (error) {
        console.error('Error listing papers:', error);
        return [];
      }
      
      const papers: PaperData[] = [];
      
      for (const file of files || []) {
        if (file.name.endsWith('_paper.json')) {
          const { data, error: downloadError } = await supabase.storage
            .from(this.bucketName)
            .download(file.name);
          
          if (!downloadError && data) {
            try {
              const text = await data.text();
              const paperData: PaperData = JSON.parse(text);
              papers.push(paperData);
            } catch (parseError) {
              console.error('Error parsing paper file:', file.name, parseError);
            }
          }
        }
      }
      
      return papers;
    } catch (error) {
      console.error('Error getting all papers:', error);
      return [];
    }
  }
}

export const paperFileStorage = new PaperFileStorage();