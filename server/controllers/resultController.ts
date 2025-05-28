import { Request, Response } from 'express';
import { storage } from '../storage';
import { 
  insertResultSchema
} from '@shared/db-schema';

export class ResultController {
  // Get all results
  static async getAllResults(req: Request, res: Response) {
    try {
      const results = await storage.getResults();
      res.json(results);
    } catch (error) {
      console.error('Error fetching results:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get result by ID
  static async getResultById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resultId = parseInt(id);

      if (isNaN(resultId)) {
        return res.status(400).json({ message: 'Invalid result ID' });
      }

      const result = await storage.getResult(resultId);
      
      if (!result) {
        return res.status(404).json({ message: 'Result not found' });
      }

      res.json(result);
    } catch (error) {
      console.error('Error fetching result:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get results by student ID
  static async getResultsByStudentId(req: Request, res: Response) {
    try {
      const { studentId } = req.params;
      const studentIdInt = parseInt(studentId);

      if (isNaN(studentIdInt)) {
        return res.status(400).json({ message: 'Invalid student ID' });
      }

      const results = await storage.getResultsByStudentId(studentIdInt);
      res.json(results);
    } catch (error) {
      console.error('Error fetching results by student ID:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get results by exam ID
  static async getResultsByExamId(req: Request, res: Response) {
    try {
      const { examId } = req.params;
      const examIdInt = parseInt(examId);

      if (isNaN(examIdInt)) {
        return res.status(400).json({ message: 'Invalid exam ID' });
      }

      const results = await storage.getResultsByExamId(examIdInt);
      res.json(results);
    } catch (error) {
      console.error('Error fetching results by exam ID:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Create new result
  static async createResult(req: Request, res: Response) {
    try {
      const validationResult = insertResultSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }

      const resultData = validationResult.data;

      // Verify student exists
      const student = await storage.getStudent(resultData.studentId);
      if (!student) {
        return res.status(400).json({ message: 'Student not found' });
      }

      // Verify exam exists
      const exam = await storage.getExam(resultData.examId);
      if (!exam) {
        return res.status(400).json({ message: 'Exam not found' });
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

      res.status(201).json(newResult);
    } catch (error) {
      console.error('Error creating result:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update result
  static async updateResult(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resultId = parseInt(id);

      if (isNaN(resultId)) {
        return res.status(400).json({ message: 'Invalid result ID' });
      }

      // Use partial validation for updates
      const updateSchema = insertResultSchema.partial();
      const validationResult = updateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }

      const updateData = validationResult.data;

      // If score is being updated, recalculate percentage
      if (updateData.score !== undefined) {
        // Get the current result to find the exam
        const currentResult = await storage.getResult(resultId);
        if (!currentResult) {
          return res.status(404).json({ message: 'Result not found' });
        }

        // Get exam details to calculate percentage
        const exam = await storage.getExam(currentResult.exam.id);
        if (exam) {
          updateData.percentage = (updateData.score / exam.totalMarks) * 100;
        }
      }

      // Convert submittedAt string to Date object if needed
      if (updateData.submittedAt && typeof updateData.submittedAt === 'string') {
        updateData.submittedAt = new Date(updateData.submittedAt);
      }

      const updatedResult = await storage.updateResult(resultId, {
        ...updateData,
        updatedAt: new Date()
      });

      if (!updatedResult) {
        return res.status(404).json({ message: 'Result not found' });
      }

      res.json(updatedResult);
    } catch (error) {
      console.error('Error updating result:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Delete result
  static async deleteResult(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const resultId = parseInt(id);

      if (isNaN(resultId)) {
        return res.status(400).json({ message: 'Invalid result ID' });
      }

      const deleted = await storage.deleteResult(resultId);

      if (!deleted) {
        return res.status(404).json({ message: 'Result not found' });
      }

      res.json({ message: 'Result deleted successfully' });
    } catch (error) {
      console.error('Error deleting result:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get student's exam history (authenticated)
  static async getStudentExamHistory(req: Request, res: Response) {
    try {
      const user = req.session.user;
      
      if (!user || !user.studentId) {
        return res.status(400).json({ message: 'Student ID not found in session' });
      }

      const results = await storage.getResultsByStudentId(user.studentId);
      res.json(results);
    } catch (error) {
      console.error('Error fetching student exam history:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}