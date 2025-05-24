import { z } from 'zod';

// Define user roles
export const userRoleEnum = z.enum(['admin', 'student']);
export type UserRole = z.infer<typeof userRoleEnum>;

// Define exam status types
export type ExamStatus = 'upcoming' | 'active' | 'completed';

// User Schema
export const userSchema = z.object({
  id: z.number(),
  email: z.string().email(),
  password: z.string(),
  name: z.string(),
  role: userRoleEnum,
  isAdmin: z.boolean(),
  profileImage: z.string().nullable(),
  studentId: z.number().nullable(),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
  emailExamResults: z.boolean().default(true),
  emailUpcomingExams: z.boolean().default(true),
  smsExamResults: z.boolean().default(false),
  smsUpcomingExams: z.boolean().default(false),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Student Schema
export const studentSchema = z.object({
  id: z.number(),
  name: z.string(),
  email: z.string().email(),
  class: z.string(),
  enrollmentDate: z.date(),
  phone: z.string().nullable(),
  address: z.string().nullable(),
  dateOfBirth: z.date().nullable(),
  guardianName: z.string().nullable(),
  guardianPhone: z.string().nullable(),
  profileImage: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Exam Schema
export const examSchema = z.object({
  id: z.number(),
  name: z.string(),
  subject: z.string(),
  date: z.date(),
  duration: z.number(), // in minutes
  totalMarks: z.number(),
  status: z.string() as z.ZodType<ExamStatus>,
  description: z.string().nullable(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Result Schema
export const resultSchema = z.object({
  id: z.number(),
  studentId: z.number(),
  examId: z.number(),
  score: z.number(),
  percentage: z.number(),
  submittedAt: z.date(),
  createdAt: z.date(),
  updatedAt: z.date()
});

// Types for easier use in the application
export type User = z.infer<typeof userSchema>;
export type Student = z.infer<typeof studentSchema>;
export type Exam = z.infer<typeof examSchema>;
export type Result = z.infer<typeof resultSchema>;

// Result with student and exam details
export type ResultWithDetails = Result & {
  student: Student;
  exam: Exam;
  rank?: number;
  totalParticipants?: number;
};

// Student dashboard data
export type StudentDashboardData = {
  totalExams: number;
  averageScore: number;
  bestRank: number;
  availableExams: Exam[];
  examHistory: ResultWithDetails[];
};

// Notification preferences
export type NotificationPreferences = {
  email: boolean;
  sms: boolean;
  emailExamResults?: boolean;
  emailUpcomingExams?: boolean;
  smsExamResults?: boolean;
  smsUpcomingExams?: boolean;
};

// Insert schemas (without auto-generated fields like id, createdAt, etc.)
export const insertUserSchema = userSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertStudentSchema = studentSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertExamSchema = examSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

export const insertResultSchema = resultSchema.omit({ 
  id: true, 
  createdAt: true, 
  updatedAt: true 
});

// Update schemas for partial updates
export const updateUserSchema = insertUserSchema.partial();
export const updateStudentSchema = insertStudentSchema.partial();

// Login schemas
export const loginUserSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

export const studentLoginSchema = z.object({
  email: z.string().email(),
  password: z.string()
});

// Password update schema
export const passwordUpdateSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6)
});

// Notification preferences schema
export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  emailExamResults: z.boolean().optional(),
  emailUpcomingExams: z.boolean().optional(),
  smsExamResults: z.boolean().optional(),
  smsUpcomingExams: z.boolean().optional()
});

// Type definitions for insert operations
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type InsertResult = z.infer<typeof insertResultSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type StudentLogin = z.infer<typeof studentLoginSchema>;
export type UpdateStudent = z.infer<typeof updateStudentSchema>;
export type PasswordUpdate = z.infer<typeof passwordUpdateSchema>;
export type NotificationUpdate = z.infer<typeof notificationPreferencesSchema>;