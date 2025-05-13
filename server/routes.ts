import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { User } from "@shared/schema";
import MemoryStore from 'memorystore';

// Session types for TypeScript
declare module "express-session" {
  interface SessionData {
    user: User;
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
  // Configure session middleware
  const SessionStore = MemoryStore(session);
  app.use(session({
    secret: process.env.SESSION_SECRET || 'your-session-secret',
    resave: false,
    saveUninitialized: false,
    store: new SessionStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    }),
    cookie: {
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      secure: process.env.NODE_ENV === 'production'
    }
  }));



  // Authentication middleware
  const requireAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    next();
  };
  
  // Student authentication middleware
  const requireStudentAuth = (req: Request, res: Response, next: Function) => {
    if (!req.session.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }
    if (req.session.user.role !== 'student') {
      return res.status(403).json({ message: 'Student access only' });
    }
    next();
  };

  // Authentication routes
  app.get("/api/auth/session", (req, res) => {
    if (req.session.user) {
      return res.status(200).json(req.session.user);
    }
    return res.status(200).json(null);
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password }: LoginCredentials = req.body;
      
      // Validate credentials
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // Find user by email
      const user = await storage.getUserByEmail(email);
      
      // Check if user exists and password matches
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Check if user is an admin - this endpoint is for admins only
      if (user.role !== "admin") {
        return res.status(403).json({ 
          message: "Access denied. Please use the student login page instead." 
        });
      }
      
      // Set user in session
      req.session.user = user;
      
      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  app.post("/api/auth/student/login", async (req, res) => {
    try {
      const { email, password }: LoginCredentials = req.body;
      
      // Validate credentials
      if (!email || !password) {
        return res.status(400).json({ message: "Email and password are required" });
      }
      
      // First check if this is a valid user with student role
      const user = await storage.getUserByEmail(email);
      
      // If user doesn't exist or is not a student, return an error
      if (!user) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      if (user.role !== "student") {
        return res.status(403).json({ 
          message: "Access denied. Please use the admin login page instead." 
        });
      }
      
      // Validate student credentials
      const student = await storage.authenticateStudent(email, password);
      
      if (!student) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Set user in session
      req.session.user = user;
      
      // Return user data (without password)
      const { password: _, ...userWithoutPassword } = user;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Student login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get current session user
  app.get("/api/auth/session", (req, res) => {
    console.log("Session request, current session:", req.session.user ? "User exists" : "No user in session");
    if (!req.session.user) {
      return res.status(401).json({ message: "Not authenticated" });
    }
    
    // Return user data without password
    const { password: _, ...userWithoutPassword } = req.session.user;
    return res.status(200).json(userWithoutPassword);
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err) => {
      if (err) {
        console.error("Logout error:", err);
        return res.status(500).json({ message: "Error logging out" });
      }
      res.clearCookie('connect.sid');
      return res.status(200).json({ message: "Logged out successfully" });
    });
  });

  app.post("/api/auth/reset-password", requireAuth, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = req.session.user;
      
      // Validate passwords
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "Both current and new password are required" });
      }
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Check current password
      if (user.password !== currentPassword) {
        return res.status(401).json({ message: "Current password is incorrect" });
      }
      
      // Update password
      const updatedUser = await storage.updateUser(user.id, { password: newPassword });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update session
      req.session.user = updatedUser;
      
      return res.status(200).json({ message: "Password updated successfully" });
    } catch (error) {
      console.error("Reset password error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Student Dashboard API
  app.get("/api/student/dashboard", requireStudentAuth, async (req, res) => {
    try {
      const user = req.session.user;
      
      if (!user || !user.studentId) {
        return res.status(400).json({ message: "Student ID not found" });
      }
      
      const dashboardData = await storage.getStudentDashboardData(user.studentId);
      
      return res.status(200).json(dashboardData);
    } catch (error) {
      console.error("Error fetching student dashboard data:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Student Results API
  app.get("/api/student/results", requireStudentAuth, async (req, res) => {
    try {
      const user = req.session.user;
      
      if (!user || !user.studentId) {
        return res.status(400).json({ message: "Student ID not found" });
      }
      
      const results = await storage.getResultsByStudentId(user.studentId);
      
      // Add rank and total participants for each result (mock data)
      const resultsWithRank = results.map((result, index) => {
        return {
          ...result,
          rank: index === 0 ? 1 : (index === 1 ? 3 : 5),
          totalParticipants: 50
        };
      });
      
      return res.status(200).json(resultsWithRank);
    } catch (error) {
      console.error("Error fetching student results:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Available Exams API
  app.get("/api/exams/available", requireStudentAuth, async (req, res) => {
    try {
      // Get active and upcoming exams
      const activeExams = await storage.getExamsByStatus("active");
      const upcomingExams = await storage.getExamsByStatus("upcoming");
      
      // Combine and sort by date
      const availableExams = [...activeExams, ...upcomingExams].sort((a, b) => {
        return new Date(a.date).getTime() - new Date(b.date).getTime();
      });
      
      return res.status(200).json(availableExams);
    } catch (error) {
      console.error("Error fetching available exams:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // API route for contact form submissions
  app.post("/api/contact", async (req, res) => {
    try {
      const formData: ContactFormData = req.body;
      
      // Validate form data
      if (!formData.name || !formData.email || !formData.subject || !formData.message) {
        return res.status(400).json({ 
          success: false, 
          message: "All fields are required" 
        });
      }
      
      // In a real application, you would save this to a database
      // or send an email. Here we just log it.
      console.log("Contact form submission:", formData);
      
      return res.status(200).json({ 
        success: true, 
        message: "Form submitted successfully" 
      });
    } catch (error) {
      console.error("Error processing contact form:", error);
      return res.status(500).json({ 
        success: false, 
        message: "An error occurred while processing your request" 
      });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
