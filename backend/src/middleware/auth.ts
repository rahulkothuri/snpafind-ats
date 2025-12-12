import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { AuthorizationError } from './errorHandler.js';
import type { JWTPayload, UserRole } from '../types/index.js';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

// In-memory token blacklist (shared with auth service)
const tokenBlacklist = new Set<string>();

export const addToBlacklist = (token: string): void => {
  tokenBlacklist.add(token);
};

export const isBlacklisted = (token: string): boolean => {
  return tokenBlacklist.has(token);
};

export const authenticate = (
  req: AuthenticatedRequest,
  _res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      throw new AuthorizationError();
    }

    const token = authHeader.substring(7);
    
    // Check if token is blacklisted (logged out)
    if (isBlacklisted(token)) {
      throw new AuthorizationError();
    }

    const decoded = jwt.verify(token, JWT_SECRET) as JWTPayload;
    req.user = decoded;
    next();
  } catch {
    next(new AuthorizationError());
  }
};

export const authorize = (...allowedRoles: UserRole[]) => {
  return (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AuthorizationError());
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new AuthorizationError());
    }

    next();
  };
};

export const generateToken = (payload: JWTPayload): string => {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};

export const getJwtSecret = (): string => JWT_SECRET;

export const verifyToken = (token: string): JWTPayload => {
  return jwt.verify(token, JWT_SECRET) as JWTPayload;
};
