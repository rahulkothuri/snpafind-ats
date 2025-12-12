/**
 * **Feature: ats-portal-phase1, Property 5: Role-based access restriction**
 * **Validates: Requirements 3.1, 3.5**
 * 
 * Property 5: For any user with a specific role and any feature, the user should
 * only be able to access features permitted for their role. Attempting to access
 * restricted features should be denied.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import {
  rolePermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  getPermissionsForRole,
  canAccessResource,
  isRoleHigherOrEqual,
  roleHierarchy,
} from '../../middleware/rbac.js';
import type { UserRole } from '../../types/index.js';

// Arbitraries for generating test data
const userRoleArbitrary = fc.constantFrom<UserRole>('admin', 'hiring_manager', 'recruiter');

const allPermissions = [
  'company:read', 'company:create', 'company:update', 'company:delete',
  'user:read', 'user:create', 'user:update', 'user:delete',
  'job:read', 'job:create', 'job:update', 'job:delete',
  'candidate:read', 'candidate:create', 'candidate:update', 'candidate:delete',
  'pipeline:read', 'pipeline:create', 'pipeline:update', 'pipeline:delete',
  'interview:read', 'interview:create', 'interview:update', 'interview:delete',
  'settings:read', 'settings:update',
  'reports:read', 'reports:export',
];

const permissionArbitrary = fc.constantFrom(...allPermissions);

const resourceTypeArbitrary = fc.constantFrom(
  'company', 'user', 'job', 'candidate', 'pipeline', 'interview', 'settings', 'reports'
);

const actionArbitrary = fc.constantFrom('read', 'create', 'update', 'delete', 'export');

describe('Property 5: Role-based access restriction', () => {
  it('should grant admin access to all features', async () => {
    await fc.assert(
      fc.asyncProperty(
        permissionArbitrary,
        async (permission) => {
          // Admin should have access to all permissions
          const hasAccess = hasPermission('admin', permission);
          expect(hasAccess).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should restrict recruiter from admin-only features', async () => {
    // Admin-only permissions that recruiters should NOT have
    const adminOnlyPermissions = [
      'company:create', 'company:update', 'company:delete',
      'user:read', 'user:create', 'user:update', 'user:delete',
      'job:create', 'job:update', 'job:delete',
      'candidate:delete',
      'pipeline:create', 'pipeline:delete',
      'interview:delete',
      'settings:read', 'settings:update',
      'reports:export',
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...adminOnlyPermissions),
        async (permission) => {
          // Recruiter should NOT have access to admin-only permissions
          const hasAccess = hasPermission('recruiter', permission);
          expect(hasAccess).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should grant recruiter access to candidate management features', async () => {
    const recruiterPermissions = [
      'job:read',
      'candidate:read', 'candidate:create', 'candidate:update',
      'pipeline:read', 'pipeline:update',
      'interview:read', 'interview:create', 'interview:update',
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...recruiterPermissions),
        async (permission) => {
          // Recruiter should have access to these permissions
          const hasAccess = hasPermission('recruiter', permission);
          expect(hasAccess).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should grant hiring manager access to job requisitions and candidate review', async () => {
    const hiringManagerPermissions = [
      'job:read', 'job:create', 'job:update',
      'candidate:read', 'candidate:update',
      'pipeline:read', 'pipeline:update',
      'interview:read', 'interview:create', 'interview:update',
      'reports:read',
    ];

    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom(...hiringManagerPermissions),
        async (permission) => {
          // Hiring manager should have access to these permissions
          const hasAccess = hasPermission('hiring_manager', permission);
          expect(hasAccess).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should deny access to non-existent permissions for all roles', async () => {
    const nonExistentPermissions = [
      'fake:permission',
      'unknown:action',
      'invalid:resource',
    ];

    await fc.assert(
      fc.asyncProperty(
        userRoleArbitrary,
        fc.constantFrom(...nonExistentPermissions),
        async (role, permission) => {
          const hasAccess = hasPermission(role, permission);
          expect(hasAccess).toBe(false);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Permission helper functions', () => {
  it('hasAllPermissions should return true only when all permissions are granted', async () => {
    await fc.assert(
      fc.asyncProperty(
        userRoleArbitrary,
        fc.array(permissionArbitrary, { minLength: 1, maxLength: 5 }),
        async (role, permissions) => {
          const result = hasAllPermissions(role, permissions);
          const expected = permissions.every(p => hasPermission(role, p));
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('hasAnyPermission should return true when at least one permission is granted', async () => {
    await fc.assert(
      fc.asyncProperty(
        userRoleArbitrary,
        fc.array(permissionArbitrary, { minLength: 1, maxLength: 5 }),
        async (role, permissions) => {
          const result = hasAnyPermission(role, permissions);
          const expected = permissions.some(p => hasPermission(role, p));
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('getPermissionsForRole should return all permissions for a role', async () => {
    await fc.assert(
      fc.asyncProperty(
        userRoleArbitrary,
        async (role) => {
          const permissions = getPermissionsForRole(role);
          expect(permissions).toEqual(rolePermissions[role]);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('canAccessResource should correctly check resource:action permissions', async () => {
    await fc.assert(
      fc.asyncProperty(
        userRoleArbitrary,
        resourceTypeArbitrary,
        actionArbitrary,
        async (role, resourceType, action) => {
          const result = canAccessResource(role, resourceType, action);
          const permission = `${resourceType}:${action}`;
          const expected = hasPermission(role, permission);
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Role hierarchy', () => {
  it('admin should be higher or equal to all roles', async () => {
    await fc.assert(
      fc.asyncProperty(
        userRoleArbitrary,
        async (targetRole) => {
          const result = isRoleHigherOrEqual('admin', targetRole);
          expect(result).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('recruiter should only be higher or equal to recruiter', async () => {
    expect(isRoleHigherOrEqual('recruiter', 'recruiter')).toBe(true);
    expect(isRoleHigherOrEqual('recruiter', 'hiring_manager')).toBe(false);
    expect(isRoleHigherOrEqual('recruiter', 'admin')).toBe(false);
  });

  it('hiring_manager should be higher or equal to recruiter and hiring_manager', async () => {
    expect(isRoleHigherOrEqual('hiring_manager', 'recruiter')).toBe(true);
    expect(isRoleHigherOrEqual('hiring_manager', 'hiring_manager')).toBe(true);
    expect(isRoleHigherOrEqual('hiring_manager', 'admin')).toBe(false);
  });

  it('role hierarchy values should be consistent', async () => {
    await fc.assert(
      fc.asyncProperty(
        userRoleArbitrary,
        userRoleArbitrary,
        async (role1, role2) => {
          const result = isRoleHigherOrEqual(role1, role2);
          const expected = roleHierarchy[role1] >= roleHierarchy[role2];
          expect(result).toBe(expected);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Permission consistency', () => {
  it('admin permissions should be a superset of all other roles', async () => {
    const adminPermissions = new Set(rolePermissions.admin);
    
    await fc.assert(
      fc.asyncProperty(
        fc.constantFrom<UserRole>('hiring_manager', 'recruiter'),
        async (role) => {
          const rolePerms = rolePermissions[role];
          for (const perm of rolePerms) {
            expect(adminPermissions.has(perm)).toBe(true);
          }
        }
      ),
      { numRuns: 100 }
    );
  });

  it('each role should have at least read access to some resources', async () => {
    await fc.assert(
      fc.asyncProperty(
        userRoleArbitrary,
        async (role) => {
          const permissions = getPermissionsForRole(role);
          const hasReadAccess = permissions.some(p => p.endsWith(':read'));
          expect(hasReadAccess).toBe(true);
        }
      ),
      { numRuns: 100 }
    );
  });
});
