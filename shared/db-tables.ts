import { pgTable, serial, text, boolean, timestamp, integer, decimal, pgEnum } from "drizzle-orm/pg-core";

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
  duration: integer('duration').notNull(),
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