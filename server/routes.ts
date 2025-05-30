import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import session from "express-session";
import { verifyPassword } from "./utils/password-utils";
import { adminLogin } from "./auth-utils";
import { User } from "@shared/schema";
import MemoryStore from 'memorystore';
import { setupApiRoutes } from "./routes/apiRoutes";

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

  // User registration endpoint
  app.post("/api/auth/register", async (req, res) => {
    try {
      const { email, password, name, role = "student", isAdmin = false } = req.body;
      
      // Validate required fields
      if (!email || !password || !name) {
        return res.status(400).json({ 
          message: "Email, password, and name are required" 
        });
      }
      
      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // Validate password length
      if (password.length < 6) {
        return res.status(400).json({ 
          message: "Password must be at least 6 characters long" 
        });
      }
      
      // Check if user with this email already exists
      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(409).json({ 
          message: "A user with this email already exists" 
        });
      }
      
      // Create new user in the database
      const newUser = await storage.createUser({
        email,
        password, // In a production app, you should hash this password
        name,
        role,
        isAdmin,
        profileImage: null,
        studentId: null
      });
      
      // Dont include password in the response
      const { password: _, ...userWithoutPassword } = newUser;
      
      // Log the user in automatically by storing in session
      req.session.user = userWithoutPassword;
      
      return res.status(201).json({
        message: "User registered successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Registration error:", error);
      return res.status(500).json({ message: "Server error during registration" });
    }
  });

  app.post("/api/auth/login", adminLogin);

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
      
      // First create a sanitized user object without the password
      const { password: _, ...userWithoutPassword } = user;
      
      // Store only the sanitized user object in the session
      req.session.user = userWithoutPassword;
      return res.status(200).json(userWithoutPassword);
    } catch (error) {
      console.error("Student login error:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Get current session user
  app.get("/api/auth/session", (req, res) => {
    // Check if session cookie exists before accessing session to avoid creating empty sessions
    const hasCookie = req.headers.cookie && req.headers.cookie.includes('connect.sid');
    
    if (!hasCookie) {

      return res.status(200).json({ user: null });
    }
    
    // Only log when there's an actual user session to reduce noise
    if (req.session.user) {
      console.log("Session request, current session: User exists");
    }
    if (!req.session.user) {
      return res.status(200).json({ user: null });
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
  
  // Update student profile API
  app.patch("/api/student/profile", requireStudentAuth, async (req, res) => {
    try {
      const user = req.session.user;
      
      if (!user || !user.studentId) {
        return res.status(400).json({ message: "Student ID not found" });
      }
      
      const { fullName, email, profileImage } = req.body;
      
      // Validate email format
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: "Invalid email format" });
        }
      }
      
      // Update the student profile
      const updatedStudent = await storage.updateStudent(user.studentId, {
        name: fullName,
        email,
        profileImage
      });
      
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Update the user in session
      req.session.user = {
        ...user,
        name: fullName || user.name,
        email: email || user.email,
        profileImage: profileImage !== undefined ? profileImage : user.profileImage
      };
      
      return res.status(200).json({ 
        message: "Profile updated successfully",
        user: req.session.user
      });
    } catch (error) {
      console.error("Error updating student profile:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update admin user profile API
  app.put("/api/users/profile", requireAuth, async (req, res) => {
    try {
      const user = req.session.user;
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { name, email, profileImage } = req.body;
      
      // Validate email format
      if (email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(email)) {
          return res.status(400).json({ message: "Invalid email format" });
        }
      }
      
      // Check if another user already has this email
      if (email && email !== user.email) {
        const existingUser = await storage.getUserByEmail(email);
        if (existingUser && existingUser.id !== user.id) {
          return res.status(409).json({ message: "Email is already in use by another account" });
        }
      }
      
      // Update the user profile
      const updatedUser = await storage.updateUser(user.id, {
        name: name || user.name,
        email: email || user.email,
        profileImage: profileImage !== undefined ? profileImage : user.profileImage
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't include password in the response
      const { password: _, ...userWithoutPassword } = updatedUser;
      
      // Update the user in session
      req.session.user = userWithoutPassword;
      
      return res.status(200).json({ 
        message: "Profile updated successfully",
        user: userWithoutPassword
      });
    } catch (error) {
      console.error("Error updating user profile:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update admin user password API
  app.post("/api/users/change-password", requireAuth, async (req, res) => {
    try {
      const user = req.session.user;
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { currentPassword, newPassword } = req.body;
      
      // Validate required fields
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ 
          message: "Current password and new password are required" 
        });
      }
      
      // Validate password length
      if (newPassword.length < 6) {
        return res.status(400).json({ 
          message: "New password must be at least 6 characters long" 
        });
      }
      
      // Get the current user to verify current password
      const currentUser = await storage.getUser(user.id);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Check if current password is correct (implement password compare logic here)
      // In a real app, you'd use bcrypt.compare or similar to check hashed passwords
      if (currentPassword !== currentUser.password) {
        return res.status(400).json({ message: "Current password is incorrect" });
      }
      
      // Update user with new password
      const updatedUser = await storage.updateUser(user.id, {
        password: newPassword
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update password" });
      }
      
      return res.status(200).json({ 
        message: "Password updated successfully" 
      });
    } catch (error) {
      console.error("Error updating user password:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update user notification settings API
  app.put("/api/users/notifications", requireAuth, async (req, res) => {
    try {
      const user = req.session.user;
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      const { emailNotifications, smsNotifications } = req.body;
      
      // Validate that all required fields are present and of correct type
      if (typeof emailNotifications !== 'boolean' || typeof smsNotifications !== 'boolean') {
        return res.status(400).json({ 
          message: "Invalid notification settings format" 
        });
      }
      
      // Get the current user to update their settings
      const currentUser = await storage.getUser(user.id);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Update notification settings to the user object in the database
      const updatedUser = await storage.updateUser(user.id, {
        // Store specific notification flags
        emailNotifications,
        smsNotifications
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update notification settings" });
      }
      
      // Update the user in session to include notification preferences
      if (req.session.user) {
        // Update the user session with notification preferences
        req.session.user = {
          ...req.session.user,
          emailNotifications,
          smsNotifications
        }
      }
      
      return res.status(200).json({ 
        message: "Notification settings updated successfully",
        emailNotifications,
        smsNotifications
      });
    } catch (error) {
      console.error("Error updating notification settings:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update student notification settings API
  app.put("/api/student/notifications", requireStudentAuth, async (req, res) => {
    try {
      const user = req.session.user;
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      // Destructure all notification settings from request body
      const { 
        emailExamResults, 
        emailUpcomingExams, 
        smsExamResults, 
        smsUpcomingExams 
      } = req.body;
      
      // Validate that all fields are present and of correct type
      if (typeof emailExamResults !== 'boolean' || 
          typeof emailUpcomingExams !== 'boolean' ||
          typeof smsExamResults !== 'boolean' || 
          typeof smsUpcomingExams !== 'boolean') {
        return res.status(400).json({ 
          message: "Invalid notification settings format" 
        });
      }
      
      // Get the current user to update their settings
      const currentUser = await storage.getUser(user.id);
      
      if (!currentUser) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Determine whether any email or SMS notifications are enabled
      const emailNotifications = emailExamResults || emailUpcomingExams;
      const smsNotifications = smsExamResults || smsUpcomingExams;
      
      // Update notification preferences to the user object in the database
      const updatedUser = await storage.updateUser(user.id, {
        // Store specific notification flags
        emailNotifications,
        smsNotifications,
        emailExamResults,
        emailUpcomingExams,
        smsExamResults,
        smsUpcomingExams
      });
      
      if (!updatedUser) {
        return res.status(404).json({ message: "Failed to update notification settings" });
      }
      
      // Update the user in session to include notification preferences
      if (req.session.user) {
        // Update the user session with notification preferences
        req.session.user = {
          ...req.session.user,
          emailNotifications,
          smsNotifications,
          emailExamResults,
          emailUpcomingExams,
          smsExamResults,
          smsUpcomingExams
        }
      }
      
      return res.status(200).json({ 
        message: "Notification settings updated successfully",
        emailNotifications,
        smsNotifications,
        emailExamResults,
        emailUpcomingExams,
        smsExamResults,
        smsUpcomingExams
      });
    } catch (error) {
      console.error("Error updating student notification settings:", error);
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
  
  // Student Profile API
  app.get("/api/student/profile", requireStudentAuth, async (req, res) => {
    try {
      const user = req.session.user;
      
      if (!user || !user.studentId) {
        return res.status(400).json({ message: "Student ID not found" });
      }
      
      const student = await storage.getStudent(user.studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      return res.status(200).json(student);
    } catch (error) {
      console.error("Error fetching student profile data:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update Student Profile API
  app.put("/api/student/profile", requireStudentAuth, async (req, res) => {
    try {
      const user = req.session.user;
      
      if (!user) {
        return res.status(401).json({ message: "Authentication required" });
      }
      
      if (!user.studentId) {
        return res.status(400).json({ message: "Student ID not found" });
      }
      
      const { 
        email, 
        profileImage, 
        phone, 
        address, 
        dateOfBirth, 
        guardianName, 
        guardianPhone 
      } = req.body;
      
      // Validate email is required and has a valid format
      if (!email) {
        return res.status(400).json({ 
          message: "Email is required" 
        });
      }
      
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return res.status(400).json({ message: "Invalid email format" });
      }
      
      // Update the student information
      const student = await storage.getStudent(user.studentId);
      
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      // Update student record with the new data
      const studentUpdateData = {
        email,
        phone: phone !== undefined ? phone : student.phone,
        address: address !== undefined ? address : student.address,
        dateOfBirth: dateOfBirth !== undefined ? 
          (dateOfBirth ? dateOfBirth.toString() : null) : 
          student.dateOfBirth,
        guardianName: guardianName !== undefined ? guardianName : student.guardianName,
        guardianPhone: guardianPhone !== undefined ? guardianPhone : student.guardianPhone,
        profileImage: profileImage !== undefined ? profileImage : student.profileImage
      };
      
      console.log("Updating student data:", studentUpdateData);
      
      // Update the student record
      const updatedStudent = await storage.updateStudent(user.studentId, studentUpdateData);
      
      if (!updatedStudent) {
        return res.status(404).json({ message: "Failed to update profile" });
      }
      
      // Also update the user record (only email and profile image)
      const updatedUser = await storage.updateUser(user.id, {
        email,
        profileImage: profileImage !== undefined ? profileImage : user.profileImage
      });
      
      // Update the user in session
      if (req.session.user && updatedUser) {
        req.session.user = {
          ...req.session.user,
          email,
          profileImage: profileImage !== undefined ? profileImage : req.session.user.profileImage
        };
      }
      
      return res.status(200).json({ 
        message: "Profile updated successfully",
        name: updatedStudent.name,
        email: updatedStudent.email,
        phone: updatedStudent.phone,
        address: updatedStudent.address,
        dateOfBirth: updatedStudent.dateOfBirth,
        class: updatedStudent.class,
        guardianName: updatedStudent.guardianName,
        guardianPhone: updatedStudent.guardianPhone,
        profileImage: updatedUser?.profileImage || null,
        user: req.session.user,
        student: updatedStudent
      });
    } catch (error) {
      console.error("Error updating student profile:", error);
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
  
  // Get exam by ID for students taking the exam
  app.get("/api/exams/:id", requireStudentAuth, async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      if (isNaN(examId)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }
      
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // Return the exam with questions (in a real app, you might add more security checks here)
      // For demonstration, we'll create mock questions to match the screenshots
      const examWithQuestions = {
        ...exam,
        questions: [
          {
            id: 1,
            question: "What is 2 + 2?",
            type: "multiple-choice",
            options: ["3", "4", "5", "6"],
            marks: 1
          },
          {
            id: 2,
            question: "Explain the Pythagorean theorem.",
            type: "text",
            marks: 5
          }
        ]
      };
      
      return res.status(200).json(examWithQuestions);
    } catch (error) {
      console.error("Error fetching exam details:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Submit an exam and get result
  app.post("/api/exams/:id/submit", requireStudentAuth, async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      if (isNaN(examId)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }
      
      const user = req.session.user;
      if (!user || !user.studentId) {
        return res.status(400).json({ message: "Student ID not found" });
      }
      
      const { answers } = req.body;
      if (!answers) {
        return res.status(400).json({ message: "No answers provided" });
      }
      
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      // In a real application, you would grade the exam based on the answers
      // For this example, we'll create a mock result
      
      // Get the exam with questions to assess only answered questions
      const examWithQuestions = {
        ...exam,
        questions: [
          {
            id: 1,
            question: "What is 2 + 2?",
            type: "multiple-choice",
            options: ["3", "4", "5", "6"],
            marks: 1
          },
          {
            id: 2,
            question: "Explain the Pythagorean theorem.",
            type: "text",
            marks: 5
          }
        ]
      };
      
      // Calculate total marks only for questions that were answered
      const answeredQuestionIds = Object.keys(answers).map(id => parseInt(id));
      const answeredQuestions = examWithQuestions.questions.filter(q => answeredQuestionIds.includes(q.id));
      const attemptedMarks = answeredQuestions.reduce((total, q) => total + q.marks, 0);
      
      // Calculate a score (this would be based on real grading in a production app)
      // We're using a random score but only for the questions that were attempted
      const score = Math.floor(Math.random() * (attemptedMarks * 0.3)) + Math.floor(attemptedMarks * 0.7); // Score between 70-100% of attempted marks
      const percentage = attemptedMarks > 0 ? Math.round((score / attemptedMarks) * 100) : 0;
      
      // Create a result record
      const result = await storage.createResult({
        studentId: user.studentId,
        examId: examId,
        score: score,
        percentage: percentage,
        submittedAt: new Date()
      });
      
      // Get total participants for rank calculation (mock data)
      const totalParticipants = 50;
      
      // Determine rank (mock data - in a real app, this would be calculated)
      let rank;
      if (percentage >= 90) {
        rank = 1;
      } else if (percentage >= 85) {
        rank = 3;
      } else if (percentage >= 80) {
        rank = 5;
      } else if (percentage >= 75) {
        rank = 10;
      } else {
        rank = 15;
      }
      
      // Return result with added rank, total participants, and attempted marks
      return res.status(200).json({
        ...result,
        rank,
        totalParticipants,
        attemptedMarks,
        exam: {
          ...exam,
          // Include only the essential exam details
          totalMarks: attemptedMarks // Set total marks to attempted marks so UI shows correct percentage
        }
      });
    } catch (error) {
      console.error("Error submitting exam:", error);
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

  // Admin CRUD operations for exams
  
  // Get all exams
  app.get("/api/exams", requireAuth, async (req, res) => {
    try {
      const exams = await storage.getExams();
      return res.status(200).json(exams);
    } catch (error) {
      console.error("Error fetching exams:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get a single exam
  app.get("/api/exams/:id", requireAuth, async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      if (isNaN(examId)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }
      
      const exam = await storage.getExam(examId);
      if (!exam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      return res.status(200).json(exam);
    } catch (error) {
      console.error("Error fetching exam:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Create a new exam
  app.post("/api/exams", requireAuth, async (req, res) => {
    try {
      const examData = req.body;
      if (!examData.name || !examData.subject || !examData.date) {
        return res.status(400).json({ message: "Required fields missing" });
      }
      
      const newExam = await storage.createExam(examData);
      return res.status(201).json(newExam);
    } catch (error) {
      console.error("Error creating exam:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update an exam
  app.put("/api/exams/:id", requireAuth, async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      if (isNaN(examId)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }
      
      const examData = req.body;
      if (!examData) {
        return res.status(400).json({ message: "Exam data is required" });
      }
      
      const updatedExam = await storage.updateExam(examId, examData);
      if (!updatedExam) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      return res.status(200).json(updatedExam);
    } catch (error) {
      console.error("Error updating exam:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Delete an exam
  app.delete("/api/exams/:id", requireAuth, async (req, res) => {
    try {
      const examId = parseInt(req.params.id);
      if (isNaN(examId)) {
        return res.status(400).json({ message: "Invalid exam ID" });
      }
      
      const success = await storage.deleteExam(examId);
      if (!success) {
        return res.status(404).json({ message: "Exam not found" });
      }
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting exam:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Admin CRUD operations for students
  
  // Get all students
  app.get("/api/students", requireAuth, async (req, res) => {
    try {
      const students = await storage.getStudents();
      return res.status(200).json(students);
    } catch (error) {
      console.error("Error fetching students:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Get a single student
  app.get("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }
      
      const student = await storage.getStudent(studentId);
      if (!student) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      return res.status(200).json(student);
    } catch (error) {
      console.error("Error fetching student:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Create a new student
  app.post("/api/students", requireAuth, async (req, res) => {
    try {
      const studentData = req.body;
      if (!studentData.name || !studentData.email) {
        return res.status(400).json({ message: "Name and email are required" });
      }
      
      // Check if a student with this email already exists
      const existingStudent = await storage.getStudentByEmail(studentData.email);
      if (existingStudent) {
        return res.status(409).json({ message: "A student with this email already exists" });
      }
      
      const newStudent = await storage.createStudent(studentData);
      return res.status(201).json(newStudent);
    } catch (error) {
      console.error("Error creating student:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Update a student
  app.put("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }
      
      const studentData = req.body;
      if (!studentData) {
        return res.status(400).json({ message: "Student data is required" });
      }
      
      // If email is being changed, check if the new email already exists
      if (studentData.email) {
        const existingStudent = await storage.getStudentByEmail(studentData.email);
        if (existingStudent && existingStudent.id !== studentId) {
          return res.status(409).json({ message: "A student with this email already exists" });
        }
      }
      
      const updatedStudent = await storage.updateStudent(studentId, studentData);
      if (!updatedStudent) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      return res.status(200).json(updatedStudent);
    } catch (error) {
      console.error("Error updating student:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // Delete a student
  app.delete("/api/students/:id", requireAuth, async (req, res) => {
    try {
      const studentId = parseInt(req.params.id);
      if (isNaN(studentId)) {
        return res.status(400).json({ message: "Invalid student ID" });
      }
      
      const success = await storage.deleteStudent(studentId);
      if (!success) {
        return res.status(404).json({ message: "Student not found" });
      }
      
      return res.status(200).json({ success: true });
    } catch (error) {
      console.error("Error deleting student:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // API route for getting dashboard statistics
  app.get("/api/statistics", requireAuth, async (req, res) => {
    try {
      const statistics = await storage.getStatistics();
      return res.status(200).json(statistics);
    } catch (error) {
      console.error("Error fetching statistics:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });
  
  // API route for getting all results
  app.get("/api/results", requireAuth, async (req, res) => {
    try {
      const results = await storage.getResults();
      return res.status(200).json(results);
    } catch (error) {
      console.error("Error fetching results:", error);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // Setup additional CRUD API routes for all models
  setupApiRoutes(app);

  const httpServer = createServer(app);

  return httpServer;
}
