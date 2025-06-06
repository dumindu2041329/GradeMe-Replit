import { Request, Response, Express } from 'express';
import { questionFileStorage } from './question-file-storage.js';

export function registerQuestionRoutes(app: Express, requireAdmin: any) {
  // Get questions for a specific paper - now using file storage
  app.get("/api/questions/:paperId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const paperId = parseInt(req.params.paperId);
      const questions = await questionFileStorage.getQuestionsByPaperId(paperId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Create a new question - now using file storage
  app.post("/api/questions", requireAdmin, async (req: Request, res: Response) => {
    try {
      const paperId = parseInt(req.body.paperId);
      const examId = parseInt(req.body.examId);
      
      if (!paperId || !examId) {
        return res.status(400).json({ message: "paperId and examId are required" });
      }

      const questionData = {
        question: req.body.question,
        type: req.body.type,
        options: req.body.options,
        correctAnswer: req.body.correctAnswer,
        marks: parseInt(req.body.marks),
        orderIndex: parseInt(req.body.orderIndex)
      };
      
      const question = await questionFileStorage.addQuestion(paperId, examId, questionData);
      
      if (!question) {
        return res.status(500).json({ message: "Failed to create question" });
      }
      
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  // Update a question - now using file storage
  app.put("/api/questions/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const questionId = req.params.id;
      const paperId = parseInt(req.body.paperId);
      const examId = parseInt(req.body.examId);
      
      if (!paperId || !examId) {
        return res.status(400).json({ message: "paperId and examId are required" });
      }

      const updateData = {
        ...(req.body.question && { question: req.body.question }),
        ...(req.body.type && { type: req.body.type }),
        ...(req.body.options && { options: req.body.options }),
        ...(req.body.correctAnswer && { correctAnswer: req.body.correctAnswer }),
        ...(req.body.marks && { marks: parseInt(req.body.marks) }),
        ...(req.body.orderIndex && { orderIndex: parseInt(req.body.orderIndex) })
      };
      
      const question = await questionFileStorage.updateQuestion(paperId, examId, questionId, updateData);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  // Delete a question - now using file storage
  app.delete("/api/questions/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const questionId = req.params.id;
      const paperId = parseInt(req.body.paperId || req.query.paperId as string);
      const examId = parseInt(req.body.examId || req.query.examId as string);
      
      if (!paperId || !examId) {
        return res.status(400).json({ message: "paperId and examId are required" });
      }
      
      const success = await questionFileStorage.deleteQuestion(paperId, examId, questionId);
      
      if (!success) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });

  // Get complete question file for a paper (for editing)
  app.get("/api/question-file/:paperId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const paperId = parseInt(req.params.paperId);
      const questionFile = await questionFileStorage.getQuestionFile(paperId);
      
      if (!questionFile) {
        return res.status(404).json({ message: "Question file not found" });
      }
      
      res.json(questionFile);
    } catch (error) {
      console.error("Error fetching question file:", error);
      res.status(500).json({ message: "Failed to fetch question file" });
    }
  });

  // Bulk save questions for a paper (for editing)
  app.put("/api/question-file/:paperId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const paperId = parseInt(req.params.paperId);
      const examId = parseInt(req.body.examId);
      const questions = req.body.questions;
      
      if (!examId || !Array.isArray(questions)) {
        return res.status(400).json({ message: "examId and questions array are required" });
      }
      
      const success = await questionFileStorage.saveQuestions(paperId, examId, questions);
      
      if (!success) {
        return res.status(500).json({ message: "Failed to save questions" });
      }
      
      res.json({ message: "Questions saved successfully" });
    } catch (error) {
      console.error("Error saving question file:", error);
      res.status(500).json({ message: "Failed to save question file" });
    }
  });
}