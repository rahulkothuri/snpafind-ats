import { AuthorizationError } from './errorHandler.js';
/**
 * Permission definitions for each role
 * Requirements: 3.1, 3.2, 3.3, 3.4, 3.5
 */
export const rolePermissions = {
    admin: [
        // Full access to all features
        'company:read',
        'company:create',
        'company:update',
        'company:delete',
        'user:read',
        'user:create',
        'user:update',
        'user:delete',
        'job:read',
        'job:create',
        'job:update',
        'job:delete',
        'candidate:read',
        'candidate:create',
        'candidate:update',
        'candidate:delete',
        'pipeline:read',
        'pipeline:create',
        'pipeline:update',
        'pipeline:delete',
        'interview:read',
        'interview:create',
        'interview:update',
        'interview:delete',
        'settings:read',
        'settings:update',
        'reports:read',
        'reports:export',
    ],
    hiring_manager: [
        // Access to job requisitions, candidate review, and interview feedback for assigned roles
        'job:read',
        'job:create',
        'job:update',
        'candidate:read',
        'candidate:update',
        'pipeline:read',
        'pipeline:update',
        'interview:read',
        'interview:create',
        'interview:update',
        'reports:read',
    ],
    recruiter: [
        // Access to candidate management, pipeline operations, and interview scheduling
        'job:read',
        'candidate:read',
        'candidate:create',
        'candidate:update',
        'pipeline:read',
        'pipeline:update',
        'interview:read',
        'interview:create',
        'interview:update',
    ],
};
/**
 * Check if a role has a specific permission
 */
export function hasPermission(role, permission) {
    const permissions = rolePermissions[role];
    return permissions?.includes(permission) ?? false;
}
/**
 * Check if a role has all of the specified permissions
 */
export function hasAllPermissions(role, permissions) {
    return permissions.every(permission => hasPermission(role, permission));
}
/**
 * Check if a role has any of the specified permissions
 */
export function hasAnyPermission(role, permissions) {
    return permissions.some(permission => hasPermission(role, permission));
}
/**
 * Middleware to check if user has required permission
 * Requirements: 3.1, 3.5
 */
export function requirePermission(permission) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new AuthorizationError());
        }
        if (!hasPermission(req.user.role, permission)) {
            return next(new AuthorizationError());
        }
        next();
    };
}
/**
 * Middleware to check if user has all required permissions
 */
export function requireAllPermissions(...permissions) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new AuthorizationError());
        }
        if (!hasAllPermissions(req.user.role, permissions)) {
            return next(new AuthorizationError());
        }
        next();
    };
}
/**
 * Middleware to check if user has any of the required permissions
 */
export function requireAnyPermission(...permissions) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new AuthorizationError());
        }
        if (!hasAnyPermission(req.user.role, permissions)) {
            return next(new AuthorizationError());
        }
        next();
    };
}
/**
 * Get all permissions for a role
 */
export function getPermissionsForRole(role) {
    return rolePermissions[role] ?? [];
}
/**
 * Check if a role can access a specific resource type
 */
export function canAccessResource(role, resourceType, action) {
    const permission = `${resourceType}:${action}`;
    return hasPermission(role, permission);
}
/**
 * Role hierarchy - higher roles include permissions of lower roles
 */
export const roleHierarchy = {
    admin: 3,
    hiring_manager: 2,
    recruiter: 1,
};
/**
 * Check if one role is higher than another in the hierarchy
 */
export function isRoleHigherOrEqual(role, targetRole) {
    return roleHierarchy[role] >= roleHierarchy[targetRole];
}
/**
 * Middleware to check if user's role is at least the specified level
 */
export function requireMinimumRole(minimumRole) {
    return (req, _res, next) => {
        if (!req.user) {
            return next(new AuthorizationError());
        }
        if (!isRoleHigherOrEqual(req.user.role, minimumRole)) {
            return next(new AuthorizationError());
        }
        next();
    };
}
//# sourceMappingURL=rbac.js.map