import { Router } from 'express';
import { User } from '../models/User';
import { Student } from '../models/Student';

const router = Router();

// Admin login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('Attempting admin login with:', { email, password });

    const user = await User.authenticate(email, password);
    
    if (!user) {
      console.log('Login error:', {});
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('Admin login successful, got user:', user);

    // Store user in session
    req.session.user = User.sanitizeUser(user);
    
    res.json(User.sanitizeUser(user));
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Student login
router.post('/student/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: 'Email and password are required' });
    }

    console.log('Attempting student login with:', { email, password });

    // First find the student by email
    const student = await Student.findByEmail(email);
    if (!student) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Then authenticate via user account
    const user = await User.authenticate(email, password);
    if (!user || user.role !== 'student') {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    console.log('Student login successful, got user:', user);

    // Store user in session
    req.session.user = User.sanitizeUser(user);
    
    res.json(User.sanitizeUser(user));
  } catch (error) {
    console.error('Student login error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

// Logout
router.post('/logout', (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      return res.status(500).json({ message: 'Could not log out' });
    }
    res.json({ message: 'Logged out successfully' });
  });
});

// Get current session
router.get('/session', (req, res) => {
  console.log('Session request, current session:', req.session.user ? 'User logged in' : 'No user in session');
  
  if (req.session.user) {
    res.json({ user: req.session.user });
  } else {
    res.json({ user: null });
  }
});

export default router;