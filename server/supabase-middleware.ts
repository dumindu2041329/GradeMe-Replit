import { createClient } from '@supabase/supabase-js';
import type { Request, Response, NextFunction } from 'express';
import type { User } from '@shared/schema';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY!;

// Service role client for server-side operations
export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

// Public client for client-side operations
export const supabasePublic = createClient(supabaseUrl, supabaseAnonKey);

// Extend Express Request type to include Supabase
declare global {
  namespace Express {
    interface Request {
      supabase?: typeof supabaseAdmin;
      user?: Omit<User, 'password'>;
    }
  }
}

// Middleware to attach Supabase client to request
export function supabaseMiddleware(req: Request, res: Response, next: NextFunction) {
  req.supabase = supabaseAdmin;
  next();
}

// Authentication middleware using Supabase
export async function supabaseAuthMiddleware(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      // Check for session-based auth as fallback
      if (req.session?.user) {
        req.user = req.session.user;
        return next();
      }
      return res.status(401).json({ message: 'No authorization token provided' });
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    // Verify the JWT token with Supabase
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }

    // Fetch user details from your custom users table
    const { data: userData, error: userError } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('email', user.email)
      .single();

    if (userError || !userData) {
      return res.status(401).json({ message: 'User not found in database' });
    }

    // Remove password field before assigning to req.user
    const { password, ...userWithoutPassword } = userData;
    req.user = userWithoutPassword;
    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    return res.status(500).json({ message: 'Authentication error' });
  }
}

// Middleware to require admin role
export function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (req.user.role !== 'admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  
  next();
}

// Middleware to require student role
export function requireStudent(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Not authenticated' });
  }
  
  if (req.user.role !== 'student') {
    return res.status(403).json({ message: 'Student access required' });
  }
  
  next();
}

// Middleware to check if user is authenticated (any role)
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.user) {
    return res.status(401).json({ message: 'Authentication required' });
  }
  
  next();
}

// Row Level Security (RLS) helper functions
export async function enableRLS(tableName: string) {
  try {
    await supabaseAdmin.rpc('enable_rls', { table_name: tableName });
    console.log(`RLS enabled for table: ${tableName}`);
  } catch (error) {
    console.error(`Failed to enable RLS for ${tableName}:`, error);
  }
}

// Create RLS policies
export async function createRLSPolicies() {
  try {
    // Policy for users table - users can only see their own data
    await supabaseAdmin.rpc('create_policy', {
      policy_name: 'Users can view own data',
      table_name: 'users',
      operation: 'SELECT',
      check: 'auth.uid() = id::text'
    });

    // Policy for students table - students can only see their own data
    await supabaseAdmin.rpc('create_policy', {
      policy_name: 'Students can view own data',
      table_name: 'students',
      operation: 'SELECT',
      check: 'auth.uid() = user_id::text'
    });

    // Policy for results table - students can only see their own results
    await supabaseAdmin.rpc('create_policy', {
      policy_name: 'Students can view own results',
      table_name: 'results',
      operation: 'SELECT',
      check: 'EXISTS (SELECT 1 FROM students WHERE students.id = student_id AND students.user_id::text = auth.uid())'
    });

    console.log('RLS policies created successfully');
  } catch (error) {
    console.error('Failed to create RLS policies:', error);
  }
}

// Session management with Supabase
export async function createSupabaseSession(user: User) {
  try {
    const { data, error } = await supabaseAdmin.auth.admin.generateLink({
      type: 'magiclink',
      email: user.email,
      options: {
        data: {
          user_id: user.id,
          role: user.role,
        }
      }
    });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to create Supabase session:', error);
    throw error;
  }
}

// Sign out user from Supabase
export async function signOutUser(userId: string) {
  try {
    const { error } = await supabaseAdmin.auth.admin.signOut(userId);
    
    if (error) {
      throw error;
    }
    
    return { success: true };
  } catch (error) {
    console.error('Failed to sign out user:', error);
    throw error;
  }
}

// Database health check
export async function checkSupabaseHealth() {
  try {
    const { data, error } = await supabaseAdmin
      .from('users')
      .select('count')
      .limit(1);
    
    return !error;
  } catch (error) {
    console.error('Supabase health check failed:', error);
    return false;
  }
}

// Real-time subscription helper
export function createRealtimeSubscription(
  table: string,
  callback: (payload: any) => void,
  filter?: string
) {
  const subscription = supabasePublic
    .channel(`${table}_changes`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: table,
        filter: filter,
      },
      callback
    )
    .subscribe();

  return subscription;
}

// Cleanup function for subscriptions
export function cleanupSubscription(subscription: any) {
  if (subscription) {
    supabasePublic.removeChannel(subscription);
  }
}