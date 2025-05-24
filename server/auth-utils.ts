import { Request, Response } from 'express';
import { storage } from './storage';
import { verifyPassword } from './utils/password-utils';

/**
 * Admin login helper function with secure password verification
 */
export async function adminLogin(req: Request, res: Response) {
  try {
    const { email, password } = req.body;
    
    // Validate credentials
    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }
    
    // Find user by email
    const user = await storage.getUserByEmail(email);
    
    // Check if user exists
    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // Verify password securely
    const passwordMatch = await verifyPassword(password, user.password);
    
    if (!passwordMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }
    
    // Check if user is an admin - this endpoint is for admins only
    if (user.role !== "admin") {
      return res.status(403).json({ 
        message: "Access denied. Please use the student login page instead." 
      });
    }
    
    // Create a sanitized user object without the password
    const { password: _, ...userWithoutPassword } = user;
    
    // Store only the sanitized user object in the session
    req.session.user = userWithoutPassword;
    return res.status(200).json(userWithoutPassword);
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ message: "Server error" });
  }
}