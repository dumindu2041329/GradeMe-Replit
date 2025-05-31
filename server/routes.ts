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

  // Simple demo statistics
  app.get("/api/statistics", (req: Request, res: Response) => {
    res.json({
      totalStudents: 0,
      activeExams: 0,
      completedExams: 0,
      upcomingExams: 0
    });
  });

  // Simple demo exams list
  app.get("/api/exams", (req: Request, res: Response) => {
    res.json([]);
  });

  return createServer(app);
}