import jwt from 'jsonwebtoken';
import { AuthorizationError } from './errorHandler.js';
const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
// In-memory token blacklist (shared with auth service)
const tokenBlacklist = new Set();
export const addToBlacklist = (token) => {
    tokenBlacklist.add(token);
};
export const isBlacklisted = (token) => {
    return tokenBlacklist.has(token);
};
export const authenticate = (req, _res, next) => {
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
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch {
        next(new AuthorizationError());
    }
};
export const authorize = (...allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return next(new AuthorizationError());
        }
        if (!allowedRoles.includes(req.user.role)) {
            return next(new AuthorizationError());
        }
        next();
    };
};
export const generateToken = (payload) => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn: '24h' });
};
export const getJwtSecret = () => JWT_SECRET;
export const verifyToken = (token) => {
    return jwt.verify(token, JWT_SECRET);
};
//# sourceMappingURL=auth.js.map