-- Enable Row Level Security (RLS) on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE exams ENABLE ROW LEVEL SECURITY;
ALTER TABLE results ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for users table
CREATE POLICY "Users can view their own data" ON users
  FOR SELECT USING (auth.uid()::text = id::text OR 
                    EXISTS (SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

CREATE POLICY "Users can update their own data" ON users
  FOR UPDATE USING (auth.uid()::text = id::text OR 
                    EXISTS (SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

CREATE POLICY "Only admins can insert users" ON users
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

CREATE POLICY "Only admins can delete users" ON users
  FOR DELETE USING (EXISTS (SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

-- Create RLS policies for students table
CREATE POLICY "Students can view their own data, admins can view all" ON students
  FOR SELECT USING (auth.uid()::text = id::text OR 
                    EXISTS (SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

CREATE POLICY "Students can update their own data, admins can update all" ON students
  FOR UPDATE USING (auth.uid()::text = id::text OR 
                    EXISTS (SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

CREATE POLICY "Only admins can insert students" ON students
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

CREATE POLICY "Only admins can delete students" ON students
  FOR DELETE USING (EXISTS (SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

-- Create RLS policies for exams table
CREATE POLICY "Everyone can view exams" ON exams
  FOR SELECT USING (true);

CREATE POLICY "Only admins can insert exams" ON exams
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

CREATE POLICY "Only admins can update exams" ON exams
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

CREATE POLICY "Only admins can delete exams" ON exams
  FOR DELETE USING (EXISTS (SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

-- Create RLS policies for results table
CREATE POLICY "Students can view their own results, admins can view all" ON results
  FOR SELECT USING (auth.uid()::text = student_id::text OR 
                    EXISTS (SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

CREATE POLICY "Only admins and students can insert their own results" ON results
  FOR INSERT WITH CHECK (auth.uid()::text = student_id::text OR 
                         EXISTS (SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

CREATE POLICY "Only admins can update results" ON results
  FOR UPDATE USING (EXISTS (SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

CREATE POLICY "Only admins can delete results" ON results
  FOR DELETE USING (EXISTS (SELECT 1 FROM users u WHERE u.id::text = auth.uid()::text AND u.is_admin = true));

-- Create functions for better RLS policy management
CREATE OR REPLACE FUNCTION is_admin(user_id text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id::text = user_id AND is_admin = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_student_owner(user_id text, student_id integer)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM users 
    WHERE id::text = user_id AND student_id = student_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Update policies to use the new functions for better performance
DROP POLICY IF EXISTS "Students can view their own data, admins can view all" ON students;
DROP POLICY IF EXISTS "Students can update their own data, admins can update all" ON students;
DROP POLICY IF EXISTS "Students can view their own results, admins can view all" ON results;
DROP POLICY IF EXISTS "Only admins and students can insert their own results" ON results;

CREATE POLICY "Students can view their own data, admins can view all" ON students
  FOR SELECT USING (is_student_owner(auth.uid()::text, id) OR is_admin(auth.uid()::text));

CREATE POLICY "Students can update their own data, admins can update all" ON students
  FOR UPDATE USING (is_student_owner(auth.uid()::text, id) OR is_admin(auth.uid()::text));

CREATE POLICY "Students can view their own results, admins can view all" ON results
  FOR SELECT USING (is_student_owner(auth.uid()::text, student_id) OR is_admin(auth.uid()::text));

CREATE POLICY "Only admins and students can insert their own results" ON results
  FOR INSERT WITH CHECK (is_student_owner(auth.uid()::text, student_id) OR is_admin(auth.uid()::text));