import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { User } from "@shared/schema";
import MemoryStore from 'memorystore';
import { 
  supabaseMiddleware, 
  supabaseAuthMiddleware, 
  requireAdmin, 
  requireStudent, 
  requireAuth,
  supabaseAdmin,
  checkSupabaseHealth,
  createSupabaseSession,
  signOutUser
} from "./supabase-middleware";

// Session types for TypeScript
declare module "express-session" {
  interface SessionData {
    user: Omit<User, 'password'> & { password?: string };
  }
}

// A simple API for handling contact form submissions
interface ContactFormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface LoginCredentials {
  email: string;
  password: string;
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Apply Supabase middleware globally
  app.use(supabaseMiddleware);

  // Legacy authentication middleware (keeping for backward compatibility)
  const requireAuthLegacy = (req: Request, res: Response, next: Function) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    next();
  };

  const requireStudentAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    if (req.session.user.role !== 'student') {
      return res.status(403).json({ message: "Student access required" });
    }
    next();
  };

  // Supabase health check endpoint
  app.get("/api/supabase/health", async (req: Request, res: Response) => {
    try {
      const isHealthy = await checkSupabaseHealth();
      res.json({ 
        status: isHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        supabase: {
          url: process.env.SUPABASE_URL ? 'configured' : 'missing',
          anon_key: process.env.SUPABASE_ANON_KEY ? 'configured' : 'missing',
          service_key: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'configured' : 'missing'
        }
      });
    } catch (error) {
      res.status(500).json({ 
        status: 'error', 
        message: 'Failed to check Supabase health',
        timestamp: new Date().toISOString()
      });
    }
  });

  // Supabase authentication endpoint with role-based access control
  app.post("/api/supabase/auth", async (req: Request, res: Response) => {
    try {
      const { email, password, type } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: 'Email and password are required' });
      }

      let authenticatedUser = null;
      
      if (type === 'student') {
        // Authenticate as student
        const student = await storage.authenticateStudent(email, password);
        if (student) {
          authenticatedUser = {
            ...student,
            role: 'student',
            isAdmin: false
          };
        }
      } else {
        // Authenticate as admin
        const user = await storage.instance.getUserByEmail(email);
        if (user && user.role === 'admin') {
          // Verify password
          const bcrypt = await import('bcrypt');
          const isValidPassword = await bcrypt.compare(password, user.password);
          if (isValidPassword) {
            const { password: _, ...userWithoutPassword } = user;
            authenticatedUser = userWithoutPassword;
          }
        }
      }

      if (!authenticatedUser) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Create JWT token for Supabase-style authentication
      const tokenPayload = {
        sub: authenticatedUser.id.toString(),
        email: authenticatedUser.email,
        role: authenticatedUser.role,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 hours
      };
      
      const token = Buffer.from(JSON.stringify(tokenPayload)).toString('base64');
      
      res.json({
        user: authenticatedUser,
        access_token: token,
        token_type: 'bearer',
        expires_in: 86400,
        message: 'Authentication successful'
      });
    } catch (error) {
      console.error('Supabase auth error:', error);
      res.status(500).json({ message: 'Authentication failed' });
    }
  });

  // Supabase sign out endpoint
  app.post("/api/supabase/signout", async (req: Request, res: Response) => {
    try {
      const { userId } = req.body;
      
      if (userId) {
        await signOutUser(userId);
      }
      
      res.json({ message: 'Signed out successfully' });
    } catch (error) {
      console.error('Supabase signout error:', error);
      res.status(500).json({ message: 'Signout failed' });
    }
  });

  // Contact form endpoint
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const formData: ContactFormData = req.body;
      
      // Here you would normally send an email or store the message
      console.log("Contact form submission:", formData);
      
      res.json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Admin login endpoint
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password }: LoginCredentials = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Find user in database
      const user = await storage.getUserByEmail(email);
      
      if (!user || user.role !== 'admin') {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Verify password (assuming bcrypt is used)
      const bcrypt = await import('bcrypt');
      const isValidPassword = await bcrypt.compare(password, user.password);
      
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create session without password
      const { password: _, ...userWithoutPassword } = user;
      req.session.user = userWithoutPassword;
      
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  // Student login endpoint
  app.post("/api/auth/student/login", async (req: Request, res: Response) => {
    try {
      const { email, password }: LoginCredentials = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Authenticate student using the storage method
      const student = await storage.authenticateStudent(email, password);
      
      if (!student) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create a user object for session (students are also users with role 'student')
      const user = {
        id: student.id,
        email: student.email,
        name: student.name,
        role: 'student' as const,
        isAdmin: false,
        profileImage: student.profileImage,
        studentId: student.id,
        emailNotifications: true,
        smsNotifications: false,
        emailExamResults: true,
        emailUpcomingExams: true,
        smsExamResults: false,
        smsUpcomingExams: false,
        createdAt: student.createdAt,
        updatedAt: student.updatedAt
      };

      req.session.user = user;
      res.json(user);
    } catch (error) {
      console.error("Student login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/session", async (req: Request, res: Response) => {
    try {
      const authHeader = req.headers.authorization;
      
      // Check for Bearer token first
      if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.substring(7);
        
        try {
          const tokenData = JSON.parse(Buffer.from(token, 'base64').toString());
          
          // Check if token is expired
          if (tokenData.exp && tokenData.exp < Math.floor(Date.now() / 1000)) {
            return res.json({ user: null, expired: true });
          }
          
          // Get user from storage
          let user;
          if (tokenData.role === 'student') {
            user = await storage.instance.getStudentByEmail(tokenData.email);
            if (user) {
              user = { ...user, role: 'student', isAdmin: false };
            }
          } else {
            user = await storage.instance.getUserByEmail(tokenData.email);
          }
          
          if (user) {
            const { password, ...userWithoutPassword } = user;
            return res.json({ 
              user: userWithoutPassword, 
              authenticated: true,
              redirectTo: user.role === 'student' ? '/student/dashboard' : '/admin'
            });
          }
        } catch (decodeError) {
          // Invalid token format, fall through to session check
        }
      }
      
      // Fall back to session-based auth
      if (req.session.user) {
        res.json({ 
          user: req.session.user, 
          authenticated: true,
          redirectTo: req.session.user.role === 'student' ? '/student/dashboard' : '/admin'
        });
      } else {
        res.json({ user: null, authenticated: false, redirectTo: '/' });
      }
    } catch (error) {
      console.error("Session check error:", error);
      res.json({ user: null, authenticated: false, redirectTo: '/' });
    }
  });

  // Statistics endpoint - Admin only
  app.get("/api/statistics", requireAdmin, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Students CRUD operations - Admin only
  app.get("/api/students", requireAdmin, async (req: Request, res: Response) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/students", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Hash password if provided
      let hashedPassword;
      if (req.body.password) {
        const bcrypt = await import('bcrypt');
        hashedPassword = await bcrypt.hash(req.body.password, 10);
      }
      
      // Convert enrollmentDate and dateOfBirth strings to Date objects if provided
      const studentData = {
        ...req.body,
        ...(hashedPassword && { password: hashedPassword }),
        ...(req.body.enrollmentDate && { enrollmentDate: new Date(req.body.enrollmentDate) }),
        ...(req.body.dateOfBirth && { dateOfBirth: new Date(req.body.dateOfBirth) })
      };
      
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student" });
    }
  });

  app.put("/api/students/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      // Convert date strings to Date objects if provided
      const studentData = {
        ...req.body,
        ...(req.body.enrollmentDate && { enrollmentDate: new Date(req.body.enrollmentDate) }),
        ...(req.body.dateOfBirth && { dateOfBirth: new Date(req.body.dateOfBirth) })
      };
      
      const student = await storage.updateStudent(id, studentData);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student" });
    }
  });

  app.delete("/api/students/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStudent(id);
      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json({ message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Exams CRUD operations
  app.get("/api/exams", requireAuth, async (req: Request, res: Response) => {
    try {
      const exams = await storage.getExams();
      res.json(exams);
    } catch (error) {
      console.error("Error fetching exams:", error);
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });

  // Get individual exam by ID
  app.get("/api/exams/:id", requireAuth, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const exam = await storage.getExam(id);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      console.error("Error fetching exam:", error);
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });

  app.post("/api/exams", requireAdmin, async (req: Request, res: Response) => {
    try {
      // Convert date string to Date object
      const examData = {
        ...req.body,
        date: new Date(req.body.date),
        duration: parseInt(req.body.duration),
        totalMarks: parseInt(req.body.totalMarks)
      };
      
      const exam = await storage.createExam(examData);
      res.status(201).json(exam);
    } catch (error) {
      console.error("Error creating exam:", error);
      res.status(500).json({ message: "Failed to create exam" });
    }
  });

  app.put("/api/exams/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      // Convert date string to Date object and ensure numbers are integers
      const examData = {
        ...req.body,
        ...(req.body.date && { date: new Date(req.body.date) }),
        ...(req.body.duration && { duration: parseInt(req.body.duration) }),
        ...(req.body.totalMarks && { totalMarks: parseInt(req.body.totalMarks) })
      };
      
      const exam = await storage.updateExam(id, examData);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      console.error("Error updating exam:", error);
      res.status(500).json({ message: "Failed to update exam" });
    }
  });

  app.delete("/api/exams/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteExam(id);
      if (!success) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json({ message: "Exam deleted successfully" });
    } catch (error) {
      console.error("Error deleting exam:", error);
      res.status(500).json({ message: "Failed to delete exam" });
    }
  });

  // Results CRUD operations - Admin only
  app.get("/api/results", requireAdmin, async (req: Request, res: Response) => {
    try {
      const results = await storage.getResults();
      res.json(results);
    } catch (error) {
      console.error("Error fetching results:", error);
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  app.post("/api/results", requireAdmin, async (req: Request, res: Response) => {
    try {
      const result = await storage.createResult(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating result:", error);
      res.status(500).json({ message: "Failed to create result" });
    }
  });

  app.put("/api/results/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.updateResult(id, req.body);
      if (!result) {
        return res.status(404).json({ message: "Result not found" });
      }
      res.json(result);
    } catch (error) {
      console.error("Error updating result:", error);
      res.status(500).json({ message: "Failed to update result" });
    }
  });

  app.delete("/api/results/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteResult(id);
      if (!success) {
        return res.status(404).json({ message: "Result not found" });
      }
      res.json({ message: "Result deleted successfully" });
    } catch (error) {
      console.error("Error deleting result:", error);
      res.status(500).json({ message: "Failed to delete result" });
    }
  });

  // Student dashboard data - Student only
  app.get("/api/student/dashboard", requireStudent, async (req: Request, res: Response) => {
    try {
      const user = req.session.user;
      if (!user || !user.studentId) {
        return res.status(400).json({ message: "Invalid student session" });
      }
      
      const dashboardData = await storage.getStudentDashboardData(user.studentId);
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching student dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });

  // Paper CRUD operations
  app.get("/api/papers/:examId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const examId = parseInt(req.params.examId);
      const paper = await storage.getPaperByExamId(examId);
      res.json(paper);
    } catch (error) {
      console.error("Error fetching paper:", error);
      res.status(500).json({ message: "Failed to fetch paper" });
    }
  });

  app.post("/api/papers", requireAdmin, async (req: Request, res: Response) => {
    try {
      const paperData = {
        ...req.body,
        examId: parseInt(req.body.examId),
        totalQuestions: parseInt(req.body.totalQuestions) || 0,
        totalMarks: parseInt(req.body.totalMarks) || 0
      };
      
      const paper = await storage.createPaper(paperData);
      res.status(201).json(paper);
    } catch (error) {
      console.error("Error creating paper:", error);
      res.status(500).json({ message: "Failed to create paper" });
    }
  });

  app.put("/api/papers/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const paperData = {
        ...req.body,
        ...(req.body.totalQuestions && { totalQuestions: parseInt(req.body.totalQuestions) }),
        ...(req.body.totalMarks && { totalMarks: parseInt(req.body.totalMarks) })
      };
      
      const paper = await storage.updatePaper(id, paperData);
      if (!paper) {
        return res.status(404).json({ message: "Paper not found" });
      }
      res.json(paper);
    } catch (error) {
      console.error("Error updating paper:", error);
      res.status(500).json({ message: "Failed to update paper" });
    }
  });

  // Question CRUD operations
  app.get("/api/questions/:paperId", requireAdmin, async (req: Request, res: Response) => {
    try {
      const paperId = parseInt(req.params.paperId);
      const { questionFileStorage } = await import('./question-file-storage.js');
      const questions = await questionFileStorage.getQuestionsByPaperId(paperId);
      res.json(questions);
    } catch (error) {
      console.error("Error fetching questions:", error);
      res.status(500).json({ message: "Failed to fetch questions" });
    }
  });

  app.post("/api/questions", requireAdmin, async (req: Request, res: Response) => {
    try {
      const questionData = {
        ...req.body,
        paperId: parseInt(req.body.paperId),
        marks: parseInt(req.body.marks),
        orderIndex: parseInt(req.body.orderIndex)
      };
      
      const paperId = parseInt(req.body.paperId);
      const examId = parseInt(req.body.examId);
      
      const { questionFileStorage } = await import('./question-file-storage.js');
      const question = await questionFileStorage.addQuestion(paperId, examId, {
        question: req.body.question,
        type: req.body.type,
        options: req.body.options,
        correctAnswer: req.body.correctAnswer,
        marks: parseInt(req.body.marks),
        orderIndex: parseInt(req.body.orderIndex)
      });
      
      if (!question) {
        return res.status(500).json({ message: "Failed to create question" });
      }
      res.status(201).json(question);
    } catch (error) {
      console.error("Error creating question:", error);
      res.status(500).json({ message: "Failed to create question" });
    }
  });

  app.put("/api/questions/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const questionData = {
        ...req.body,
        ...(req.body.marks && { marks: parseInt(req.body.marks) }),
        ...(req.body.orderIndex && { orderIndex: parseInt(req.body.orderIndex) })
      };
      
      const questionId = req.params.id;
      const paperId = parseInt(req.body.paperId);
      const examId = parseInt(req.body.examId);
      
      const { questionFileStorage } = await import('./question-file-storage.js');
      const question = await questionFileStorage.updateQuestion(paperId, examId, questionId, {
        ...(req.body.question && { question: req.body.question }),
        ...(req.body.type && { type: req.body.type }),
        ...(req.body.options && { options: req.body.options }),
        ...(req.body.correctAnswer && { correctAnswer: req.body.correctAnswer }),
        ...(req.body.marks && { marks: parseInt(req.body.marks) }),
        ...(req.body.orderIndex && { orderIndex: parseInt(req.body.orderIndex) })
      });
      if (!question) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json(question);
    } catch (error) {
      console.error("Error updating question:", error);
      res.status(500).json({ message: "Failed to update question" });
    }
  });

  app.delete("/api/questions/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const questionId = req.params.id;
      const paperId = parseInt(req.body.paperId || req.query.paperId as string);
      const examId = parseInt(req.body.examId || req.query.examId as string);
      
      const { questionFileStorage } = await import('./question-file-storage.js');
      const success = await questionFileStorage.deleteQuestion(paperId, examId, questionId);
      if (!success) {
        return res.status(404).json({ message: "Question not found" });
      }
      res.json({ message: "Question deleted successfully" });
    } catch (error) {
      console.error("Error deleting question:", error);
      res.status(500).json({ message: "Failed to delete question" });
    }
  });



  return createServer(app);
}