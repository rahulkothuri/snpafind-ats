import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './auth.js';
import type { UserRole } from '../types/index.js';
/**
 * Permission definitions for each role
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export declare const rolePermissions: Record<UserRole, string[]>;
/**
 * Check if a role has a specific permission
 */
export declare function hasPermission(role: UserRole, permission: string): boolean;
/**
 * Check if a role has all of the specified permissions
 */
export declare function hasAllPermissions(role: UserRole, permissions: string[]): boolean;
/**
 * Check if a role has any of the specified permissions
 */
export declare function hasAnyPermission(role: UserRole, permissions: string[]): boolean;
/**
 * Middleware to check if user has required permission
 * Requirements: 3.1, 3.5
 */
export declare function requirePermission(permission: string): (req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user has all required permissions
 */
export declare function requireAllPermissions(...permissions: string[]): (req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
/**
 * Middleware to check if user has any of the required permissions
 */
export declare function requireAnyPermission(...permissions: string[]): (req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
/**
 * Get all permissions for a role
 */
export declare function getPermissionsForRole(role: UserRole): string[];
/**
 * Check if a role can access a specific resource type
 */
export declare function canAccessResource(role: UserRole, resourceType: string, action: string): boolean;
/**
 * Role hierarchy - higher roles include permissions of lower roles
 */
export declare const roleHierarchy: Record<UserRole, number>;
/**
 * Check if one role is higher than another in the hierarchy
 */
export declare function isRoleHigherOrEqual(role: UserRole, targetRole: UserRole): boolean;
/**
 * Middleware to check if user's role is at least the specified level
 */
export declare function requireMinimumRole(minimumRole: UserRole): (req: AuthenticatedRequest, _res: Response, next: NextFunction) => void;
//# sourceMappingURL=rbac.d.ts.map