CREATE TYPE "public"."exam_status" AS ENUM('upcoming', 'active', 'completed');--> statement-breakpoint
CREATE TYPE "public"."question_type" AS ENUM('mcq', 'written');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'student');--> statement-breakpoint
CREATE TABLE "exam_papers" (
	"id" serial PRIMARY KEY NOT NULL,
	"exam_id" integer NOT NULL,
	"title" text NOT NULL,
	"instructions" text,
	"total_questions" integer DEFAULT 0 NOT NULL,
	"total_marks" integer DEFAULT 0 NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "exams" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"subject" text NOT NULL,
	"date" timestamp NOT NULL,
	"duration" integer NOT NULL,
	"total_marks" integer NOT NULL,
	"status" "exam_status" DEFAULT 'upcoming' NOT NULL,
	"description" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "questions" (
	"id" serial PRIMARY KEY NOT NULL,
	"paper_id" integer NOT NULL,
	"type" "question_type" NOT NULL,
	"question_text" text NOT NULL,
	"marks" integer NOT NULL,
	"order_index" integer NOT NULL,
	"option_a" text,
	"option_b" text,
	"option_c" text,
	"option_d" text,
	"correct_answer" text,
	"expected_answer" text,
	"answer_guidelines" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "results" (
	"id" serial PRIMARY KEY NOT NULL,
	"student_id" integer NOT NULL,
	"exam_id" integer NOT NULL,
	"score" numeric(10, 2) NOT NULL,
	"percentage" numeric(5, 2) NOT NULL,
	"submitted_at" timestamp DEFAULT now() NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "students" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"class" text NOT NULL,
	"enrollment_date" timestamp DEFAULT now() NOT NULL,
	"phone" text,
	"address" text,
	"date_of_birth" timestamp,
	"guardian_name" text,
	"guardian_phone" text,
	"profile_image" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "students_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" text NOT NULL,
	"password" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'student' NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"profile_image" text,
	"student_id" integer,
	"email_notifications" boolean DEFAULT true NOT NULL,
	"sms_notifications" boolean DEFAULT false NOT NULL,
	"email_exam_results" boolean DEFAULT true NOT NULL,
	"email_upcoming_exams" boolean DEFAULT true NOT NULL,
	"sms_exam_results" boolean DEFAULT false NOT NULL,
	"sms_upcoming_exams" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
