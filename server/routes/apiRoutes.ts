import { Express } from 'express';
import { UserController } from '../controllers/userController';
import { StudentController } from '../controllers/studentController';
import { ExamController } from '../controllers/examController';
import { ResultController } from '../controllers/resultController';
import { storage } from '../storage';

// Middleware for authentication
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

const requireAdminAuth = (req: any, res: any, next: any) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (!req.session.user.isAdmin && req.session.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const requireStudentAuth = (req: any, res: any, next: any) => {
  if (!req.session.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  if (req.session.user.role !== 'student') {
    return res.status(403).json({ message: 'Student access only' });
  }
  next();
};

export function setupApiRoutes(app: Express) {
  // User Routes
  app.get('/api/users/:id', requireAuth, UserController.getUserById);
  app.post('/api/users', requireAdminAuth, UserController.createUser);
  app.put('/api/users/:id', requireAuth, UserController.updateUser);
  app.post('/api/users/:id/change-password', requireAuth, UserController.changePassword);
  app.put('/api/users/:id/notifications', requireAuth, UserController.updateNotificationPreferences);

  // Student Routes
  app.get('/api/students', requireAdminAuth, StudentController.getAllStudents);
  app.get('/api/students/:id', requireAuth, StudentController.getStudentById);
  app.get('/api/students/email/:email', requireAdminAuth, StudentController.getStudentByEmail);
  app.post('/api/students', requireAdminAuth, StudentController.createStudent);
  app.put('/api/students/:id', requireAuth, StudentController.updateStudent);
  app.delete('/api/students/:id', requireAdminAuth, StudentController.deleteStudent);
  app.post('/api/students/authenticate', StudentController.authenticateStudent);
  app.get('/api/students/:id/dashboard', requireStudentAuth, StudentController.getStudentDashboard);
  app.put('/api/students/profile', requireStudentAuth, StudentController.updateProfile);

  // Exam Routes
  app.get('/api/exams', requireAuth, ExamController.getAllExams);
  app.get('/api/exams/:id', requireAuth, ExamController.getExamById);
  app.get('/api/exams/status/:status', requireAuth, ExamController.getExamsByStatus);
  app.get('/api/exams/upcoming', requireAuth, ExamController.getUpcomingExams);
  app.get('/api/exams/active', requireAuth, ExamController.getActiveExams);
  app.get('/api/exams/completed', requireAuth, ExamController.getCompletedExams);
  app.post('/api/exams', requireAdminAuth, ExamController.createExam);
  app.put('/api/exams/:id', requireAdminAuth, ExamController.updateExam);
  app.delete('/api/exams/:id', requireAdminAuth, ExamController.deleteExam);

  // Result Routes
  app.get('/api/results', requireAdminAuth, ResultController.getAllResults);
  app.get('/api/results/:id', requireAuth, ResultController.getResultById);
  app.get('/api/results/student/:studentId', requireAuth, ResultController.getResultsByStudentId);
  app.get('/api/results/exam/:examId', requireAuth, ResultController.getResultsByExamId);
  app.post('/api/results', requireAdminAuth, ResultController.createResult);
  app.put('/api/results/:id', requireAdminAuth, ResultController.updateResult);
  app.delete('/api/results/:id', requireAdminAuth, ResultController.deleteResult);
  app.get('/api/results/my-history', requireStudentAuth, ResultController.getStudentExamHistory);

  // Dashboard and Statistics Routes
  app.get('/api/dashboard/statistics', requireAdminAuth, async (req, res) => {
    try {
      const statistics = await storage.getStatistics();
      res.json(statistics);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      res.status(500).json({ message: 'Server error' });
    }
  });
}