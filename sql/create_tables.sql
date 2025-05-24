-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(60) NOT NULL, -- Increased length to store bcrypt hashes
  name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'student')),
  is_admin BOOLEAN NOT NULL DEFAULT FALSE,
  profile_image TEXT,
  student_id INTEGER,
  email_notifications BOOLEAN NOT NULL DEFAULT TRUE,
  sms_notifications BOOLEAN NOT NULL DEFAULT FALSE,
  email_exam_results BOOLEAN NOT NULL DEFAULT TRUE,
  email_upcoming_exams BOOLEAN NOT NULL DEFAULT TRUE,
  sms_exam_results BOOLEAN NOT NULL DEFAULT FALSE,
  sms_upcoming_exams BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Students Table
CREATE TABLE IF NOT EXISTS students (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  class VARCHAR(100) NOT NULL,
  enrollment_date TIMESTAMPTZ NOT NULL,
  phone VARCHAR(50),
  address TEXT,
  date_of_birth TIMESTAMPTZ,
  guardian_name VARCHAR(255),
  guardian_phone VARCHAR(50),
  profile_image TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Exams Table
CREATE TABLE IF NOT EXISTS exams (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(100) NOT NULL,
  date TIMESTAMPTZ NOT NULL,
  duration INTEGER NOT NULL,
  total_marks INTEGER NOT NULL,
  status VARCHAR(50) NOT NULL CHECK (status IN ('upcoming', 'active', 'completed')),
  description TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Results Table
CREATE TABLE IF NOT EXISTS results (
  id SERIAL PRIMARY KEY,
  student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
  exam_id INTEGER NOT NULL REFERENCES exams(id) ON DELETE CASCADE,
  score INTEGER NOT NULL,
  percentage NUMERIC(5,2) NOT NULL,
  submitted_at TIMESTAMPTZ NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(student_id, exam_id)
);

-- Add foreign key constraint to users table
ALTER TABLE users
ADD CONSTRAINT fk_users_student
FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE SET NULL;