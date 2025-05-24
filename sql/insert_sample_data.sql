-- Insert Admin User
INSERT INTO users (email, password, name, role, is_admin)
VALUES ('admin@grademe.com', 'password123', 'Admin User', 'admin', TRUE)
ON CONFLICT (email) DO NOTHING;

-- Insert Sample Students
INSERT INTO students (name, email, class, enrollment_date)
VALUES ('John Doe', 'john@example.com', 'Class 10A', '2024-01-15')
ON CONFLICT (email) DO NOTHING;

INSERT INTO students (name, email, class, enrollment_date)
VALUES ('Jane Smith', 'jane@example.com', 'Class 10B', '2024-01-20')
ON CONFLICT (email) DO NOTHING;

-- Insert Student User Accounts
-- We need to get the IDs of the students we just inserted
DO $$
DECLARE
    john_id INTEGER;
    jane_id INTEGER;
BEGIN
    SELECT id INTO john_id FROM students WHERE email = 'john@example.com';
    SELECT id INTO jane_id FROM students WHERE email = 'jane@example.com';

    -- Insert student users
    INSERT INTO users (email, password, name, role, is_admin, student_id)
    VALUES ('john@example.com', 'student123', 'John Doe', 'student', FALSE, john_id)
    ON CONFLICT (email) DO NOTHING;

    INSERT INTO users (email, password, name, role, is_admin, student_id)
    VALUES ('jane@example.com', 'student123', 'Jane Smith', 'student', FALSE, jane_id)
    ON CONFLICT (email) DO NOTHING;
END $$;

-- Insert Sample Exams
INSERT INTO exams (name, subject, date, duration, total_marks, status, description)
VALUES 
('Mathematics Final', 'Mathematics', '2024-06-25', 180, 100, 'upcoming', 'Final mathematics examination covering all topics from the semester'),
('Physics Mid-term', 'Physics', '2024-05-15', 120, 75, 'active', 'Mid-term physics test covering mechanics and thermodynamics'),
('Chemistry Quiz', 'Chemistry', '2024-04-10', 60, 50, 'completed', 'Quick quiz on organic chemistry fundamentals'),
('Biology Semester Test', 'Biology', '2024-03-20', 90, 60, 'completed', 'Comprehensive test on cellular biology and genetics')
ON CONFLICT DO NOTHING;

-- Insert Sample Results
DO $$
DECLARE
    john_id INTEGER;
    jane_id INTEGER;
    bio_exam_id INTEGER;
    chem_exam_id INTEGER;
BEGIN
    SELECT id INTO john_id FROM students WHERE email = 'john@example.com';
    SELECT id INTO jane_id FROM students WHERE email = 'jane@example.com';
    SELECT id INTO bio_exam_id FROM exams WHERE name = 'Biology Semester Test';
    SELECT id INTO chem_exam_id FROM exams WHERE name = 'Chemistry Quiz';

    -- Insert results for students
    INSERT INTO results (student_id, exam_id, score, percentage, submitted_at)
    VALUES 
    (john_id, bio_exam_id, 52, 87, '2024-03-20'),
    (john_id, chem_exam_id, 43, 86, '2024-04-10'),
    (jane_id, chem_exam_id, 44, 88, '2024-04-10'),
    (jane_id, bio_exam_id, 54, 90, '2024-03-20')
    ON CONFLICT (student_id, exam_id) DO NOTHING;
END $$;