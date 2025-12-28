import { Request, Response, NextFunction } from 'express';
import type { JWTPayload, UserRole } from '../types/index.js';
export interface AuthenticatedRequest extends Request {
    user?: JWTPayload;
}
export declare const addToBlacklist: (token: string) => void;
export declare const isBlacklisted: (token: string) => boolean;
export declare const authenticate: (req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
export declare const authorize: (...allowedRoles: UserRole[]) => (req: AuthenticatedRequest, res: Response, next: NextFunction) => void;
export declare const generateToken: (payload: JWTPayload) => string;
export declare const getJwtSecret: () => string;
export declare const verifyToken: (token: string) => JWTPayload;
//# sourceMappingURL=auth.d.ts.map