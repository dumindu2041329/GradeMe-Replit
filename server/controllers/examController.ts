import { Request, Response } from 'express';
import { storage } from '../storage';
import { 
  insertExamSchema, 
  examSchema
} from '@shared/db-schema';

export class ExamController {
  // Get all exams
  static async getAllExams(req: Request, res: Response) {
    try {
      const exams = await storage.getExams();
      res.json(exams);
    } catch (error) {
      console.error('Error fetching exams:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get exam by ID
  static async getExamById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const examId = parseInt(id);

      if (isNaN(examId)) {
        return res.status(400).json({ message: 'Invalid exam ID' });
      }

      const exam = await storage.getExam(examId);
      
      if (!exam) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      res.json(exam);
    } catch (error) {
      console.error('Error fetching exam:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get exams by status
  static async getExamsByStatus(req: Request, res: Response) {
    try {
      const { status } = req.params;

      if (!status) {
        return res.status(400).json({ message: 'Status is required' });
      }

      // Validate status
      const validStatuses = ['upcoming', 'active', 'completed'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ 
          message: 'Invalid status. Must be one of: upcoming, active, completed' 
        });
      }

      const exams = await storage.getExamsByStatus(status);
      res.json(exams);
    } catch (error) {
      console.error('Error fetching exams by status:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Create new exam
  static async createExam(req: Request, res: Response) {
    try {
      const validationResult = insertExamSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }

      const examData = validationResult.data;

      // Convert date string to Date object if needed
      if (typeof examData.date === 'string') {
        examData.date = new Date(examData.date);
      }

      const newExam = await storage.createExam({
        ...examData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.status(201).json(newExam);
    } catch (error) {
      console.error('Error creating exam:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update exam
  static async updateExam(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const examId = parseInt(id);

      if (isNaN(examId)) {
        return res.status(400).json({ message: 'Invalid exam ID' });
      }

      // Use partial validation for updates
      const updateSchema = insertExamSchema.partial();
      const validationResult = updateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }

      const updateData = validationResult.data;

      // Convert date string to Date object if needed
      if (updateData.date && typeof updateData.date === 'string') {
        updateData.date = new Date(updateData.date);
      }

      const updatedExam = await storage.updateExam(examId, {
        ...updateData,
        updatedAt: new Date()
      });

      if (!updatedExam) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      res.json(updatedExam);
    } catch (error) {
      console.error('Error updating exam:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Delete exam
  static async deleteExam(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const examId = parseInt(id);

      if (isNaN(examId)) {
        return res.status(400).json({ message: 'Invalid exam ID' });
      }

      const deleted = await storage.deleteExam(examId);

      if (!deleted) {
        return res.status(404).json({ message: 'Exam not found' });
      }

      res.json({ message: 'Exam deleted successfully' });
    } catch (error) {
      console.error('Error deleting exam:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get upcoming exams
  static async getUpcomingExams(req: Request, res: Response) {
    try {
      const exams = await storage.getExamsByStatus('upcoming');
      res.json(exams);
    } catch (error) {
      console.error('Error fetching upcoming exams:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get active exams
  static async getActiveExams(req: Request, res: Response) {
    try {
      const exams = await storage.getExamsByStatus('active');
      res.json(exams);
    } catch (error) {
      console.error('Error fetching active exams:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get completed exams
  static async getCompletedExams(req: Request, res: Response) {
    try {
      const exams = await storage.getExamsByStatus('completed');
      res.json(exams);
    } catch (error) {
      console.error('Error fetching completed exams:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}