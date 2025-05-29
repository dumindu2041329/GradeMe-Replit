import { Router } from 'express';
import authRoutes from './authRoutes';
import { User } from '../models/User';
import { Student } from '../models/Student';
import { Exam } from '../models/Exam';
import { Result } from '../models/Result';

const router = Router();

// Authentication middleware
const requireAuth = (req: any, res: any, next: any) => {
  if (!req.session?.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  next();
};

const requireStudentAuth = (req: any, res: any, next: any) => {
  if (!req.session?.user || req.session.user.role !== 'student') {
    return res.status(403).json({ message: 'Student access required' });
  }
  next();
};

// Use auth routes
router.use('/auth', authRoutes);

// Statistics endpoint (admin only)
router.get('/statistics', requireAuth, async (req, res) => {
  try {
    const totalStudents = await Student.count();
    const allExams = await Exam.findAll();
    
    const activeExams = allExams.filter(exam => exam.status === 'active').length;
    const completedExams = allExams.filter(exam => exam.status === 'completed').length;
    const upcomingExams = allExams.filter(exam => exam.status === 'upcoming').length;

    res.json({
      totalStudents,
      activeExams,
      completedExams,
      upcomingExams
    });
  } catch (error) {
    console.error('Error fetching statistics:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Students endpoints
router.get('/students', requireAuth, async (req, res) => {
  try {
    const students = await Student.findAll();
    res.json(students);
  } catch (error) {
    console.error('Error fetching students:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/students/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const student = await Student.findById(id);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error fetching student:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/students', requireAuth, async (req, res) => {
  try {
    const student = await Student.create(req.body);
    res.status(201).json(student);
  } catch (error) {
    console.error('Error creating student:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/students/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const student = await Student.updateById(id, req.body);
    
    if (!student) {
      return res.status(404).json({ message: 'Student not found' });
    }
    
    res.json(student);
  } catch (error) {
    console.error('Error updating student:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/students/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await Student.deleteById(id);
    res.json({ message: 'Student deleted successfully' });
  } catch (error) {
    console.error('Error deleting student:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Exams endpoints
router.get('/exams', requireAuth, async (req, res) => {
  try {
    const exams = await Exam.findAll();
    res.json(exams);
  } catch (error) {
    console.error('Error fetching exams:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/exams/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const exam = await Exam.findById(id);
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    res.json(exam);
  } catch (error) {
    console.error('Error fetching exam:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/exams', requireAuth, async (req, res) => {
  try {
    const exam = await Exam.create(req.body);
    res.status(201).json(exam);
  } catch (error) {
    console.error('Error creating exam:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.put('/exams/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const exam = await Exam.updateById(id, req.body);
    
    if (!exam) {
      return res.status(404).json({ message: 'Exam not found' });
    }
    
    res.json(exam);
  } catch (error) {
    console.error('Error updating exam:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.delete('/exams/:id', requireAuth, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    await Exam.deleteById(id);
    res.json({ message: 'Exam deleted successfully' });
  } catch (error) {
    console.error('Error deleting exam:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Results endpoints
router.get('/results', requireAuth, async (req, res) => {
  try {
    const results = await Result.findAllWithDetails();
    res.json(results);
  } catch (error) {
    console.error('Error fetching results:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/results/student/:studentId', requireAuth, async (req, res) => {
  try {
    const studentId = parseInt(req.params.studentId);
    const results = await Result.findByStudentId(studentId);
    res.json(results);
  } catch (error) {
    console.error('Error fetching student results:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.get('/results/exam/:examId', requireAuth, async (req, res) => {
  try {
    const examId = parseInt(req.params.examId);
    const results = await Result.findByExamId(examId);
    res.json(results);
  } catch (error) {
    console.error('Error fetching exam results:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

router.post('/results', requireAuth, async (req, res) => {
  try {
    const result = await Result.create(req.body);
    res.status(201).json(result);
  } catch (error) {
    console.error('Error creating result:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Student dashboard (student access only)
router.get('/student/dashboard', requireStudentAuth, async (req, res) => {
  try {
    const user = req.session.user;
    const studentId = user.studentId;
    
    if (!studentId) {
      return res.status(400).json({ message: 'Student ID not found' });
    }

    const student = await Student.findById(studentId);
    const examHistory = await Result.getStudentExamHistory(studentId);
    const availableExams = await Exam.getUpcoming();
    
    const totalExams = examHistory.length;
    const averageScore = totalExams > 0 
      ? examHistory.reduce((sum, result) => sum + result.score, 0) / totalExams 
      : 0;
    const bestRank = examHistory.length > 0 
      ? Math.min(...examHistory.map(r => r.rank || 999)) 
      : 0;

    res.json({
      student,
      totalExams,
      averageScore: Math.round(averageScore * 100) / 100,
      bestRank,
      availableExams,
      examHistory
    });
  } catch (error) {
    console.error('Error fetching student dashboard:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

export default router;