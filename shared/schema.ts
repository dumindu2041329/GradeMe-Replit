import { z } from "zod";

export const userRoleEnum = z.enum(['admin', 'student']);

// Type definitions for our models
export type NotificationPreferences = {
  email: boolean;
  sms: boolean;
  emailExamResults?: boolean;
  emailUpcomingExams?: boolean;
  smsExamResults?: boolean;
  smsUpcomingExams?: boolean;
};

export type User = {
  id: number;
  email: string;
  password: string;
  name: string;
  role: "admin" | "student";
  isAdmin: boolean;
  profileImage: string | null;
  studentId: number | null;
  notificationPreferences?: NotificationPreferences;
};

export type Student = {
  id: number;
  name: string;
  email: string;
  class: string;
  enrollmentDate: Date;
  password: string | null;
};

export type Exam = {
  id: number;
  name: string;
  subject: string;
  date: Date;
  duration: number; // in minutes
  totalMarks: number;
  status: ExamStatus;
  description?: string;
};

export type Result = {
  id: number;
  studentId: number;
  examId: number;
  score: number;
  percentage: number;
  submittedAt: Date;
};

export type ResultWithDetails = Result & {
  student: Student;
  exam: Exam;
  rank?: number;
  totalParticipants?: number;
};

export type ExamStatus = "upcoming" | "active" | "completed";

export type StudentDashboardData = {
  totalExams: number;
  averageScore: number;
  bestRank: number;
  availableExams: Exam[];
  examHistory: ResultWithDetails[];
};

// Schema definitions
export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  profileImage: z.string().nullable().optional(),
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const studentLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const insertStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  class: z.string(),
  enrollmentDate: z.date().optional(),
  password: z.string().min(6, "Password must be at least 6 characters").nullable().optional(),
});

export const insertExamSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  subject: z.string(),
  date: z.date(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  status: z.enum(["upcoming", "active", "completed"]).default("upcoming"),
});

export const insertResultSchema = z.object({
  studentId: z.number(),
  examId: z.number(),
  score: z.number().min(0, "Score cannot be negative"),
  percentage: z.number().min(0, "Percentage cannot be negative").max(100, "Percentage cannot exceed 100"),
  submittedAt: z.date().default(() => new Date()),
});

// Type aliases for input types
export type InsertUser = {
  email: string;
  password: string;
  name: string;
  role: "admin" | "student";
  isAdmin: boolean;
  profileImage: string | null;
  studentId: number | null;
  notificationPreferences?: NotificationPreferences;
};

export type LoginUser = z.infer<typeof loginUserSchema>;
export type UserRole = "admin" | "student";
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type StudentLogin = z.infer<typeof studentLoginSchema>;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type InsertResult = z.infer<typeof insertResultSchema>;