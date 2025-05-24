import supabase from './db';

/**
 * Creates the necessary database tables in Supabase if they don't exist.
 * This creates tables using Supabase's API instead of SQL commands.
 */
export async function setupDatabase() {
  console.log('Setting up database tables...');
  
  try {
    // Check if users table exists by trying to select from it
    const { error: usersCheckError } = await supabase
      .from('users')
      .select('id')
      .limit(1);
    
    // If table doesn't exist, we'll get a specific error
    if (usersCheckError && usersCheckError.code === '42P01') {
      console.log('Users table does not exist. Please create it in the Supabase dashboard.');
      console.log('Table creation guide:');
      console.log('1. Go to your Supabase project dashboard');
      console.log('2. Click on "Table editor" in the left sidebar');
      console.log('3. Click "Create a new table"');
      console.log('4. Create the users table with the following columns:');
      console.log('   - id: serial (primary key)');
      console.log('   - email: text (unique)');
      console.log('   - password: text');
      console.log('   - name: text');
      console.log('   - role: text (check: in (\'admin\', \'student\'))');
      console.log('   - is_admin: boolean (default: false)');
      console.log('   - profile_image: text (nullable)');
      console.log('   - student_id: integer (nullable)');
      console.log('   - email_notifications: boolean (default: true)');
      console.log('   - sms_notifications: boolean (default: false)');
      console.log('   - email_exam_results: boolean (default: true)');
      console.log('   - email_upcoming_exams: boolean (default: true)');
      console.log('   - sms_exam_results: boolean (default: false)');
      console.log('   - sms_upcoming_exams: boolean (default: false)');
      console.log('   - created_at: timestamptz (default: now())');
      console.log('   - updated_at: timestamptz (default: now())');
      console.log('');
      console.log('5. Repeat this process for the other tables (students, exams, results)');
    } else if (usersCheckError) {
      console.error('Error checking users table:', usersCheckError);
    } else {
      console.log('Users table already exists.');
    }

    // Check if students table exists
    const { error: studentsCheckError } = await supabase
      .from('students')
      .select('id')
      .limit(1);
    
    if (studentsCheckError && studentsCheckError.code === '42P01') {
      console.log('Students table does not exist. Please create it in the Supabase dashboard.');
    } else if (studentsCheckError) {
      console.error('Error checking students table:', studentsCheckError);
    } else {
      console.log('Students table already exists.');
    }

    // Check if exams table exists
    const { error: examsCheckError } = await supabase
      .from('exams')
      .select('id')
      .limit(1);
    
    if (examsCheckError && examsCheckError.code === '42P01') {
      console.log('Exams table does not exist. Please create it in the Supabase dashboard.');
    } else if (examsCheckError) {
      console.error('Error checking exams table:', examsCheckError);
    } else {
      console.log('Exams table already exists.');
    }

    // Check if results table exists
    const { error: resultsCheckError } = await supabase
      .from('results')
      .select('id')
      .limit(1);
    
    if (resultsCheckError && resultsCheckError.code === '42P01') {
      console.log('Results table does not exist. Please create it in the Supabase dashboard.');
    } else if (resultsCheckError) {
      console.error('Error checking results table:', resultsCheckError);
    } else {
      console.log('Results table already exists.');
    }

    console.log('Database check completed.');
    
    // Direct creation of tables is not supported through the JavaScript API
    // The user will need to create these tables through the Supabase dashboard
    console.log('\nIMPORTANT: If any tables are missing, please create them manually in the Supabase dashboard.');
    console.log('See the guide above for table structure details.');
  } catch (error) {
    console.error('Error checking database tables:', error);
  }
}

/**
 * Inserts sample data into the database for testing purposes.
 * This will only insert data if the tables are empty.
 */
export async function insertSampleData() {
  console.log('Checking if sample data needs to be inserted...');
  
  try {
    // Check if there's any admin user
    const { data: adminUsers, error: adminCheckError } = await supabase
      .from('users')
      .select('id')
      .eq('role', 'admin')
      .limit(1);
    
    if (adminCheckError) {
      if (adminCheckError.code === '42P01') {
        console.log('Users table does not exist yet. Cannot insert sample data.');
        return;
      }
      console.error('Error checking admin users:', adminCheckError);
      return;
    }
    
    // If we already have admin users, skip sample data insertion
    if (adminUsers && adminUsers.length > 0) {
      console.log('Sample data already exists, skipping insertion');
      return;
    }
    
    // Check if the students table exists
    const { error: studentsTableCheck } = await supabase
      .from('students')
      .select('id')
      .limit(1);
      
    if (studentsTableCheck && studentsTableCheck.code === '42P01') {
      console.log('Students table does not exist yet. Cannot insert sample data.');
      return;
    }
    
    // Check if the exams table exists
    const { error: examsTableCheck } = await supabase
      .from('exams')
      .select('id')
      .limit(1);
      
    if (examsTableCheck && examsTableCheck.code === '42P01') {
      console.log('Exams table does not exist yet. Cannot insert sample data.');
      return;
    }
    
    // Check if the results table exists
    const { error: resultsTableCheck } = await supabase
      .from('results')
      .select('id')
      .limit(1);
      
    if (resultsTableCheck && resultsTableCheck.code === '42P01') {
      console.log('Results table does not exist yet. Cannot insert sample data.');
      return;
    }
    
    console.log('All tables exist. Inserting sample data...');
    
    // Insert sample admin user
    const { data: adminUser, error: adminInsertError } = await supabase
      .from('users')
      .insert([{
        email: 'admin@grademe.com',
        password: 'password123',
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
      }])
      .select();
    
    if (adminInsertError) {
      console.error('Error inserting admin user:', adminInsertError);
      return;
    } else {
      console.log('Admin user inserted');
    }
    
    // Insert sample students
    const { data: students, error: studentsInsertError } = await supabase
      .from('students')
      .insert([
        {
          name: 'John Doe',
          email: 'john@example.com',
          class: 'Class 10A',
          enrollment_date: new Date('2024-01-15'),
          phone: null,
          address: null,
          date_of_birth: null,
          guardian_name: null,
          guardian_phone: null,
          profile_image: null,
          created_at: new Date(),
          updated_at: new Date()
        },
        {
          name: 'Jane Smith',
          email: 'jane@example.com',
          class: 'Class 10B',
          enrollment_date: new Date('2024-01-20'),
          phone: null,
          address: null,
          date_of_birth: null,
          guardian_name: null,
          guardian_phone: null,
          profile_image: null,
          created_at: new Date(),
          updated_at: new Date()
        }
      ])
      .select();
    
    if (studentsInsertError) {
      console.error('Error inserting students:', studentsInsertError);
      return;
    } else {
      console.log('Students inserted');
      
      // Now insert student user accounts
      if (students && students.length === 2) {
        const johnId = students[0].id;
        const janeId = students[1].id;
        
        const { error: studentUsersError } = await supabase
          .from('users')
          .insert([
            {
              email: 'john@example.com',
              password: 'student123',
              name: 'John Doe',
              role: 'student',
              is_admin: false,
              profile_image: null,
              student_id: johnId,
              email_notifications: true,
              sms_notifications: false,
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              email: 'jane@example.com',
              password: 'student123',
              name: 'Jane Smith',
              role: 'student',
              is_admin: false,
              profile_image: null,
              student_id: janeId,
              email_notifications: true,
              sms_notifications: false,
              created_at: new Date(),
              updated_at: new Date()
            }
          ]);
        
        if (studentUsersError) {
          console.error('Error inserting student users:', studentUsersError);
          return;
        } else {
          console.log('Student users inserted');
        }
        
        // Insert sample exams
        const { data: exams, error: examsInsertError } = await supabase
          .from('exams')
          .insert([
            {
              name: 'Mathematics Final',
              subject: 'Mathematics',
              date: new Date('2024-06-25'),
              duration: 180, // 3 hours
              total_marks: 100,
              status: 'upcoming',
              description: 'Final mathematics examination covering all topics from the semester',
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              name: 'Physics Mid-term',
              subject: 'Physics',
              date: new Date('2024-05-15'),
              duration: 120, // 2 hours
              total_marks: 75,
              status: 'active',
              description: 'Mid-term physics test covering mechanics and thermodynamics',
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              name: 'Chemistry Quiz',
              subject: 'Chemistry',
              date: new Date('2024-04-10'),
              duration: 60, // 1 hour
              total_marks: 50,
              status: 'completed',
              description: 'Quick quiz on organic chemistry fundamentals',
              created_at: new Date(),
              updated_at: new Date()
            },
            {
              name: 'Biology Semester Test',
              subject: 'Biology',
              date: new Date('2024-03-20'),
              duration: 90, // 1.5 hours
              total_marks: 60,
              status: 'completed',
              description: 'Comprehensive test on cellular biology and genetics',
              created_at: new Date(),
              updated_at: new Date()
            }
          ])
          .select();
        
        if (examsInsertError) {
          console.error('Error inserting exams:', examsInsertError);
          return;
        } else if (exams && exams.length === 4) {
          console.log('Exams inserted');
          
          // Find chemistry quiz and biology semester test
          const bioExamId = exams.find(exam => exam.name === 'Biology Semester Test')?.id;
          const chemExamId = exams.find(exam => exam.name === 'Chemistry Quiz')?.id;
          
          if (bioExamId && chemExamId) {
            // Insert sample results
            const { error: resultsInsertError } = await supabase
              .from('results')
              .insert([
                {
                  student_id: johnId,
                  exam_id: bioExamId,
                  score: 52,
                  percentage: 87,
                  submitted_at: new Date('2024-03-20'),
                  created_at: new Date(),
                  updated_at: new Date()
                },
                {
                  student_id: johnId,
                  exam_id: chemExamId,
                  score: 43,
                  percentage: 86,
                  submitted_at: new Date('2024-04-10'),
                  created_at: new Date(),
                  updated_at: new Date()
                },
                {
                  student_id: janeId,
                  exam_id: chemExamId,
                  score: 44,
                  percentage: 88,
                  submitted_at: new Date('2024-04-10'),
                  created_at: new Date(),
                  updated_at: new Date()
                },
                {
                  student_id: janeId,
                  exam_id: bioExamId,
                  score: 54,
                  percentage: 90,
                  submitted_at: new Date('2024-03-20'),
                  created_at: new Date(),
                  updated_at: new Date()
                }
              ]);
            
            if (resultsInsertError) {
              console.error('Error inserting results:', resultsInsertError);
            } else {
              console.log('Results inserted');
            }
          }
        }
      }
    }
    
    console.log('Sample data insertion completed');
  } catch (error) {
    console.error('Error inserting sample data:', error);
  }
}