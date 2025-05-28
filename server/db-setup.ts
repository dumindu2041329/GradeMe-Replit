import supabase from './db';
import { hashPassword } from './utils/password-utils';

/**
 * Creates the necessary database tables in Supabase if they don't exist.
 */
export async function setupDatabase() {
  console.log('Setting up database tables...');
  
  try {
    // Create users table
    const { error: usersTableError } = await supabase.rpc('create_users_table');
    if (usersTableError && !usersTableError.message.includes('already exists')) {
      console.log('Creating users table manually...');
      // Try to create with SQL if RPC doesn't work
      const { error } = await supabase.from('users').select('id').limit(1);
      if (error && error.code === '42P01') {
        console.log('Users table does not exist. Please create it in Supabase dashboard with these columns:');
        console.log('- id: int8 (primary key, auto-increment)');
        console.log('- email: text (unique)');
        console.log('- password: text');
        console.log('- name: text');
        console.log('- role: text');
        console.log('- is_admin: bool (default: false)');
        console.log('- profile_image: text (nullable)');
        console.log('- student_id: int8 (nullable)');
        console.log('- email_notifications: bool (default: true)');
        console.log('- sms_notifications: bool (default: false)');
        console.log('- email_exam_results: bool (default: true)');
        console.log('- email_upcoming_exams: bool (default: true)');
        console.log('- sms_exam_results: bool (default: false)');
        console.log('- sms_upcoming_exams: bool (default: false)');
        console.log('- created_at: timestamptz (default: now())');
        console.log('- updated_at: timestamptz (default: now())');
      }
    }

    // Create students table
    const { error: studentsError } = await supabase.from('students').select('id').limit(1);
    if (studentsError && studentsError.code === '42P01') {
      console.log('Students table does not exist. Please create it in Supabase dashboard with these columns:');
      console.log('- id: int8 (primary key, auto-increment)');
      console.log('- name: text');
      console.log('- email: text (unique)');
      console.log('- class: text');
      console.log('- enrollment_date: date');
      console.log('- phone: text (nullable)');
      console.log('- address: text (nullable)');
      console.log('- date_of_birth: date (nullable)');
      console.log('- guardian_name: text (nullable)');
      console.log('- guardian_phone: text (nullable)');
      console.log('- profile_image: text (nullable)');
      console.log('- created_at: timestamptz (default: now())');
      console.log('- updated_at: timestamptz (default: now())');
    }

    // Create exams table
    const { error: examsError } = await supabase.from('exams').select('id').limit(1);
    if (examsError && examsError.code === '42P01') {
      console.log('Exams table does not exist. Please create it in Supabase dashboard with these columns:');
      console.log('- id: int8 (primary key, auto-increment)');
      console.log('- name: text');
      console.log('- subject: text');
      console.log('- date: timestamptz');
      console.log('- duration: int4 (minutes)');
      console.log('- total_marks: int4');
      console.log('- status: text');
      console.log('- description: text (nullable)');
      console.log('- created_at: timestamptz (default: now())');
      console.log('- updated_at: timestamptz (default: now())');
    }

    // Create results table
    const { error: resultsError } = await supabase.from('results').select('id').limit(1);
    if (resultsError && resultsError.code === '42P01') {
      console.log('Results table does not exist. Please create it in Supabase dashboard with these columns:');
      console.log('- id: int8 (primary key, auto-increment)');
      console.log('- student_id: int8 (foreign key to students.id)');
      console.log('- exam_id: int8 (foreign key to exams.id)');
      console.log('- score: int4');
      console.log('- percentage: float8');
      console.log('- submitted_at: timestamptz');
      console.log('- created_at: timestamptz (default: now())');
      console.log('- updated_at: timestamptz (default: now())');
    }

    console.log('Database setup completed successfully.');
  } catch (error) {
    console.error('Error setting up database:', error);
  }
}

/**
 * Inserts sample data into the database for testing purposes.
 */
export async function insertSampleData() {
  console.log('Inserting sample data...');
  
  try {
    // Check if admin user already exists
    const { data: existingAdmin } = await supabase
      .from('users')
      .select('id')
      .eq('email', 'admin@grademe.com')
      .single();

    if (!existingAdmin) {
      // Insert admin user
      const hashedPassword = await hashPassword('password123');
      const { error: adminError } = await supabase
        .from('users')
        .insert([{
          email: 'admin@grademe.com',
          password: hashedPassword,
          name: 'Admin User',
          role: 'admin',
          is_admin: true,
          profile_image: null,
          student_id: null,
          email_notifications: true,
          sms_notifications: false,
          email_exam_results: true,
          email_upcoming_exams: true,
          sms_exam_results: false,
          sms_upcoming_exams: false,
          created_at: new Date(),
          updated_at: new Date()
        }]);

      if (adminError) {
        console.error('Error inserting admin user:', adminError);
      } else {
        console.log('✓ Admin user created successfully');
      }
    } else {
      console.log('✓ Admin user already exists');
    }

    // Check if sample students exist
    const { data: existingStudents } = await supabase
      .from('students')
      .select('id')
      .limit(1);

    if (!existingStudents || existingStudents.length === 0) {
      // Insert sample students
      const { data: students, error: studentsError } = await supabase
        .from('students')
        .insert([
          {
            name: 'John Doe',
            email: 'john@example.com',
            class: 'Class 10A',
            enrollment_date: '2024-01-15',
            phone: '+94701234567',
            address: 'Colombo, Sri Lanka',
            date_of_birth: '2006-05-15',
            guardian_name: 'Robert Doe',
            guardian_phone: '+94701234568',
            profile_image: null,
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            name: 'Jane Smith',
            email: 'jane@example.com',
            class: 'Class 10B',
            enrollment_date: '2024-01-20',
            phone: '+94701234569',
            address: 'Kandy, Sri Lanka',
            date_of_birth: '2006-07-20',
            guardian_name: 'Sarah Smith',
            guardian_phone: '+94701234570',
            profile_image: null,
            created_at: new Date(),
            updated_at: new Date()
          }
        ])
        .select();

      if (studentsError) {
        console.error('Error inserting students:', studentsError);
      } else {
        console.log('✓ Sample students created successfully');

        // Create user accounts for students
        if (students) {
          const studentPassword = await hashPassword('student123');
          
          for (const student of students) {
            const { error: userError } = await supabase
              .from('users')
              .insert([{
                email: student.email,
                password: studentPassword,
                name: student.name,
                role: 'student',
                is_admin: false,
                profile_image: null,
                student_id: student.id,
                email_notifications: true,
                sms_notifications: false,
                email_exam_results: true,
                email_upcoming_exams: true,
                sms_exam_results: false,
                sms_upcoming_exams: false,
                created_at: new Date(),
                updated_at: new Date()
              }]);

            if (userError) {
              console.error(`Error creating user account for ${student.name}:`, userError);
            }
          }
          console.log('✓ Student user accounts created successfully');
        }
      }
    } else {
      console.log('✓ Sample students already exist');
    }

    // Insert sample exams if they don't exist
    const { data: existingExams } = await supabase
      .from('exams')
      .select('id')
      .limit(1);

    if (!existingExams || existingExams.length === 0) {
      const { data: exams, error: examsError } = await supabase
        .from('exams')
        .insert([
          {
            name: 'Mathematics Final',
            subject: 'Mathematics',
            date: '2024-06-25T10:00:00Z',
            duration: 180,
            total_marks: 100,
            status: 'upcoming',
            description: 'Final examination for Mathematics',
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            name: 'Physics Mid-term',
            subject: 'Physics',
            date: '2024-05-15T14:00:00Z',
            duration: 120,
            total_marks: 75,
            status: 'active',
            description: 'Mid-term examination for Physics',
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            name: 'Chemistry Quiz',
            subject: 'Chemistry',
            date: '2024-04-10T09:00:00Z',
            duration: 60,
            total_marks: 50,
            status: 'completed',
            description: 'Quick quiz on organic chemistry',
            created_at: new Date(),
            updated_at: new Date()
          },
          {
            name: 'Biology Semester Test',
            subject: 'Biology',
            date: '2024-03-20T11:00:00Z',
            duration: 90,
            total_marks: 60,
            status: 'completed',
            description: 'Semester test covering cell biology',
            created_at: new Date(),
            updated_at: new Date()
          }
        ])
        .select();

      if (examsError) {
        console.error('Error inserting exams:', examsError);
      } else {
        console.log('✓ Sample exams created successfully');
      }
    } else {
      console.log('✓ Sample exams already exist');
    }

    console.log('✓ Sample data insertion completed successfully!');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
}