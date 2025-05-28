import { Request, Response } from 'express';
import { UserModel } from '../models/User';
import { 
  passwordUpdateSchema,
  notificationPreferencesSchema
} from '@shared/db-schema';

export class UserController {
  // Get user by ID
  static async getUserById(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const user = await UserModel.findById(userId);
      
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove password from response
      const sanitizedUser = UserModel.sanitizeUser(user);
      res.json(sanitizedUser);
    } catch (error) {
      console.error('Error fetching user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Create new user
  static async createUser(req: Request, res: Response) {
    try {
      const validationResult = UserModel.validateInsertUser(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.errors
        });
      }

      const newUser = await UserModel.create(validationResult.data!);
      
      if (!newUser) {
        return res.status(500).json({ message: 'Failed to create user' });
      }

      // Remove password from response
      const sanitizedUser = UserModel.sanitizeUser(newUser);
      res.status(201).json(sanitizedUser);
    } catch (error) {
      console.error('Error creating user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update user
  static async updateUser(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const userId = parseInt(id);

      if (isNaN(userId)) {
        return res.status(400).json({ message: 'Invalid user ID' });
      }

      const validationResult = UserModel.validateUpdateUser(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.errors
        });
      }

      const updatedUser = await UserModel.update(userId, validationResult.data!);

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Remove password from response
      const sanitizedUser = UserModel.sanitizeUser(updatedUser);
      res.json(sanitizedUser);
    } catch (error) {
      console.error('Error updating user:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Change password
  static async changePassword(req: Request, res: Response) {
    try {
      const validationResult = passwordUpdateSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }

      const { currentPassword, newPassword } = validationResult.data;
      const user = req.session.user;

      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const success = await UserModel.changePassword(user.id, currentPassword, newPassword);

      if (!success) {
        return res.status(400).json({ message: 'Failed to change password. Please check your current password.' });
      }

      res.json({ message: 'Password updated successfully' });
    } catch (error) {
      console.error('Error changing password:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }

  // Update notification preferences
  static async updateNotificationPreferences(req: Request, res: Response) {
    try {
      const validationResult = notificationPreferencesSchema.safeParse(req.body);
      
      if (!validationResult.success) {
        return res.status(400).json({ 
          message: 'Validation error',
          errors: validationResult.error.errors
        });
      }

      const user = req.session.user;
      if (!user) {
        return res.status(401).json({ message: 'Authentication required' });
      }

      const updatedUser = await UserModel.update(user.id, validationResult.data);

      if (!updatedUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      // Update session
      if (req.session.user) {
        req.session.user = { 
          ...req.session.user, 
          ...validationResult.data
        };
      }

      res.json({ 
        message: 'Notification preferences updated successfully',
        preferences: validationResult.data
      });
    } catch (error) {
      console.error('Error updating notification preferences:', error);
      res.status(500).json({ message: 'Server error' });
    }
  }
}