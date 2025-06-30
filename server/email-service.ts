import { Resend } from 'resend';
import { getDb } from './db-connection.js';

const resend = new Resend(process.env.RESEND_API_KEY);

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface StudentData {
  id: number;
  name: string;
  email: string;
  emailNotifications: boolean;
  emailExamResults: boolean;
  emailUpcomingExams: boolean;
}

interface ExamData {
  id: number;
  name: string;
  subject: string;
  date: string;
  startTime?: string;
  duration: number;
  totalMarks: number;
}

interface ResultData {
  score: number;
  rank: number;
  totalStudents: number;
  passed: boolean;
}

export class EmailService {
  private db = getDb();
  private fromEmail = 'GradeMe <noreply@grademe.app>';

  private generateExamResultTemplate(student: StudentData, exam: ExamData, result: ResultData): EmailTemplate {
    const subject = `Exam Results: ${exam.name} - ${exam.subject}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .result-card { background: white; padding: 25px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .score { font-size: 2.5em; font-weight: bold; color: ${result.passed ? '#28a745' : '#dc3545'}; text-align: center; }
          .rank { font-size: 1.2em; color: #6c757d; text-align: center; margin-top: 10px; }
          .exam-details { background: #e9ecef; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 0.9em; }
          .performance-badge { display: inline-block; padding: 8px 16px; border-radius: 20px; color: white; font-weight: bold; margin: 10px 0; }
          .excellent { background: #28a745; }
          .good { background: #17a2b8; }
          .average { background: #ffc107; color: #333; }
          .poor { background: #dc3545; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Exam Results</h1>
          <p>Your exam results are now available</p>
        </div>
        
        <div class="content">
          <p>Dear ${student.name},</p>
          
          <p>Your results for the <strong>${exam.name}</strong> exam are now available. Here's your performance summary:</p>
          
          <div class="result-card">
            <div class="score">${result.score}/${exam.totalMarks}</div>
            <div class="rank">Rank ${result.rank} of ${result.totalStudents}</div>
            
            <div class="performance-badge ${this.getPerformanceBadgeClass(result.score, exam.totalMarks)}">
              ${this.getPerformanceText(result.score, exam.totalMarks)}
            </div>
          </div>
          
          <div class="exam-details">
            <h3>📝 Exam Details</h3>
            <p><strong>Subject:</strong> ${exam.subject}</p>
            <p><strong>Date:</strong> ${new Date(exam.date).toLocaleDateString()}</p>
            <p><strong>Duration:</strong> ${exam.duration} minutes</p>
            <p><strong>Total Marks:</strong> ${exam.totalMarks}</p>
          </div>
          
          <p>You can view your detailed results and performance analytics by logging into your GradeMe student dashboard.</p>
          
          <div class="footer">
            <p>Best regards,<br>The GradeMe Team</p>
            <p><small>This is an automated email. Please do not reply to this message.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Exam Results: ${exam.name} - ${exam.subject}
      
      Dear ${student.name},
      
      Your results for the ${exam.name} exam are now available:
      
      Score: ${result.score}/${exam.totalMarks}
      Rank: ${result.rank} of ${result.totalStudents}
      Performance: ${this.getPerformanceText(result.score, exam.totalMarks)}
      
      Exam Details:
      - Subject: ${exam.subject}
      - Date: ${new Date(exam.date).toLocaleDateString()}
      - Duration: ${exam.duration} minutes
      
      You can view your detailed results by logging into your GradeMe student dashboard.
      
      Best regards,
      The GradeMe Team
    `;

    return { subject, html, text };
  }

  private generateUpcomingExamTemplate(student: StudentData, exam: ExamData): EmailTemplate {
    const subject = `Upcoming Exam Reminder: ${exam.name} - ${exam.subject}`;
    
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .exam-card { background: white; padding: 25px; border-radius: 10px; margin: 20px 0; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
          .date-time { font-size: 1.5em; font-weight: bold; color: #f5576c; text-align: center; margin: 15px 0; }
          .exam-details { background: #e9ecef; padding: 15px; border-radius: 8px; margin: 15px 0; }
          .countdown { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 8px; text-align: center; margin: 15px 0; }
          .footer { text-align: center; margin-top: 30px; color: #6c757d; font-size: 0.9em; }
          .prep-tips { background: #d1ecf1; border: 1px solid #bee5eb; padding: 15px; border-radius: 8px; margin: 15px 0; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📅 Upcoming Exam</h1>
          <p>Don't forget about your upcoming exam</p>
        </div>
        
        <div class="content">
          <p>Dear ${student.name},</p>
          
          <p>This is a friendly reminder about your upcoming exam:</p>
          
          <div class="exam-card">
            <h2>${exam.name}</h2>
            <div class="date-time">
              📅 ${new Date(exam.date).toLocaleDateString()}
              ${exam.startTime ? `⏰ ${exam.startTime}` : ''}
            </div>
            
            <div class="countdown">
              ⏳ Exam is ${this.getDaysUntilExam(exam.date)} days away
            </div>
          </div>
          
          <div class="exam-details">
            <h3>📝 Exam Details</h3>
            <p><strong>Subject:</strong> ${exam.subject}</p>
            <p><strong>Duration:</strong> ${exam.duration} minutes</p>
            <p><strong>Total Marks:</strong> ${exam.totalMarks}</p>
          </div>
          
          <div class="prep-tips">
            <h3>💡 Preparation Tips</h3>
            <ul>
              <li>Review your course materials and notes</li>
              <li>Practice past exam questions if available</li>
              <li>Get a good night's sleep before the exam</li>
              <li>Arrive early and bring all required materials</li>
              <li>Stay calm and manage your time effectively</li>
            </ul>
          </div>
          
          <p>You can access your student dashboard to view more exam details and preparation resources.</p>
          
          <div class="footer">
            <p>Good luck with your exam!<br>The GradeMe Team</p>
            <p><small>This is an automated email. Please do not reply to this message.</small></p>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
      Upcoming Exam Reminder: ${exam.name} - ${exam.subject}
      
      Dear ${student.name},
      
      This is a friendly reminder about your upcoming exam:
      
      Exam: ${exam.name}
      Subject: ${exam.subject}
      Date: ${new Date(exam.date).toLocaleDateString()}
      ${exam.startTime ? `Time: ${exam.startTime}` : ''}
      Duration: ${exam.duration} minutes
      Total Marks: ${exam.totalMarks}
      
      The exam is ${this.getDaysUntilExam(exam.date)} days away.
      
      Preparation Tips:
      - Review your course materials and notes
      - Practice past exam questions if available
      - Get a good night's sleep before the exam
      - Arrive early and bring all required materials
      - Stay calm and manage your time effectively
      
      You can access your student dashboard for more details.
      
      Good luck with your exam!
      The GradeMe Team
    `;

    return { subject, html, text };
  }

  private getPerformanceBadgeClass(score: number, totalMarks: number): string {
    const percentage = (score / totalMarks) * 100;
    if (percentage >= 90) return 'excellent';
    if (percentage >= 75) return 'good';
    if (percentage >= 60) return 'average';
    return 'poor';
  }

  private getPerformanceText(score: number, totalMarks: number): string {
    const percentage = (score / totalMarks) * 100;
    if (percentage >= 90) return 'Excellent Performance! 🌟';
    if (percentage >= 75) return 'Good Performance! 👍';
    if (percentage >= 60) return 'Average Performance 📈';
    return 'Needs Improvement 📚';
  }

  private getDaysUntilExam(examDate: string): number {
    const today = new Date();
    const exam = new Date(examDate);
    const diffTime = exam.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return Math.max(0, diffDays);
  }

  async sendExamResultEmail(studentId: number, examId: number, resultData: ResultData): Promise<boolean> {
    try {
      // Get student data using raw SQL
      const studentQuery = `
        SELECT s.id, s.name, s.email, 
               COALESCE(u.email_notifications, true) as emailNotifications,
               COALESCE(u.email_exam_results, true) as emailExamResults,
               COALESCE(u.email_upcoming_exams, true) as emailUpcomingExams
        FROM students s
        LEFT JOIN users u ON u.student_id = s.id
        WHERE s.id = ${studentId}
      `;
      const studentResults: any = await this.db.execute(studentQuery);
      const studentResult = studentResults[0];

      if (!studentResult || !studentResult.emailNotifications || !studentResult.emailExamResults) {
        console.log(`Student ${studentId} has email notifications disabled for exam results`);
        return false;
      }

      // Get exam data
      const examQuery = `
        SELECT id, name, subject, date, start_time, duration, total_marks
        FROM exams 
        WHERE id = ${examId}
      `;
      const examResults: any = await this.db.execute(examQuery);
      const examResult = examResults[0];

      if (!examResult) {
        console.error(`Exam ${examId} not found`);
        return false;
      }

      const student: StudentData = {
        id: studentResult.id,
        name: studentResult.name,
        email: studentResult.email,
        emailNotifications: studentResult.emailNotifications,
        emailExamResults: studentResult.emailExamResults,
        emailUpcomingExams: studentResult.emailUpcomingExams
      };

      const exam: ExamData = {
        id: examResult.id,
        name: examResult.name,
        subject: examResult.subject,
        date: examResult.date,
        startTime: examResult.start_time,
        duration: examResult.duration,
        totalMarks: examResult.total_marks
      };

      const template = this.generateExamResultTemplate(student, exam, resultData);

      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: [student.email],
        subject: template.subject,
        html: template.html,
        text: template.text,
      });

      if (error) {
        console.error('Error sending exam result email:', error);
        return false;
      }

      console.log(`Exam result email sent successfully to ${student.email}:`, data?.id);
      return true;

    } catch (error) {
      console.error('Error in sendExamResultEmail:', error);
      return false;
    }
  }

  async sendUpcomingExamReminder(examId: number): Promise<number> {
    try {
      // Get exam data
      const examQuery = `
        SELECT id, name, subject, date, start_time, duration, total_marks, status
        FROM exams 
        WHERE id = ${examId} AND status = 'upcoming'
      `;
      const examResults: any = await this.db.execute(examQuery);
      const examResult = examResults[0];

      if (!examResult) {
        console.log(`Exam ${examId} not found or not upcoming`);
        return 0;
      }

      // Get all students with email notifications enabled
      const studentsQuery = `
        SELECT s.id, s.name, s.email,
               COALESCE(u.email_notifications, true) as emailNotifications,
               COALESCE(u.email_exam_results, true) as emailExamResults,
               COALESCE(u.email_upcoming_exams, true) as emailUpcomingExams
        FROM students s
        LEFT JOIN users u ON u.student_id = s.id
        WHERE COALESCE(u.email_notifications, true) = true 
        AND COALESCE(u.email_upcoming_exams, true) = true
      `;
      const studentsResult: any = await this.db.execute(studentsQuery);

      if (!studentsResult || studentsResult.length === 0) {
        console.log('No students with email notifications enabled found');
        return 0;
      }

      const exam: ExamData = {
        id: examResult.id,
        name: examResult.name,
        subject: examResult.subject,
        date: examResult.date,
        startTime: examResult.start_time,
        duration: examResult.duration,
        totalMarks: examResult.total_marks
      };

      let emailsSent = 0;

      for (const studentData of studentsResult) {
        try {
          const student: StudentData = {
            id: studentData.id,
            name: studentData.name,
            email: studentData.email,
            emailNotifications: studentData.emailNotifications,
            emailExamResults: studentData.emailExamResults,
            emailUpcomingExams: studentData.emailUpcomingExams
          };

          const template = this.generateUpcomingExamTemplate(student, exam);

          const { data, error } = await resend.emails.send({
            from: this.fromEmail,
            to: [student.email],
            subject: template.subject,
            html: template.html,
            text: template.text,
          });

          if (error) {
            console.error(`Error sending upcoming exam email to ${student.email}:`, error);
          } else {
            console.log(`Upcoming exam email sent to ${student.email}:`, data?.id);
            emailsSent++;
          }

          // Add small delay to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 100));

        } catch (error) {
          console.error(`Error sending email to student ${studentData.id}:`, error);
        }
      }

      console.log(`Sent ${emailsSent} upcoming exam reminder emails for exam ${examId}`);
      return emailsSent;

    } catch (error) {
      console.error('Error in sendUpcomingExamReminder:', error);
      return 0;
    }
  }

  async sendBulkUpcomingExamReminders(): Promise<number> {
    try {
      // Get all upcoming exams that are 1-3 days away
      const upcomingExamsResult = await this.db.execute(`
        SELECT id, name, date
        FROM exams 
        WHERE status = 'upcoming'
        AND date >= CURRENT_DATE
        AND date <= DATE_ADD(CURRENT_DATE, INTERVAL 3 DAY)
      `) as any;

      if (!upcomingExamsResult || upcomingExamsResult.length === 0) {
        console.log('No upcoming exams found in the next 3 days');
        return 0;
      }

      let totalEmailsSent = 0;

      for (const exam of upcomingExamsResult) {
        const emailsSent = await this.sendUpcomingExamReminder(exam.id);
        totalEmailsSent += emailsSent;
        
        // Add delay between exam batches
        await new Promise(resolve => setTimeout(resolve, 500));
      }

      console.log(`Total upcoming exam reminder emails sent: ${totalEmailsSent}`);
      return totalEmailsSent;

    } catch (error) {
      console.error('Error in sendBulkUpcomingExamReminders:', error);
      return 0;
    }
  }

  async testEmailService(): Promise<boolean> {
    try {
      const { data, error } = await resend.emails.send({
        from: this.fromEmail,
        to: ['test@example.com'],
        subject: 'GradeMe Email Service Test',
        html: '<h1>Email service is working!</h1><p>This is a test email from GradeMe.</p>',
        text: 'Email service is working! This is a test email from GradeMe.',
      });

      if (error) {
        console.error('Email service test failed:', error);
        return false;
      }

      console.log('Email service test successful:', data?.id);
      return true;

    } catch (error) {
      console.error('Error testing email service:', error);
      return false;
    }
  }
}

export const emailService = new EmailService();