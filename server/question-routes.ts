import { Request, Response, Express } from 'express';
import { storage } from './storage.js';

export function registerQuestionRoutes(app: Express, requireAdmin: any) {
  // Get questions for a specific paper - using database storage
  app.get("/api/questions/:paperId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const paperId = parseInt(req.params.paperId);
      const questions = await storage.getQuestionsByPaperId(paperId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  // Create a new question - using database storage
  app.post("/api/questions", requireAdmin, async (req: Request, res: Response) => {
    try {
      const paperId = parseInt(req.body.paperId);
      
      if (!paperId) {
        return res.status(400).json({ message: "paperId is required" });
      }

      const questionData = {
        paperId: paperId,
        type: req.body.type,
        questionText: req.body.questionText || req.body.question,
        marks: parseInt(req.body.marks),
        orderIndex: parseInt(req.body.orderIndex),
        optionA: req.body.optionA || null,
        optionB: req.body.optionB || null,
        optionC: req.body.optionC || null,
        optionD: req.body.optionD || null,
        correctAnswer: req.body.correctAnswer || null,
        expectedAnswer: req.body.expectedAnswer || null,
        answerGuidelines: req.body.answerGuidelines || null
      };
      
      const question = await storage.createQuestion(questionData);
      
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  // Update a question - using database storage
  app.put("/api/questions/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const questionId = parseInt(req.params.id);
      
      const updateData: any = {};
      if (req.body.questionText || req.body.question) {
        updateData.questionText = req.body.questionText || req.body.question;
      }
      if (req.body.type) {
        updateData.type = req.body.type;
      }
      if (req.body.optionA !== undefined) updateData.optionA = req.body.optionA;
      if (req.body.optionB !== undefined) updateData.optionB = req.body.optionB;
      if (req.body.optionC !== undefined) updateData.optionC = req.body.optionC;
      if (req.body.optionD !== undefined) updateData.optionD = req.body.optionD;
      if (req.body.correctAnswer !== undefined) updateData.correctAnswer = req.body.correctAnswer;
      if (req.body.expectedAnswer !== undefined) updateData.expectedAnswer = req.body.expectedAnswer;
      if (req.body.answerGuidelines !== undefined) updateData.answerGuidelines = req.body.answerGuidelines;
      if (req.body.marks) updateData.marks = parseInt(req.body.marks);
      if (req.body.orderIndex !== undefined) updateData.orderIndex = parseInt(req.body.orderIndex);
      
      const question = await storage.updateQuestion(questionId, updateData);
      
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  // Delete a question - using database storage
  app.delete("/api/questions/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const questionId = parseInt(req.params.id);
      
      const success = await storage.deleteQuestion(questionId);
      
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