import { getDb } from './db-connection.js';
import { questions } from '../shared/schema.js';
import { eq } from 'drizzle-orm';

export class DatabaseQuestionStorage {
  private db = getDb();

  async getQuestionsByPaperId(paperId: number) {
    try {
      const questionList = await this.db
        .select()
        .from(questions)
        .where(eq(questions.paperId, paperId))
        .orderBy(questions.orderIndex);
      
      return questionList;
    } catch (error) {
      console.error('Error fetching questions from database:', error);
      return [];
    }
  }

  async createQuestion(questionData: {
    paperId: number;
    type: string;
    questionText: string;
    marks: number;
    orderIndex: number;
    optionA?: string | null;
    optionB?: string | null;
    optionC?: string | null;
    optionD?: string | null;
    correctAnswer?: string | null;
    expectedAnswer?: string | null;
    answerGuidelines?: string | null;
  }) {
    try {
      const [newQuestion] = await this.db
        .insert(questions)
        .values({
          paperId: questionData.paperId,
          type: questionData.type as 'mcq' | 'written',
          questionText: questionData.questionText,
          marks: questionData.marks,
          orderIndex: questionData.orderIndex,
          optionA: questionData.optionA,
          optionB: questionData.optionB,
          optionC: questionData.optionC,
          optionD: questionData.optionD,
          correctAnswer: questionData.correctAnswer,
          expectedAnswer: questionData.expectedAnswer,
          answerGuidelines: questionData.answerGuidelines,
        })
        .returning();
      
      return newQuestion;
    } catch (error) {
      console.error('Error creating question in database:', error);
      throw error;
    }
  }

  async updateQuestion(id: number, questionData: Partial<{
    questionText: string;
    type: 'mcq' | 'written';
    marks: number;
    orderIndex: number;
    optionA: string;
    optionB: string;
    optionC: string;
    optionD: string;
    correctAnswer: string;
    expectedAnswer: string;
    answerGuidelines: string;
  }>) {
    try {
      const updateFields: any = {
        updatedAt: new Date(),
      };
      
      if (questionData.questionText) updateFields.questionText = questionData.questionText;
      if (questionData.type) updateFields.type = questionData.type;
      if (questionData.marks) updateFields.marks = questionData.marks;
      if (questionData.orderIndex) updateFields.orderIndex = questionData.orderIndex;
      if (questionData.optionA) updateFields.optionA = questionData.optionA;
      if (questionData.optionB) updateFields.optionB = questionData.optionB;
      if (questionData.optionC) updateFields.optionC = questionData.optionC;
      if (questionData.optionD) updateFields.optionD = questionData.optionD;
      if (questionData.correctAnswer) updateFields.correctAnswer = questionData.correctAnswer;
      if (questionData.expectedAnswer) updateFields.expectedAnswer = questionData.expectedAnswer;
      if (questionData.answerGuidelines) updateFields.answerGuidelines = questionData.answerGuidelines;
      
      const [updatedQuestion] = await this.db
        .update(questions)
        .set(updateFields)
        .where(eq(questions.id, id))
        .returning();
      
      return updatedQuestion;
    } catch (error) {
      console.error('Error updating question in database:', error);
      return null;
    }
  }

  async deleteQuestion(id: number) {
    try {
      await this.db
        .delete(questions)
        .where(eq(questions.id, id));
      
      return true;
    } catch (error) {
      console.error('Error deleting question from database:', error);
      return false;
    }
  }
}

export const databaseQuestionStorage = new DatabaseQuestionStorage();