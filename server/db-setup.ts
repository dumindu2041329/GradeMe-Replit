import supabase from './db';
import { hashPassword } from './utils/password-utils';
import { Migration } from './models/Migration';

/**
 * Setup database using MVC migration system
 */
export async function setupDatabase() {
  console.log('🚀 Setting up database using MVC migration system...');
  
  try {
    // Run all pending migrations
    await Migration.runMigrations();
    
    // Show migration status
    const status = await Migration.getMigrationStatus();
    console.log(`📊 Migration Status - Total: ${status.total}, Executed: ${status.executed}, Pending: ${status.pending.length}`);
    
    if (status.pending.length > 0) {
      console.log('⚠️ Pending migrations:', status.pending.join(', '));
    }
    
    console.log('✅ Database setup completed using migration system!');
  } catch (error) {
    console.error('❌ Database migration failed:', error);
    console.log('🔄 Falling back to manual table verification...');
    
    // Fallback: Check if tables exist
    await checkTablesExist();
  }
}

/**
 * Fallback method to check if tables exist
 */
async function checkTablesExist() {
  const tables = ['users', 'students', 'exams', 'results'];
  
  for (const table of tables) {
    try {
      const { error } = await supabase.from(table).select('id').limit(1);
      if (error && error.code === '42P01') {
        console.log(`⚠️ Table '${table}' does not exist`);
      } else {
        console.log(`✅ Table '${table}' exists`);
      }
    } catch (error) {
      console.log(`⚠️ Could not verify table '${table}'`);
    }
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