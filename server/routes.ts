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

  // Basic auth endpoints
  app.post("/api/auth/login", async (req: Request, res: Response) => {
    try {
      const { email, password }: LoginCredentials = req.body;
      
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }

      // For demo purposes, accept admin@example.com with password "admin"
      if (email === "admin@example.com" && password === "admin") {
        const user = {
          id: 1,
          email: "admin@example.com",
          name: "Admin User",
          role: "admin" as const,
          isAdmin: true,
          profileImage: null,
          studentId: null,
          emailNotifications: true,
          smsNotifications: false,
          emailExamResults: true,
          emailUpcomingExams: true,
          smsExamResults: false,
          smsUpcomingExams: false,
          createdAt: new Date(),
          updatedAt: new Date()
        };

        req.session.user = user;
        res.json(user);
      } else {
        res.status(401).json({ message: "Invalid credentials" });
      }
    } catch (error) {
      console.error("Login error:", error);
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