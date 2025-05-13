import { z } from "zod";
import { pgTable, serial, varchar, text, date, integer, boolean, timestamp, doublePrecision, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';
import { createInsertSchema } from 'drizzle-zod';

// Enums
export const userRoleEnum = z.enum(['admin', 'student']);
export const roleEnum = pgEnum('role', ['admin', 'student']);
export const examStatusEnum = pgEnum('exam_status', ['upcoming', 'active', 'completed']);

// Users table schema
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  role: roleEnum('role').notNull().default('student'),
  isAdmin: boolean('is_admin').notNull().default(false),
  profileImage: text('profile_image'),
  studentId: integer('student_id').references(() => students.id),
  emailNotifications: boolean('email_notifications').default(false),
  smsNotifications: boolean('sms_notifications').default(false),
  emailExamResults: boolean('email_exam_results').default(false),
  emailUpcomingExams: boolean('email_upcoming_exams').default(false),
  smsExamResults: boolean('sms_exam_results').default(false),
  smsUpcomingExams: boolean('sms_upcoming_exams').default(false),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Students table schema
export const students = pgTable('students', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  class: varchar('class', { length: 100 }).notNull(),
  enrollmentDate: date('enrollment_date').notNull().defaultNow(),
  phone: varchar('phone', { length: 20 }),
  address: text('address'),
  dateOfBirth: date('date_of_birth'),
  guardianName: varchar('guardian_name', { length: 255 }),
  guardianPhone: varchar('guardian_phone', { length: 20 }),
  profileImage: text('profile_image'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Exams table schema
export const exams = pgTable('exams', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  subject: varchar('subject', { length: 100 }).notNull(),
  date: timestamp('date').notNull(),
  duration: integer('duration').notNull(), // in minutes
  totalMarks: integer('total_marks').notNull(),
  status: examStatusEnum('status').notNull().default('upcoming'),
  description: text('description'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Results table schema
export const results = pgTable('results', {
  id: serial('id').primaryKey(),
  studentId: integer('student_id').notNull().references(() => students.id),
  examId: integer('exam_id').notNull().references(() => exams.id),
  score: doublePrecision('score').notNull(),
  percentage: doublePrecision('percentage').notNull(),
  submittedAt: timestamp('submitted_at').notNull().defaultNow(),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

// Define relations
export const usersRelations = relations(users, ({ one }) => ({
  student: one(students, {
    fields: [users.studentId],
    references: [students.id],
  }),
}));

export const studentsRelations = relations(students, ({ many }) => ({
  results: many(results),
}));

export const examsRelations = relations(exams, ({ many }) => ({
  results: many(results),
}));

export const resultsRelations = relations(results, ({ one }) => ({
  student: one(students, {
    fields: [results.studentId],
    references: [students.id],
  }),
  exam: one(exams, {
    fields: [results.examId],
    references: [exams.id],
  }),
}));

// Type definitions for our models based on the schema
export type User = typeof users.$inferSelect;
export type Student = typeof students.$inferSelect;
export type Exam = typeof exams.$inferSelect;
export type Result = typeof results.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type ResultWithDetails = Result & {
  student: Student;
  exam: Exam;
  rank?: number;
  totalParticipants?: number;
};

export type ExamStatus = 'upcoming' | 'active' | 'completed';

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

// Create insert schemas using drizzle-zod
export const insertUserSchema = createInsertSchema(users);
export const insertStudentSchema = createInsertSchema(students);
export const insertExamSchema = createInsertSchema(exams);
export const insertResultSchema = createInsertSchema(results);

// Custom schemas for various operations
export const updateUserSchema = z.object({
  name: z.string().optional(),
  email: z.string().email("Invalid email format").optional(),
  profileImage: z.string().nullable().optional(),
  emailNotifications: z.boolean().optional(),
  smsNotifications: z.boolean().optional(),
  emailExamResults: z.boolean().optional(),
  emailUpcomingExams: z.boolean().optional(),
  smsExamResults: z.boolean().optional(),
  smsUpcomingExams: z.boolean().optional(),
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
  smsUpcomingExams: z.boolean().optional(),
});

// Type aliases for inferred types
export type LoginUser = z.infer<typeof loginUserSchema>;
export type UserRole = "admin" | "student";
export type StudentLogin = z.infer<typeof studentLoginSchema>;
export type UpdateStudent = z.infer<typeof updateStudentSchema>;
export type PasswordUpdate = z.infer<typeof passwordUpdateSchema>;
export type NotificationUpdate = z.infer<typeof notificationPreferencesSchema>;