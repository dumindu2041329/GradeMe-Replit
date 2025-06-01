import { pgTable, serial, text, boolean, timestamp, integer, decimal, pgEnum } from "drizzle-orm/pg-core";
import { createInsertSchema, createSelectSchema } from "drizzle-zod";
import { z } from "zod";

// Database enums
export const userRoleEnum = pgEnum('user_role', ['admin', 'student']);
export const examStatusEnum = pgEnum('exam_status', ['upcoming', 'active', 'completed']);

// Database tables
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  name: text('name').notNull(),
  role: userRoleEnum('role').notNull().default('student'),
  isAdmin: boolean('is_admin').notNull().default(false),
  profileImage: text('profile_image'),
  studentId: integer('student_id'),
  emailNotifications: boolean('email_notifications').notNull().default(true),
  smsNotifications: boolean('sms_notifications').notNull().default(false),
  emailExamResults: boolean('email_exam_results').notNull().default(true),
  emailUpcomingExams: boolean('email_upcoming_exams').notNull().default(true),
  smsExamResults: boolean('sms_exam_results').notNull().default(false),
  smsUpcomingExams: boolean('sms_upcoming_exams').notNull().default(false),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  email: text('email').notNull().unique(),
  class: text('class').notNull(),
  enrollmentDate: timestamp('enrollment_date').notNull().defaultNow(),
  phone: text('phone'),
  address: text('address'),
  dateOfBirth: timestamp('date_of_birth'),
  guardianName: text('guardian_name'),
  guardianPhone: text('guardian_phone'),
  profileImage: text('profile_image'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const exams = pgTable('exams', {
  id: serial('id').primaryKey(),
  name: text('name').notNull(),
  subject: text('subject').notNull(),
  date: timestamp('date').notNull(),
  duration: integer('duration').notNull(), // in minutes
  totalMarks: integer('total_marks').notNull(),
  status: examStatusEnum('status').notNull().default('upcoming'),
  description: text('description'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const results = pgTable('results', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull(),
  examId: integer('exam_id').notNull(),
  score: decimal('score', { precision: 10, scale: 2 }).notNull(),
  percentage: decimal('percentage', { precision: 5, scale: 2 }).notNull(),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const examPapers = pgTable('exam_papers', {
  id: serial('id').primaryKey(),
  examId: integer('exam_id').notNull(),
  title: text('title').notNull(),
  instructions: text('instructions'),
  totalQuestions: integer('total_questions').notNull().default(0),
  totalMarks: integer('total_marks').notNull().default(0),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

export const questions = pgTable('questions', {
  id: serial('id').primaryKey(),
  paperId: integer('paper_id').notNull(),
  type: text('type').notNull(), // 'mcq' or 'written'
  questionText: text('question_text').notNull(),
  marks: integer('marks').notNull(),
  orderIndex: integer('order_index').notNull(),
  // MCQ options
  optionA: text('option_a'),
  optionB: text('option_b'),
  optionC: text('option_c'),
  optionD: text('option_d'),
  correctAnswer: text('correct_answer'),
  // Written answer fields
  expectedAnswer: text('expected_answer'),
  answerGuidelines: text('answer_guidelines'),
  createdAt: timestamp('created_at').notNull().defaultNow(),
  updatedAt: timestamp('updated_at').notNull().defaultNow(),
});

// Type definitions
export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type Result = typeof results.$inferSelect;
export type ExamPaper = typeof examPapers.$inferSelect;
export type Question = typeof questions.$inferSelect;

// Insert schemas using Zod instead of createInsertSchema to avoid type issues
export const insertUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  name: z.string().min(2),
  role: z.enum(['admin', 'student']).default('student'),
  isAdmin: z.boolean().default(false),
  profileImage: z.string().nullable().optional(),
  studentId: z.number().nullable().optional(),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  emailExamResults: z.boolean().default(true),
  emailUpcomingExams: z.boolean().default(true),
  smsExamResults: z.boolean().default(false),
  smsUpcomingExams: z.boolean().default(false),
});

export const insertStudentSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  class: z.string(),
  enrollmentDate: z.date().optional(),
  phone: z.string().nullable().optional(),
  address: z.string().nullable().optional(),
  dateOfBirth: z.date().nullable().optional(),
  guardianName: z.string().nullable().optional(),
  guardianPhone: z.string().nullable().optional(),
  profileImage: z.string().nullable().optional(),
});

export const insertExamSchema = z.object({
  name: z.string().min(2),
  subject: z.string(),
  date: z.date(),
  duration: z.number().min(1),
  totalMarks: z.number().min(1),
  status: z.enum(['upcoming', 'active', 'completed']).default('upcoming'),
  description: z.string().nullable().optional(),
});

export const insertResultSchema = z.object({
  studentId: z.number(),
  examId: z.number(),
  score: z.string(),
  percentage: z.string(),
  submittedAt: z.date().optional(),
});

export const insertExamPaperSchema = z.object({
  examId: z.number(),
  title: z.string().min(2),
  instructions: z.string().nullable().optional(),
  totalQuestions: z.number().default(0),
  totalMarks: z.number().default(0),
});

export const insertQuestionSchema = z.object({
  paperId: z.number(),
  type: z.enum(['mcq', 'written']),
  questionText: z.string().min(5),
  marks: z.number().min(1),
  orderIndex: z.number(),
  optionA: z.string().nullable().optional(),
  optionB: z.string().nullable().optional(),
  optionC: z.string().nullable().optional(),
  optionD: z.string().nullable().optional(),
  correctAnswer: z.string().nullable().optional(),
  expectedAnswer: z.string().nullable().optional(),
  answerGuidelines: z.string().nullable().optional(),
});

// Update schemas
export const updateUserSchema = insertUserSchema.partial();
export const updateStudentSchema = insertStudentSchema.partial();
export const updateExamSchema = insertExamSchema.partial();
export const updateResultSchema = insertResultSchema.partial();
export const updateExamPaperSchema = insertExamPaperSchema.partial();
export const updateQuestionSchema = insertQuestionSchema.partial();

// Login schemas
export const loginUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters")
});

// Type aliases
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type InsertResult = z.infer<typeof insertResultSchema>;
export type InsertExamPaper = z.infer<typeof insertExamPaperSchema>;
export type InsertQuestion = z.infer<typeof insertQuestionSchema>;
export type UpdateUser = z.infer<typeof updateUserSchema>;
export type UpdateStudent = z.infer<typeof updateStudentSchema>;
export type UpdateExam = z.infer<typeof updateExamSchema>;
export type UpdateResult = z.infer<typeof updateResultSchema>;
export type UpdateExamPaper = z.infer<typeof updateExamPaperSchema>;
export type UpdateQuestion = z.infer<typeof updateQuestionSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type PasswordUpdate = z.infer<typeof passwordUpdateSchema>;

// Complex types
export type ResultWithDetails = Result & {
  student: Student;
  exam: Exam;
  rank?: number;
  totalParticipants?: number;
};

export type StudentDashboardData = {
  totalExams: number;
  averageScore: number;
  bestRank: number;
  availableExams: Exam[];
  examHistory: ResultWithDetails[];
};

export type UserRole = 'admin' | 'student';
export type ExamStatus = 'upcoming' | 'active' | 'completed';