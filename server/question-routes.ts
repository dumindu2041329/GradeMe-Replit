import { Request, Response, Express } from 'express';
import { paperFileStorage } from './paper-file-storage.js';

export function registerQuestionRoutes(app: Express, requireAdmin: any) {
  // Get questions for a specific paper - using file storage
  app.get("/api/questions/:paperId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const paperId = parseInt(req.params.paperId);
      // For file storage, we need examId instead of paperId
      // We'll get the paper data which contains questions
      const paper = await paperFileStorage.getPaperByExamId(paperId);
      const questions = paper ? paper.questions : [];
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Create a new question - using file storage
  app.post("/api/questions", requireAdmin, async (req: Request, res: Response) => {
    try {
      const examId = parseInt(req.body.examId || req.body.paperId);
      
      if (!examId) {
        return res.status(400).json({ message: "examId is required" });
      }

      const questionData = {
        type: req.body.type,
        question: req.body.questionText || req.body.question,
        marks: parseInt(req.body.marks),
        orderIndex: parseInt(req.body.orderIndex),
        options: req.body.type === 'multiple_choice' ? [
          req.body.optionA,
          req.body.optionB,
          req.body.optionC,
          req.body.optionD
        ].filter(Boolean) : undefined,
        correctAnswer: req.body.correctAnswer || req.body.expectedAnswer || null
      };
      
      const question = await paperFileStorage.addQuestion(examId, questionData);
      
      if (!question) {
        return res.status(400).json({ message: "Failed to create question" });
      }
      
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  // Update a question - using file storage
  app.put("/api/questions/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const questionId = req.params.id;
      const examId = parseInt(req.body.examId);
      
      if (!examId) {
        return res.status(400).json({ message: "examId is required" });
      }
      
      const updateData: any = {};
      if (req.body.questionText || req.body.question) {
        updateData.question = req.body.questionText || req.body.question;
      }
      if (req.body.type) {
        updateData.type = req.body.type;
      }
      if (req.body.type === 'multiple_choice' && (req.body.optionA || req.body.optionB || req.body.optionC || req.body.optionD)) {
        updateData.options = [
          req.body.optionA,
          req.body.optionB,
          req.body.optionC,
          req.body.optionD
        ].filter(Boolean);
      }
      if (req.body.correctAnswer !== undefined || req.body.expectedAnswer !== undefined) {
        updateData.correctAnswer = req.body.correctAnswer || req.body.expectedAnswer;
      }
      if (req.body.marks) updateData.marks = parseInt(req.body.marks);
      if (req.body.orderIndex !== undefined) updateData.orderIndex = parseInt(req.body.orderIndex);
      
      const question = await paperFileStorage.updateQuestion(examId, questionId, updateData);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  // Delete a question - using file storage
  app.delete("/api/questions/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const questionId = req.params.id;
      const examId = parseInt(req.body.examId || req.query.examId as string);
      
      if (!examId) {
        return res.status(400).json({ message: "examId is required" });
      }
      
      const success = await paperFileStorage.deleteQuestion(examId, questionId);
      
      if (!success) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

}