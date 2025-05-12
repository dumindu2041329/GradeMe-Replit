import { pgTable, text, serial, integer, boolean, timestamp, varchar } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  isAdmin: boolean("is_admin").default(false).notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  email: true,
  password: true,
  name: true,
  isAdmin: true,
});

export const loginUserSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(6, "Password must be at least 6 characters"),
});

export const students = pgTable("students", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  class: text("class").notNull(),
  enrollmentDate: timestamp("enrollment_date").notNull().defaultNow(),
});

export const insertStudentSchema = createInsertSchema(students).pick({
  name: true,
  email: true,
  class: true,
  enrollmentDate: true,
});

export const exams = pgTable("exams", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  subject: text("subject").notNull(),
  date: timestamp("date").notNull(),
  duration: integer("duration").notNull(), // in minutes
  totalMarks: integer("total_marks").notNull(),
  status: text("status").notNull().default("upcoming"), // upcoming, active, completed
});

export const insertExamSchema = createInsertSchema(exams).pick({
  name: true,
  subject: true,
  date: true,
  duration: true,
  totalMarks: true,
  status: true,
});

export const results = pgTable("results", {
  id: serial("id").primaryKey(),
  studentId: integer("student_id").notNull(),
  examId: integer("exam_id").notNull(),
  score: integer("score").notNull(),
  percentage: integer("percentage").notNull(),
  submittedAt: timestamp("submitted_at").notNull().defaultNow(),
});

export const insertResultSchema = createInsertSchema(results).pick({
  studentId: true,
  examId: true,
  score: true,
  percentage: true,
  submittedAt: true,
});

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type LoginUser = z.infer<typeof loginUserSchema>;

export type Student = typeof students.$inferSelect;
export type InsertStudent = z.infer<typeof insertStudentSchema>;

export type Exam = typeof exams.$inferSelect;
export type InsertExam = z.infer<typeof insertExamSchema>;

export type Result = typeof results.$inferSelect;
export type InsertResult = z.infer<typeof insertResultSchema>;

export type ResultWithDetails = Result & {
  student: Student;
  exam: Exam;
};

export type ExamStatus = "upcoming" | "active" | "completed";
