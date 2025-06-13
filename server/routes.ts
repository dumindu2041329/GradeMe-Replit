import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { WebSocketServer } from "ws";
import { getDb, isDbConnected } from "./db-connection";
import { desc, eq, and } from "drizzle-orm";
import { exams, users, students, results, type User, type Student, type Exam, type Result } from "@shared/schema";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import { requireAdmin, requireStudent, requireAuth, supabaseMiddleware } from "./supabase-middleware";
import { paperFileStorage } from "./paper-file-storage";
import { registerQuestionRoutes } from "./question-routes";
import { registerProfileRoutes } from "./profile-routes";
// Performance optimization imports removed during migration

declare module "express-session" {
  interface SessionData {
    user: Omit<User, 'password'> & { password?: string };
  }
}

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
  const httpServer = createServer(app);
  
  // WebSocket server for real-time updates
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  
  // Store connected clients
  const clients = new Set();
  
  wss.on('connection', (ws) => {
    console.log('WebSocket client connected');
    clients.add(ws);
    
    ws.on('close', () => {
      console.log('WebSocket client disconnected');
      clients.delete(ws);
    });
    
    ws.on('error', (error) => {
      console.error('WebSocket error:', error);
      clients.delete(ws);
    });
  });
  
  // Function to broadcast updates to all connected clients
  const broadcastUpdate = (type: string, data: any) => {
    const message = JSON.stringify({ type, data });
    clients.forEach((client: any) => {
      if (client.readyState === 1) { // WebSocket.OPEN
        client.send(message);
      }
    });
  };
  
  // Use supabase middleware
  app.use(supabaseMiddleware);

  // Legacy auth middleware for fallback compatibility
  const requireAuthLegacy = (req: Request, res: Response, next: Function) => {
    if (req.session?.user && req.session.user.role === 'admin') {
      return next();
    }
    res.status(401).json({ message: "Unauthorized - Admin access required" });
  };

  const requireStudentAuth = (req: Request, res: Response, next: Function) => {
    const user = req.session?.user;
    if (user && (user.role === 'student' || user.role === 'admin')) {
      return next();
    }
    res.status(401).json({ message: "Unauthorized - Student access required" });
  };

  // Supabase health check
  app.get("/api/supabase/health", async (req: Request, res: Response) => {
    try {
      // Try to fetch a simple count to test the connection
      const result = await getDb().select().from(users).limit(1);
      res.json({ 
        status: "ok", 
        message: "Supabase connection healthy",
        database: isDbConnected() ? "connected" : "disconnected"
      });
    } catch (error) {
      console.error("Supabase health check failed:", error);
      res.status(500).json({ 
        status: "error", 
        message: "Supabase connection failed",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Supabase auth endpoints
  app.post("/api/supabase/auth", async (req: Request, res: Response) => {
    try {
      const { email, password } = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // Check if user exists in database
      const db = getDb();
      const userResult = await db.select().from(users).where(eq(users.email, email)).limit(1);
      
      if (userResult.length === 0) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const user = userResult[0];
      const passwordMatch = await bcrypt.compare(password, user.password);
      
      if (!passwordMatch) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Store user in session
      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.role === 'admin',
        profileImage: user.profileImage,
        studentId: user.studentId,
        emailNotifications: user.emailNotifications,
        smsNotifications: user.smsNotifications,
        emailExamResults: user.emailExamResults,
        emailUpcomingExams: user.emailUpcomingExams,
        smsExamResults: user.smsExamResults,
        smsUpcomingExams: user.smsUpcomingExams,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      res.json({ 
        user: req.session.user,
        message: "Authentication successful"
      });
    } catch (error) {
      console.error("Supabase auth error:", error);
      res.status(500).json({ message: "Authentication failed" });
    }
  });

  app.post("/api/supabase/signout", async (req: Request, res: Response) => {
    try {
      req.session.destroy((err) => {
        if (err) {
          console.error("Session destruction error:", err);
          return res.status(500).json({ message: "Signout failed" });
        }
        res.json({ message: "Signed out successfully" });
      });
    } catch (error) {
      console.error("Supabase signout error:", error);
      res.status(500).json({ message: "Signout failed" });
    }
  });

  // Contact form submission
  app.post("/api/contact", async (req: Request, res: Response) => {
    try {
      const formData: ContactFormData = req.body;
      
      if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        return res.status(400).json({ message: "All fields are required" });
      }

      // For now, just log the contact form data
      console.log("Contact form submission:", formData);
      
      res.json({ message: "Message sent successfully" });
    } catch (error) {
      console.error("Contact form error:", error);
      res.status(500).json({ message: "Failed to send message" });
    }
  });

  // Authentication routes
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password }: LoginCredentials = req.body;
      
      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValid = await bcrypt.compare(password, user.password);
      if (!isValid) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      req.session.user = {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        isAdmin: user.role === 'admin',
        profileImage: user.profileImage,
        studentId: user.studentId,
        emailNotifications: user.emailNotifications,
        smsNotifications: user.smsNotifications,
        emailExamResults: user.emailExamResults,
        emailUpcomingExams: user.emailUpcomingExams,
        smsExamResults: user.smsExamResults,
        smsUpcomingExams: user.smsUpcomingExams,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt
      };

      const { password: _, ...userWithoutPassword } = user;
      res.json(req.session.user);
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/student/login", async (req: Request, res: Response) => {
    try {
      const { email, password }: LoginCredentials = req.body;
      
      const student = await storage.authenticateStudent(email, password);
      if (!student) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Create a user session for the student
      req.session.user = {
        id: student.id,
        email: student.email,
        name: student.name,
        role: 'student',
        isAdmin: false,
        profileImage: null,
        studentId: student.id,
        emailNotifications: true,
        smsNotifications: false,
        emailExamResults: true,
        emailUpcomingExams: true,
        smsExamResults: false,
        smsUpcomingExams: false,
        createdAt: student.createdAt || new Date(),
        updatedAt: student.updatedAt || new Date()
      };

      res.json(req.session.user);
    } catch (error) {
      console.error("Student login error:", error);
      res.status(500).json({ message: "Login failed" });
    }
  });

  app.post("/api/auth/logout", (req: Request, res: Response) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Logout failed" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/session", async (req: Request, res: Response) => {
    try {
      if (req.session?.user) {
        res.json({
          user: req.session.user,
          authenticated: true,
          redirectTo: req.session.user.role === 'admin' ? '/admin' : '/student'
        });
      } else {
        res.json({
          user: null,
          authenticated: false,
          redirectTo: '/login'
        });
      }
    } catch (error) {
      console.error("Session check error:", error);
      res.status(500).json({ message: "Session check failed" });
    }
  });

  // Public landing page statistics
  app.get("/api/landing/statistics", async (req: Request, res: Response) => {
    try {
      const db = getDb();
      
      // Get total students count
      const studentsCount = await db.select().from(students);
      const activeStudents = studentsCount.length;
      
      // Get total admins/educators count
      const educatorsCount = await db.select().from(users).where(eq(users.role, 'admin'));
      const educators = educatorsCount.length;
      
      // Get completed exams count
      const completedExamsCount = await db.select().from(results);
      const examsCompleted = completedExamsCount.length;
      
      // Calculate uptime (assume 99% for now, could be enhanced with actual monitoring)
      const uptime = "99%";
      
      res.json({
        activeStudents,
        educators,
        examsCompleted,
        uptime
      });
    } catch (error) {
      console.error("Error fetching landing statistics:", error);
      res.status(500).json({ message: "Failed to fetch landing statistics" });
    }
  });

  // Get demo credentials for README
  app.get("/api/demo/credentials", async (req: Request, res: Response) => {
    try {
      const db = getDb();
      
      // Get admin users (excluding passwords for security)
      const adminUsers = await db.select({
        email: users.email,
        name: users.name,
        role: users.role
      }).from(users).where(eq(users.role, 'admin')).limit(3);
      
      // Get student users (excluding passwords for security)
      const studentUsers = await db.select({
        email: students.email,
        name: students.name,
        class: students.class,
        enrollmentDate: students.enrollmentDate
      }).from(students).limit(5);
      
      res.json({
        admins: adminUsers,
        students: studentUsers,
        note: "Passwords are not displayed for security reasons. Check your database setup or contact admin for login credentials."
      });
    } catch (error) {
      console.error("Error fetching demo credentials:", error);
      res.status(500).json({ message: "Failed to fetch demo credentials" });
    }
  });

  // Dashboard statistics - Admin only
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
      console.log("Creating student with data:", req.body);
      
      // Validate required fields
      if (!req.body.password || req.body.password.trim() === '') {
        return res.status(400).json({ message: "Password is required and cannot be empty" });
      }
      
      if (!req.body.email || req.body.email.trim() === '') {
        return res.status(400).json({ message: "Email is required" });
      }
      
      if (!req.body.name || req.body.name.trim() === '') {
        return res.status(400).json({ message: "Name is required" });
      }
      
      if (!req.body.class || req.body.class.trim() === '') {
        return res.status(400).json({ message: "Class is required" });
      }
      
      // Prepare student data with proper defaults
      const studentData = {
        name: req.body.name.trim(),
        email: req.body.email.trim(),
        password: req.body.password.trim(),
        class: req.body.class.trim(),
        phone: req.body.phone || null,
        address: req.body.address || null,
        guardianName: req.body.guardianName || null,
        guardianPhone: req.body.guardianPhone || null,
        profileImage: req.body.profileImage || null,
        enrollmentDate: req.body.enrollmentDate ? new Date(req.body.enrollmentDate) : new Date(),
        dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null
      };
      
      console.log("Processed student data:", studentData);
      
      const student = await storage.createStudent(studentData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(500).json({ message: "Failed to create student", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/students/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Updating student with ID:", id, "Data:", req.body);
      
      // Prepare update data
      let updateData: any = {};
      
      // Only include fields that are provided
      if (req.body.name !== undefined) updateData.name = req.body.name.trim();
      if (req.body.email !== undefined) updateData.email = req.body.email.trim();
      if (req.body.class !== undefined) updateData.class = req.body.class.trim();
      if (req.body.phone !== undefined) updateData.phone = req.body.phone || null;
      if (req.body.address !== undefined) updateData.address = req.body.address || null;
      if (req.body.guardianName !== undefined) updateData.guardianName = req.body.guardianName || null;
      if (req.body.guardianPhone !== undefined) updateData.guardianPhone = req.body.guardianPhone || null;
      if (req.body.profileImage !== undefined) updateData.profileImage = req.body.profileImage || null;
      if (req.body.enrollmentDate !== undefined) updateData.enrollmentDate = req.body.enrollmentDate ? new Date(req.body.enrollmentDate) : null;
      if (req.body.dateOfBirth !== undefined) updateData.dateOfBirth = req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null;
      
      // Handle password separately
      if (req.body.password !== undefined) {
        if (req.body.password.trim() === '') {
          return res.status(400).json({ message: "Password cannot be empty" });
        }
        updateData.password = req.body.password.trim();
      }
      
      console.log("Processed update data:", updateData);
      
      const student = await storage.updateStudent(id, updateData);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error("Error updating student:", error);
      res.status(500).json({ message: "Failed to update student", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.delete("/api/students/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log("Deleting student with ID:", id);
      
      const success = await storage.deleteStudent(id);
      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json({ success: true, message: "Student deleted successfully" });
    } catch (error) {
      console.error("Error deleting student:", error);
      res.status(500).json({ message: "Failed to delete student", error: error instanceof Error ? error.message : String(error) });
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
      const resultData = {
        ...req.body,
        submittedAt: req.body.submittedAt ? new Date(req.body.submittedAt) : new Date()
      };
      const result = await storage.createResult(resultData);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating result:", error);
      res.status(500).json({ message: "Failed to create result" });
    }
  });

  app.put("/api/results/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const updateData = {
        ...req.body,
        ...(req.body.submittedAt && { submittedAt: new Date(req.body.submittedAt) })
      };
      const result = await storage.updateResult(id, updateData);
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

  // Student dashboard - Students and Admins only
  app.get("/api/student/dashboard", requireStudent, async (req: Request, res: Response) => {
    try {
      const user = req.session?.user;
      if (!user?.studentId) {
        return res.status(400).json({ message: "Student ID not found" });
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
      let paper = await paperFileStorage.getPaperByExamId(examId);
      
      // If no paper exists for this exam, return a basic structure
      if (!paper) {
        const exam = await storage.getExam(examId);
        if (exam) {
          paper = {
            id: `paper_${examId}_new`,
            examId: examId,
            title: `${exam.name} Question Paper`,
            instructions: "Read all questions carefully before answering.",
            totalQuestions: 0,
            totalMarks: 0,
            questions: [],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            metadata: {
              examName: exam.name,
              lastUpdated: new Date().toISOString(),
              version: '1.0'
            }
          };
        }
      }
      res.json(paper);
    } catch (error) {
      console.error("Error fetching paper:", error);
      res.status(500).json({ message: "Failed to fetch paper" });
    }
  });

  app.post("/api/papers", requireAdmin, async (req: Request, res: Response) => {
    try {
      const examId = parseInt(req.body.examId);
      
      // Get full exam details from database for comprehensive JSON
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }

      // Prepare complete paper data with all exam information and questions
      const paperData = {
        title: req.body.title || exam.name,
        instructions: req.body.instructions || exam.description || "Read all questions carefully before answering.",
        totalQuestions: req.body.totalQuestions || 0,
        totalMarks: req.body.totalMarks || 0,
        questions: req.body.questions || [],
        examDetails: {
          name: exam.name,
          subject: exam.subject,
          date: exam.date.toISOString(),
          duration: exam.duration,
          status: exam.status,
          description: exam.description
        }
      };
      
      const paper = await paperFileStorage.savePaper(examId, paperData);
      res.status(201).json(paper);
    } catch (error) {
      console.error("Error creating paper:", error);
      res.status(500).json({ message: "Failed to create paper" });
    }
  });

  // FIXED: Properly handle string-based paper IDs and save questions
  app.put("/api/papers/:id", requireAdmin, async (req: Request, res: Response) => {
    try {
      const id = req.params.id; // Keep as string - don't parseInt
      
      // Extract examId from paper ID or use examId from request body
      let examId = req.body.examId;
      if (!examId && id.startsWith('paper_')) {
        const match = id.match(/paper_(\d+)_/);
        examId = match ? parseInt(match[1]) : null;
      }
      
      if (!examId) {
        return res.status(400).json({ message: "examId is required" });
      }

      console.log('Updating paper with questions:', req.body.questions?.length || 0);

      // If questions are provided, save the complete paper with questions
      if (req.body.questions && Array.isArray(req.body.questions)) {
        const paperData = {
          title: req.body.title,
          instructions: req.body.instructions || "",
          totalQuestions: parseInt(req.body.totalQuestions) || req.body.questions.length,
          totalMarks: parseInt(req.body.totalMarks) || req.body.questions.reduce((sum: number, q: any) => sum + (q.marks || 0), 0),
          questions: req.body.questions.map((q: any, index: number) => ({
            id: `question_${examId}_${Date.now()}_${index}`,
            question: q.question || q.questionText,
            type: q.type === 'mcq' ? 'multiple_choice' : q.type,
            marks: parseInt(q.marks) || 1,
            orderIndex: q.orderIndex !== undefined ? parseInt(q.orderIndex) : index,
            options: q.options || (q.type === 'mcq' ? [q.optionA, q.optionB, q.optionC, q.optionD].filter(Boolean) : undefined),
            correctAnswer: q.correctAnswer || null,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          }))
        };

        const paper = await paperFileStorage.savePaper(parseInt(examId), paperData);
        if (!paper) {
          return res.status(500).json({ message: "Failed to save paper with questions" });
        }
        console.log('Paper saved with', paper.questions.length, 'questions');
        
        // Broadcast paper and questions update to connected clients
        broadcastUpdate('paper_updated', { examId: parseInt(examId), paperId: paper.id });
        broadcastUpdate('questions_updated', { examId: parseInt(examId), paperId: paper.id, action: 'bulk_updated', count: paper.questions.length });
        
        res.json(paper);
      } else {
        // If no questions provided, just update paper details
        const paper = await paperFileStorage.updatePaperDetails(parseInt(examId), {
          title: req.body.title,
          instructions: req.body.instructions
        });
        if (!paper) {
          return res.status(404).json({ message: "Paper not found" });
        }
        
        // Broadcast paper update to connected clients
        broadcastUpdate('paper_updated', { examId: parseInt(examId), paperId: paper.id });
        
        res.json(paper);
      }
    } catch (error) {
      console.error("Error updating paper:", error);
      res.status(500).json({ message: "Failed to update paper" });
    }
  });

  // Register question routes with WebSocket broadcast function
  registerQuestionRoutes(app, requireAdmin, broadcastUpdate);
  
  // Register profile image upload routes
  registerProfileRoutes(app, requireAuth, requireAdmin, requireStudent);

  return httpServer;
}