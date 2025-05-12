import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import { 
  loginUserSchema, 
  insertStudentSchema, 
  insertExamSchema, 
  insertResultSchema,
  updateUserSchema,
  studentLoginSchema
} from "@shared/schema";
import session from "express-session";
import memorystore from "memorystore";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import bcrypt from "bcryptjs";

const MemoryStore = memorystore(session);

export async function registerRoutes(app: Express): Promise<Server> {
  // Session setup
  app.use(
    session({
      secret: process.env.SESSION_SECRET || "grademe-secret-key",
      resave: false,
      saveUninitialized: false,
      cookie: { secure: process.env.NODE_ENV === "production", maxAge: 24 * 60 * 60 * 1000 }, // 1 day
      store: new MemoryStore({
        checkPeriod: 86400000, // prune expired entries every 24h
      }),
    })
  );

  // Passport setup
  app.use(passport.initialize());
  app.use(passport.session());

  // User serialization
  passport.serializeUser((user: any, done) => {
    done(null, user.id);
  });

  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (err) {
      done(err);
    }
  });

  // Local strategy setup
  passport.use(
    new LocalStrategy(
      { usernameField: "email" },
      async (email, password, done) => {
        try {
          const user = await storage.getUserByEmail(email);
          if (!user) {
            return done(null, false, { message: "User not found" });
          }

          // For simplicity, we're not hashing passwords in this example
          // In production, you should use bcrypt.compare
          if (user.password !== password) {
            return done(null, false, { message: "Incorrect password" });
          }

          return done(null, user);
        } catch (err) {
          return done(err);
        }
      }
    )
  );

  // Authentication middleware
  const isAuthenticated = (req: Request, res: Response, next: Function) => {
    if (req.isAuthenticated()) {
      return next();
    }
    res.status(401).json({ message: "Not authenticated" });
  };

  // Authentication routes
  app.post("/api/auth/login", (req, res, next) => {
    try {
      const { email, password } = loginUserSchema.parse(req.body);
      
      passport.authenticate("local", (err: Error, user: any, info: any) => {
        if (err) {
          return next(err);
        }
        if (!user) {
          return res.status(401).json({ message: info.message || "Authentication failed" });
        }
        req.logIn(user, (err) => {
          if (err) {
            return next(err);
          }
          return res.json({ 
            id: user.id, 
            email: user.email, 
            name: user.name, 
            isAdmin: user.isAdmin 
          });
        });
      })(req, res, next);
    } catch (error) {
      res.status(400).json({ message: "Invalid input data" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.logout(() => {
      res.status(200).json({ message: "Logged out successfully" });
    });
  });

  // Password reset endpoint (simplified for demo purposes)
  app.post("/api/auth/reset-password", async (req, res) => {
    try {
      const { email } = req.body;
      
      if (!email) {
        return res.status(400).json({ message: "Email is required" });
      }
      
      // Check if user exists
      const user = await storage.getUserByEmail(email);
      
      // For security reasons, always return success whether the email exists or not
      // This prevents user enumeration attacks
      res.status(200).json({ 
        message: "If an account with that email exists, a password reset link has been sent." 
      });
      
      // In a real application, you would:
      // 1. Generate a reset token and store it in the database with an expiration
      // 2. Send an email with a link containing the token
      // 3. Create an endpoint to validate the token and allow setting a new password
      
      console.log(`Password reset requested for email: ${email}. User exists: ${!!user}`);
    } catch (error) {
      console.error("Password reset error:", error);
      res.status(500).json({ message: "An error occurred while processing your request" });
    }
  });

  app.get("/api/auth/session", (req, res) => {
    if (req.isAuthenticated()) {
      const user = req.user as any;
      res.json({ 
        id: user.id, 
        email: user.email, 
        name: user.name, 
        isAdmin: user.isAdmin,
        profileImage: user.profileImage 
      });
    } else {
      res.status(401).json({ message: "Not authenticated" });
    }
  });

  // User profile update
  app.put("/api/users/profile", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      const validData = updateUserSchema.parse(req.body);
      
      // Check if email is being updated and if it already exists
      if (validData.email && validData.email !== user.email) {
        const existingUser = await storage.getUserByEmail(validData.email);
        if (existingUser) {
          return res.status(400).json({ message: "User with this email already exists" });
        }
      }
      
      const updatedUser = await storage.updateUser(user.id, validData);
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ 
        id: updatedUser.id, 
        email: updatedUser.email, 
        name: updatedUser.name, 
        isAdmin: updatedUser.isAdmin,
        profileImage: updatedUser.profileImage 
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      res.status(400).json({ message: "Invalid user data", error: String(error) });
    }
  });

  // Student routes
  app.get("/api/students", isAuthenticated, async (req, res) => {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch students" });
    }
  });

  app.get("/api/students/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const student = await storage.getStudent(id);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch student" });
    }
  });

  app.post("/api/students", isAuthenticated, async (req, res) => {
    try {
      console.log("Creating student with data:", req.body);
      
      // Create a custom schema to properly handle the date field
      const validData = z.object({
        name: z.string(),
        email: z.string().email(),
        class: z.string(),
        enrollmentDate: z.string().or(z.date()).transform((val: string | Date) => new Date(val)),
      }).parse(req.body);
      
      console.log("Parsed student data:", validData);
      
      // Check if student with email already exists
      const existingStudent = await storage.getStudentByEmail(validData.email);
      if (existingStudent) {
        return res.status(400).json({ message: "Student with this email already exists" });
      }
      
      const student = await storage.createStudent(validData);
      res.status(201).json(student);
    } catch (error) {
      console.error("Error creating student:", error);
      res.status(400).json({ message: "Invalid student data", error: String(error) });
    }
  });

  app.put("/api/students/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Updating student ${id} with data:`, req.body);
      
      // We've removed the .partial() call and manually pick only the fields we need
      const validData = z.object({
        name: z.string().optional(),
        email: z.string().email().optional(),
        class: z.string().optional(),
        enrollmentDate: z.string().or(z.date()).optional().transform((val: string | Date | undefined) => val ? new Date(val) : undefined),
      }).parse(req.body);
      
      console.log("Parsed student data for update:", validData);
      
      // Check if email is being updated and if it already exists
      if (validData.email) {
        const existingStudent = await storage.getStudentByEmail(validData.email);
        if (existingStudent && existingStudent.id !== id) {
          return res.status(400).json({ message: "Student with this email already exists" });
        }
      }
      
      const student = await storage.updateStudent(id, validData);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.json(student);
    } catch (error) {
      console.error(`Error updating student ${req.params.id}:`, error);
      res.status(400).json({ message: "Invalid student data", error: String(error) });
    }
  });

  app.delete("/api/students/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStudent(id);
      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete student" });
    }
  });

  // Exam routes
  app.get("/api/exams", isAuthenticated, async (req, res) => {
    try {
      const exams = await storage.getExams();
      res.json(exams);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exams" });
    }
  });

  app.get("/api/exams/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const exam = await storage.getExam(id);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch exam" });
    }
  });

  app.post("/api/exams", isAuthenticated, async (req, res) => {
    try {
      console.log("Creating exam with data:", req.body);
      
      // Create a custom schema to properly handle the date field
      const validData = z.object({
        name: z.string(),
        subject: z.string(),
        date: z.string().or(z.date()).transform((val: string | Date) => new Date(val)),
        duration: z.number().or(z.string().transform((val: string) => parseInt(val))),
        totalMarks: z.number().or(z.string().transform((val: string) => parseInt(val))),
        status: z.enum(["upcoming", "active", "completed"]).default("upcoming"),
      }).parse(req.body);
      
      console.log("Parsed exam data:", validData);
      const exam = await storage.createExam(validData);
      res.status(201).json(exam);
    } catch (error) {
      console.error("Error creating exam:", error);
      res.status(400).json({ message: "Invalid exam data", error: String(error) });
    }
  });

  app.put("/api/exams/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`Updating exam ${id} with data:`, req.body);
      
      // We've removed the .partial() call and manually pick only the fields we need
      const validData = z.object({
        name: z.string().optional(),
        subject: z.string().optional(),
        date: z.string().or(z.date()).optional().transform((val: string | Date | undefined) => val ? new Date(val) : undefined),
        duration: z.number().or(z.string().transform((val: string) => parseInt(val))).optional(),
        totalMarks: z.number().or(z.string().transform((val: string) => parseInt(val))).optional(),
        status: z.enum(["upcoming", "active", "completed"]).optional(),
      }).parse(req.body);
      
      console.log("Parsed exam data for update:", validData);
      const exam = await storage.updateExam(id, validData);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.json(exam);
    } catch (error) {
      console.error(`Error updating exam ${req.params.id}:`, error);
      res.status(400).json({ message: "Invalid exam data", error: String(error) });
    }
  });

  app.delete("/api/exams/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteExam(id);
      if (!success) {
        return res.status(404).json({ message: "Exam not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete exam" });
    }
  });

  // Result routes
  app.get("/api/results", isAuthenticated, async (req, res) => {
    try {
      console.log("Fetching all results");
      const results = await storage.getResults();
      console.log(`Fetched ${results.length} results`);
      res.json(results);
    } catch (error) {
      console.error("Error fetching results:", error);
      res.status(500).json({ message: "Failed to fetch results" });
    }
  });

  app.get("/api/results/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const result = await storage.getResult(id);
      if (!result) {
        return res.status(404).json({ message: "Result not found" });
      }
      res.json(result);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch result" });
    }
  });

  app.post("/api/results", isAuthenticated, async (req, res) => {
    try {
      const resultData = insertResultSchema.parse(req.body);
      const result = await storage.createResult(resultData);
      res.status(201).json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid result data" });
    }
  });

  app.put("/api/results/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const resultData = insertResultSchema.partial().parse(req.body);
      const result = await storage.updateResult(id, resultData);
      if (!result) {
        return res.status(404).json({ message: "Result not found" });
      }
      res.json(result);
    } catch (error) {
      res.status(400).json({ message: "Invalid result data" });
    }
  });

  app.delete("/api/results/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteResult(id);
      if (!success) {
        return res.status(404).json({ message: "Result not found" });
      }
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete result" });
    }
  });

  // Dashboard statistics
  app.get("/api/statistics", isAuthenticated, async (req, res) => {
    try {
      const statistics = await storage.getStatistics();
      res.json(statistics);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch statistics" });
    }
  });
  
  // Student-specific routes
  app.post("/api/auth/student/login", async (req, res) => {
    try {
      const { email, password } = studentLoginSchema.parse(req.body);
      
      const student = await storage.authenticateStudent(email, password);
      
      if (!student) {
        return res.status(401).json({ message: "Invalid email or password" });
      }
      
      // Create session for the student
      req.login({
        id: student.id,
        email: student.email,
        name: student.name,
        isAdmin: false,
        role: "student",
        studentId: student.id
      }, (err) => {
        if (err) {
          return res.status(500).json({ message: "Error creating session" });
        }
        
        return res.json({
          id: student.id,
          email: student.email,
          name: student.name,
          isAdmin: false,
          role: "student",
          studentId: student.id
        });
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid input data" });
      }
      res.status(500).json({ message: "Internal server error" });
    }
  });
  
  // Student dashboard data
  app.get("/api/student/dashboard", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Check if user is a student
      if (!user.studentId) {
        return res.status(403).json({ message: "Access denied. Student only resource." });
      }
      
      const dashboardData = await storage.getStudentDashboardData(user.studentId);
      res.json(dashboardData);
    } catch (error) {
      console.error("Error fetching student dashboard data:", error);
      res.status(500).json({ message: "Failed to fetch dashboard data" });
    }
  });
  
  // Available exams for a student
  app.get("/api/student/exams/available", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Check if user is a student
      if (!user.studentId) {
        return res.status(403).json({ message: "Access denied. Student only resource." });
      }
      
      const upcomingExams = await storage.getExamsByStatus("upcoming");
      const activeExams = await storage.getExamsByStatus("active");
      
      // Combine and sort by date
      const availableExams = [...upcomingExams, ...activeExams]
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
      
      res.json(availableExams);
    } catch (error) {
      console.error("Error fetching available exams:", error);
      res.status(500).json({ message: "Failed to fetch available exams" });
    }
  });
  
  // Exam history for a student
  app.get("/api/student/exams/history", isAuthenticated, async (req, res) => {
    try {
      const user = req.user as any;
      
      // Check if user is a student
      if (!user.studentId) {
        return res.status(403).json({ message: "Access denied. Student only resource." });
      }
      
      const examHistory = await storage.getResultsByStudentId(user.studentId);
      res.json(examHistory);
    } catch (error) {
      console.error("Error fetching exam history:", error);
      res.status(500).json({ message: "Failed to fetch exam history" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
