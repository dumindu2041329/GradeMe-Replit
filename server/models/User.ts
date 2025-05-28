import { 
  User as UserType, 
  InsertUser, 
  userSchema,
  insertUserSchema,
  updateUserSchema
} from '@shared/db-schema';
import { storage } from '../storage';
import { hashPassword, verifyPassword } from '../utils/password-utils';

export class UserModel {
  // Validate user data
  static validateUser(data: any): { success: boolean; data?: UserType; errors?: any } {
    const result = userSchema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error.errors
    };
  }

  static validateInsertUser(data: any): { success: boolean; data?: InsertUser; errors?: any } {
    const result = insertUserSchema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error.errors
    };
  }

  static validateUpdateUser(data: any): { success: boolean; data?: Partial<InsertUser>; errors?: any } {
    const result = updateUserSchema.safeParse(data);
    return {
      success: result.success,
      data: result.success ? result.data : undefined,
      errors: result.success ? undefined : result.error.errors
    };
  }

  // Business logic methods
  static async findById(id: number): Promise<UserType | null> {
    try {
      const user = await storage.getUser(id);
      return user || null;
    } catch (error) {
      console.error('Error finding user by ID:', error);
      return null;
    }
  }

  static async findByEmail(email: string): Promise<UserType | null> {
    try {
      const user = await storage.getUserByEmail(email);
      return user || null;
    } catch (error) {
      console.error('Error finding user by email:', error);
      return null;
    }
  }

  static async create(userData: InsertUser): Promise<UserType | null> {
    try {
      // Check if user already exists
      const existingUser = await this.findByEmail(userData.email);
      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password before storing
      const hashedPassword = await hashPassword(userData.password);
      
      const newUser = await storage.createUser({
        ...userData,
        password: hashedPassword,
        createdAt: new Date(),
        updatedAt: new Date()
      });

      return newUser;
    } catch (error) {
      console.error('Error creating user:', error);
      return null;
    }
  }

  static async update(id: number, updateData: Partial<InsertUser>): Promise<UserType | null> {
    try {
      // If password is being updated, hash it
      if (updateData.password) {
        updateData.password = await hashPassword(updateData.password);
      }

      const updatedUser = await storage.updateUser(id, {
        ...updateData,
        updatedAt: new Date()
      });

      return updatedUser || null;
    } catch (error) {
      console.error('Error updating user:', error);
      return null;
    }
  }

  static async authenticate(email: string, password: string): Promise<UserType | null> {
    try {
      const user = await this.findByEmail(email);
      if (!user) {
        return null;
      }

      const isPasswordValid = await verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return null;
      }

      return user;
    } catch (error) {
      console.error('Error authenticating user:', error);
      return null;
    }
  }

  static async changePassword(id: number, currentPassword: string, newPassword: string): Promise<boolean> {
    try {
      const user = await this.findById(id);
      if (!user) {
        return false;
      }

      const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        return false;
      }

      const hashedNewPassword = await hashPassword(newPassword);
      const updatedUser = await storage.updateUser(id, {
        password: hashedNewPassword,
        updatedAt: new Date()
      });

      return !!updatedUser;
    } catch (error) {
      console.error('Error changing password:', error);
      return false;
    }
  }

  // Remove password from user object for safe responses
  static sanitizeUser(user: UserType): Omit<UserType, 'password'> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}