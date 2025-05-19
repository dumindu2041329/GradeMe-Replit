import { z } from "zod";

// Enums
export const userRoleEnum = z.enum(['admin', 'student']);
export type UserRole = z.infer<typeof userRoleEnum>;
export type ExamStatus = 'upcoming' | 'active' | 'completed';

// Type definitions
export type User = {
  id: number;
  email: string;
  password: string;
  name: string;
  role: UserRole;
  isAdmin: boolean;
  profileImage: string | null;
  studentId: number | null;
  emailNotifications: boolean;
  smsNotifications: boolean;
  emailExamResults: boolean;
  emailUpcomingExams: boolean;
  smsExamResults: boolean;
  smsUpcomingExams: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type Student = {
  id: number;
  name: string;
  email: string;
  class: string;
  enrollmentDate: Date;
  phone: string | null;
  address: string | null;
  dateOfBirth: Date | null;
  guardianName: string | null;
  guardianPhone: string | null;
  profileImage: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Exam = {
  id: number;
  name: string;
  subject: string;
  date: Date;
  duration: number; // in minutes
  totalMarks: number;
  status: ExamStatus;
  description: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type Result = {
  id: number;
  studentId: number;
  examId: number;
  score: number;
  percentage: number;
  submittedAt: Date;
  createdAt: Date;
  updatedAt: Date;
};

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

export type NotificationPreferences = {
  email: boolean;
  sms: boolean;
  emailExamResults?: boolean;
  emailUpcomingExams?: boolean;
  smsExamResults?: boolean;
  smsUpcomingExams?: boolean;
};

// Validation schemas for operations
export const insertUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters"),
  role: userRoleEnum.default("student"),
  isAdmin: z.boolean().default(false),
  profileImage: z.string().nullable().optional(),
  studentId: z.number().nullable().optional()
});

export const insertStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  email: z.string().email("Invalid email format"),
  class: z.string(),
  enrollmentDate: z.date().optional().default(() => new Date()),
  phone: z.string().optional().nullable(),
  address: z.string().optional().nullable(),
  dateOfBirth: z.date().optional().nullable(),
  guardianName: z.string().optional().nullable(),
  guardianPhone: z.string().optional().nullable(),
  profileImage: z.string().optional().nullable()
});

export const insertExamSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  subject: z.string(),
  date: z.date(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  totalMarks: z.number().min(1, "Total marks must be at least 1"),
  status: z.enum(["upcoming", "active", "completed"]).default("upcoming"),
  description: z.string().optional().nullable()
});

export const insertResultSchema = z.object({
  studentId: z.number(),
  examId: z.number(),
  score: z.number().min(0, "Score cannot be negative"),
  percentage: z.number().min(0, "Percentage cannot be negative").max(100, "Percentage cannot exceed 100"),
  submittedAt: z.date().default(() => new Date())
});

export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  profileImage: z.string().nullable().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  emailExamResults: z.boolean().optional(),
  emailUpcomingExams: z.boolean().optional(),
  smsExamResults: z.boolean().optional(),
  smsUpcomingExams: z.boolean().optional()
});

export const updateStudentSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
  email: z.string().email("Invalid email format").optional(),
  class: z.string().optional(),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.date().optional().nullable(),
  guardianName: z.string().optional(),
  guardianPhone: z.string().optional(),
  profileImage: z.string().nullable().optional()
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const studentLoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters")
});

export const passwordUpdateSchema = z.object({
  currentPassword: z.string().min(6, "Password must be at least 6 characters"),
  newPassword: z.string().min(6, "Password must be at least 6 characters")
});

export const notificationPreferencesSchema = z.object({
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  emailExamResults: z.boolean().optional(),
  emailUpcomingExams: z.boolean().optional(),
  smsExamResults: z.boolean().optional(),
  smsUpcomingExams: z.boolean().optional()
});

// Type aliases for inferred types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type InsertStudent = z.infer<typeof insertStudentSchema>;
export type InsertExam = z.infer<typeof insertExamSchema>;
export type InsertResult = z.infer<typeof insertResultSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;
export type StudentLogin = z.infer<typeof studentLoginSchema>;
export type UpdateStudent = z.infer<typeof updateStudentSchema>;
export type PasswordUpdate = z.infer<typeof passwordUpdateSchema>;
export type NotificationUpdate = z.infer<typeof notificationPreferencesSchema>;