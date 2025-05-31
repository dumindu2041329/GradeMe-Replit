import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { User } from "@shared/schema";
import MemoryStore from 'memorystore';

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
  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
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

  app.get("/api/auth/session", (req: Request, res: Response) => {
    if (req.session.user) {
      res.json({ user: req.session.user });
    } else {
      res.json({ user: null });
    }
  });

  // Statistics endpoint
  app.get("/api/statistics", requireAuth, async (req: Request, res: Response) => {
    try {
      const stats = await storage.getStatistics();
      res.json(stats);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });

  // Students CRUD operations
  app.get("/api/students", requireAuth, async (req: Request, res: Response) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.post("/api/students", requireAuth, async (req: Request, res: Response) => {
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

  app.put("/api/students/:id", requireAuth, async (req: Request, res: Response) => {
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

  app.delete("/api/students/:id", requireAuth, async (req: Request, res: Response) => {
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

  app.post("/api/exams", requireAuth, async (req: Request, res: Response) => {
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

  app.put("/api/exams/:id", requireAuth, async (req: Request, res: Response) => {
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

  app.delete("/api/exams/:id", requireAuth, async (req: Request, res: Response) => {
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

  // Results CRUD operations
  app.get("/api/results", requireAuth, async (req: Request, res: Response) => {
    try {
      const results = await storage.getResults();
      res.json(results);
    } catch (error) {
      console.error("Error fetching results:", error);
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  app.post("/api/results", requireAuth, async (req: Request, res: Response) => {
    try {
      const result = await storage.createResult(req.body);
      res.status(201).json(result);
    } catch (error) {
      console.error("Error creating result:", error);
      res.status(500).json({ message: "Failed to create result" });
    }
  });

  app.put("/api/results/:id", requireAuth, async (req: Request, res: Response) => {
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

  app.delete("/api/results/:id", requireAuth, async (req: Request, res: Response) => {
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

  // Student dashboard data
  app.get("/api/student/dashboard", requireStudentAuth, async (req: Request, res: Response) => {
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

  return createServer(app);
}