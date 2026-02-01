// Auth utility functions with Supabase integration
import { cookies } from 'next/headers';
import { supabase } from './supabase';
import { User } from './database.types';

// Simple token generation (in production, use JWT library like jose)
export function generateToken(userId: string): string {
  const payload = {
    userId,
    exp: Date.now() + 24 * 60 * 60 * 1000 // 24 hours
  };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

// Token verification
export function verifyToken(token: string): { userId: string } | null {
  try {
    const payload = JSON.parse(Buffer.from(token, 'base64').toString());
    if (payload.exp < Date.now()) {
      return null;
    }
    return { userId: payload.userId };
  } catch {
    return null;
  }
}

// Get current user from cookie (queries Supabase)
export async function getCurrentUser(): Promise<Omit<User, 'password'> | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get('auth-token')?.value;

  if (!token) return null;

  const verified = verifyToken(token);
  if (!verified) return null;

  // Query user from Supabase
  const { data: user, error } = await supabase
    .from('users')
    .select('id, email, name, role, avatar, created_at, updated_at')
    .eq('id', verified.userId)
    .single();

  if (error || !user) return null;

  return user;
}

// Validate user login credentials against Supabase
export async function validateUserCredentials(email: string, password: string): Promise<User | null> {
  const { data: user, error } = await supabase
    .from('users')
    .select('*')
    .eq('email', email)
    .eq('password', password) // Note: In production, use proper password hashing
    .single();

  if (error || !user) return null;

  return user;
}
