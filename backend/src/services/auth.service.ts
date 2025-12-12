import bcrypt from 'bcrypt';
import prisma from '../lib/prisma.js';
import { generateToken, addToBlacklist, isBlacklisted } from '../middleware/auth.js';
import { AuthenticationError, ConflictError } from '../middleware/errorHandler.js';
import type { AuthResponse, JWTPayload, UserRole } from '../types/index.js';

const SALT_ROUNDS = 10;

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface CreateUserData {
  companyId: string;
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

export interface RegisterData {
  fullName: string;
  email: string;
  password: string;
  companyName: string;
}

export interface PasswordValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate password against registration rules
 * Requirements: 1.3
 */
export function validatePassword(password: string, confirmPassword: string): PasswordValidationResult {
  if (password.length < 8) {
    return { valid: false, error: 'Password must be at least 8 characters' };
  }
  if (password !== confirmPassword) {
    return { valid: false, error: 'Passwords do not match' };
  }
  return { valid: true };
}

export const authService = {
  /**
   * Authenticate user with email and password
   * Returns JWT token and user data on success
   * Throws AuthenticationError on failure (generic message to not reveal which credential was wrong)
   */
  async login(credentials: LoginCredentials): Promise<AuthResponse> {
    const { email, password } = credentials;

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email },
    });

    // Check if user exists and is active
    if (!user || !user.isActive) {
      throw new AuthenticationError();
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new AuthenticationError();
    }

    // Generate JWT token
    const payload: JWTPayload = {
      userId: user.id,
      companyId: user.companyId,
      role: user.role as UserRole,
    };
    const token = generateToken(payload);

    // Return token and user data (without password hash)
    return {
      token,
      user: {
        id: user.id,
        companyId: user.companyId,
        name: user.name,
        email: user.email,
        role: user.role as UserRole,
        isActive: user.isActive,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
    };
  },

  /**
   * Invalidate a JWT token by adding it to the blacklist
   */
  logout(token: string): void {
    addToBlacklist(token);
  },

  /**
   * Check if a token has been invalidated
   */
  isTokenBlacklisted(token: string): boolean {
    return isBlacklisted(token);
  },

  /**
   * Hash a password for storage
   */
  async hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, SALT_ROUNDS);
  },

  /**
   * Create a new user with hashed password
   */
  async createUser(data: CreateUserData) {
    const passwordHash = await this.hashPassword(data.password);
    
    return prisma.user.create({
      data: {
        companyId: data.companyId,
        name: data.name,
        email: data.email,
        passwordHash,
        role: data.role,
      },
      select: {
        id: true,
        companyId: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  /**
   * Verify password against hash
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  },

  /**
   * Register a new admin user with a new company
   * Creates both company and admin user in a single transaction
   * Requirements: 1.2
   */
  async register(data: RegisterData): Promise<{ success: boolean; message: string }> {
    const { fullName, email, password, companyName } = data;

    // Check if email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictError('An account with this email already exists', { field: 'email' });
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create company and admin user in a single transaction
    await prisma.$transaction(async (tx) => {
      // Create company
      const company = await tx.company.create({
        data: {
          name: companyName,
          contactEmail: email,
        },
      });

      // Create admin user
      await tx.user.create({
        data: {
          companyId: company.id,
          name: fullName,
          email,
          passwordHash,
          role: 'admin',
        },
      });
    });

    return {
      success: true,
      message: 'Registration successful. Please login with your credentials.',
    };
  },
};

export default authService;
