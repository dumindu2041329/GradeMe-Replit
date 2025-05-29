import { User as UserType } from '@shared/schema';
import { BaseModel } from './BaseModel';
import { hashPassword, verifyPassword } from '../utils/password-utils';

export class User extends BaseModel {
  protected static tableName = 'users';

  /**
   * Find user by email
   */
  static async findByEmail(email: string): Promise<UserType | null> {
    return this.findOneBy<UserType>('email', email);
  }

  /**
   * Create new user with hashed password
   */
  static async create(userData: Omit<UserType, 'id' | 'createdAt' | 'updatedAt'>): Promise<UserType> {
    // Check if user already exists
    const existingUser = await this.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('User with this email already exists');
    }

    // Hash password before storing
    const hashedPassword = await hashPassword(userData.password);
    
    const userDataWithHashedPassword = {
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    return super.create<UserType>(userDataWithHashedPassword);
  }

  /**
   * Update user with password hashing if needed
   */
  static async updateById(id: number, userData: Partial<UserType>): Promise<UserType | null> {
    // Hash password if it's being updated
    if (userData.password) {
      userData.password = await hashPassword(userData.password);
    }

    const updateData = {
      ...userData,
      updatedAt: new Date()
    };

    return super.updateById<UserType>(id, updateData);
  }

  /**
   * Authenticate user with email and password
   */
  static async authenticate(email: string, password: string): Promise<UserType | null> {
    const user = await this.findByEmail(email);
    
    if (!user) {
      return null;
    }

    const isValidPassword = await verifyPassword(password, user.password);
    
    if (!isValidPassword) {
      return null;
    }

    return user;
  }

  /**
   * Get all admin users
   */
  static async findAdmins(): Promise<UserType[]> {
    return this.findBy<UserType>('is_admin', true);
  }

  /**
   * Get all users by role
   */
  static async findByRole(role: string): Promise<UserType[]> {
    return this.findBy<UserType>('role', role);
  }

  /**
   * Check if user exists by email
   */
  static async existsByEmail(email: string): Promise<boolean> {
    const user = await this.findByEmail(email);
    return user !== null;
  }

  /**
   * Change user password
   */
  static async changePassword(id: number, currentPassword: string, newPassword: string): Promise<boolean> {
    const user = await this.findById<UserType>(id);
    if (!user) {
      return false;
    }

    const isCurrentPasswordValid = await verifyPassword(currentPassword, user.password);
    if (!isCurrentPasswordValid) {
      return false;
    }

    const hashedNewPassword = await hashPassword(newPassword);
    const updatedUser = await this.updateById(id, {
      password: hashedNewPassword
    });

    return !!updatedUser;
  }

  /**
   * Remove password from user object for safe responses
   */
  static sanitizeUser(user: UserType): Omit<UserType, 'password'> {
    const { password, ...sanitizedUser } = user;
    return sanitizedUser;
  }
}