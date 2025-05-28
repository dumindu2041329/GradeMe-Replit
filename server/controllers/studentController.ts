import { Request, Response } from 'express';
import { StudentModel } from '../models/Student';
import { studentLoginSchema } from '@shared/db-schema';

export class StudentController {
  // Get all students
  static async getAllStudents(req: Request, res: Response) {
    try {
      const students = await storage.getStudents();
      res.json(students);
    } catch (error) {
      console.error('Error fetching students:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get student by ID
  static async getStudentById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      if (isNaN(studentId)) {
        return res.status(400).json({ message: 'Invalid student ID' });
      }

      const student = await storage.getStudent(studentId);
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      res.json(student);
    } catch (error) {
      console.error('Error fetching student:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get student by email
  static async getStudentByEmail(req: Request, res: Response) {
    try {
      const { email } = req.params;

      if (!email) {
        return res.status(400).json({ message: 'Email is required' });
      }

      const student = await storage.getStudentByEmail(email);
      
      if (!student) {
        return res.status(404).json({ message: 'Student not found' });
      }

      res.json(student);
    } catch (error) {
      console.error('Error fetching student by email:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Create new student
  static async createStudent(req: Request, res: Response) {
    try {
      const validationResult = insertStudentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }

      const studentData = validationResult.data;

      // Check if student already exists
      const existingStudent = await storage.getStudentByEmail(studentData.email);
      if (existingStudent) {
        return res.status(409).json({ message: 'Student with this email already exists' });
      }

      const newStudent = await storage.createStudent({
        ...studentData,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      res.status(201).json(newStudent);
    } catch (error) {
      console.error('Error creating student:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update student
  static async updateStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      if (isNaN(studentId)) {
        return res.status(400).json({ message: 'Invalid student ID' });
      }

      const validationResult = updateStudentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }

      const updateData = validationResult.data;

      // Check if email is being updated and already exists
      if (updateData.email) {
        const existingStudent = await storage.getStudentByEmail(updateData.email);
        if (existingStudent && existingStudent.id !== studentId) {
          return res.status(409).json({ message: 'Email is already in use by another student' });
        }
      }

      const updatedStudent = await storage.updateStudent(studentId, {
        ...updateData,
        updatedAt: new Date()
      });

      if (!updatedStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }

      res.json(updatedStudent);
    } catch (error) {
      console.error('Error updating student:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Delete student
  static async deleteStudent(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      if (isNaN(studentId)) {
        return res.status(400).json({ message: 'Invalid student ID' });
      }

      const deleted = await storage.deleteStudent(studentId);

      if (!deleted) {
        return res.status(404).json({ message: 'Student not found' });
      }

      res.json({ message: 'Student deleted successfully' });
    } catch (error) {
      console.error('Error deleting student:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Authenticate student login
  static async authenticateStudent(req: Request, res: Response) {
    try {
      const validationResult = studentLoginSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }

      const { email, password } = validationResult.data;

      const student = await storage.authenticateStudent(email, password);
      
      if (!student) {
        return res.status(401).json({ message: 'Invalid email or password' });
      }

      // Store student in session
      req.session.user = {
        id: student.id,
        email: student.email,
        name: student.name,
        role: 'student',
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

      res.json(student);
    } catch (error) {
      console.error('Error authenticating student:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Get student dashboard data
  static async getStudentDashboard(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const studentId = parseInt(id);

      if (isNaN(studentId)) {
        return res.status(400).json({ message: 'Invalid student ID' });
      }

      const dashboardData = await storage.getStudentDashboardData(studentId);
      res.json(dashboardData);
    } catch (error) {
      console.error('Error fetching student dashboard data:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update student profile (authenticated)
  static async updateProfile(req: Request, res: Response) {
    try {
      const user = req.session.user;
      
      if (!user || !user.studentId) {
        return res.status(400).json({ message: 'Student ID not found in session' });
      }

      const validationResult = updateStudentSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }

      const updateData = validationResult.data;

      // Check if email is being updated and already exists
      if (updateData.email && updateData.email !== user.email) {
        const existingStudent = await storage.getStudentByEmail(updateData.email);
        if (existingStudent && existingStudent.id !== user.studentId) {
          return res.status(409).json({ message: 'Email is already in use by another student' });
        }
      }

      const updatedStudent = await storage.updateStudent(user.studentId, {
        ...updateData,
        updatedAt: new Date()
      });

      if (!updatedStudent) {
        return res.status(404).json({ message: 'Student not found' });
      }

      // Update session
      req.session.user = {
        ...user,
        name: updateData.name || user.name,
        email: updateData.email || user.email,
        profileImage: updateData.profileImage !== undefined ? updateData.profileImage : user.profileImage
      };

      res.json({ 
        message: 'Profile updated successfully',
        student: updatedStudent
      });
    } catch (error) {
      console.error('Error updating student profile:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}