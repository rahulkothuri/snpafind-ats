import type { AuthResponse, UserRole } from '../types/index.js';
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
export declare function validatePassword(password: string, confirmPassword: string): PasswordValidationResult;
export declare const authService: {
    /**
     * Authenticate user with email and password
     * Returns JWT token and user data on success
     * Throws AuthenticationError on failure (generic message to not reveal which credential was wrong)
     */
    login(credentials: LoginCredentials): Promise<AuthResponse>;
    /**
     * Invalidate a JWT token by adding it to the blacklist
     */
    logout(token: string): void;
    /**
     * Check if a token has been invalidated
     */
    isTokenBlacklisted(token: string): boolean;
    /**
     * Hash a password for storage
     */
    hashPassword(password: string): Promise<string>;
    /**
     * Create a new user with hashed password
     */
    createUser(data: CreateUserData): Promise<{
        name: string;
        id: string;
        createdAt: Date;
        updatedAt: Date;
        companyId: string;
        email: string;
        role: import("@prisma/client").$Enums.UserRole;
        isActive: boolean;
    }>;
    /**
     * Verify password against hash
     */
    verifyPassword(password: string, hash: string): Promise<boolean>;
    /**
     * Register a new admin user with a new company
     * Creates both company and admin user in a single transaction
     * Requirements: 1.2
     */
    register(data: RegisterData): Promise<{
        success: boolean;
        message: string;
    }>;
};
export default authService;
//# sourceMappingURL=auth.service.d.ts.map