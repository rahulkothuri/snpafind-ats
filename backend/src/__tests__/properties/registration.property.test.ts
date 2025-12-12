/**
 * **Feature: ats-enhancements-phase2, Property 1: Registration creates user and company**
 * **Feature: ats-enhancements-phase2, Property 2: Password validation rules**
 * **Feature: ats-enhancements-phase2, Property 3: Duplicate email prevention on registration**
 * **Validates: Requirements 1.2, 1.3, 1.4**
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import fc from 'fast-check';
import prisma from '../../lib/prisma.js';
import authService, { validatePassword } from '../../services/auth.service.js';
import { ConflictError } from '../../middleware/errorHandler.js';

// Arbitraries for generating test data
const validEmailArbitrary = fc.emailAddress();

const validPasswordArbitrary = fc.string({ minLength: 8, maxLength: 50 })
  .filter(s => s.trim().length >= 8 && !s.includes('\x00'));

const shortPasswordArbitrary = fc.string({ minLength: 0, maxLength: 7 })
  .filter(s => !s.includes('\x00'));

const validNameArbitrary = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0 && !s.includes('\x00'));

const validCompanyNameArbitrary = fc.string({ minLength: 1, maxLength: 100 })
  .filter(s => s.trim().length > 0 && !s.includes('\x00'));

// Track created entities for cleanup
let createdUserEmails: string[] = [];

beforeEach(() => {
  createdUserEmails = [];
});

afterEach(async () => {
  // Clean up created users and their companies
  for (const email of createdUserEmails) {
    try {
      const user = await prisma.user.findUnique({ where: { email } });
      if (user) {
        await prisma.user.delete({ where: { email } });
        await prisma.company.delete({ where: { id: user.companyId } });
      }
    } catch {
      // Ignore cleanup errors
    }
  }
});

describe('Property 1: Registration creates user and company', () => {
  /**
   * **Feature: ats-enhancements-phase2, Property 1: Registration creates user and company**
   * **Validates: Requirements 1.2**
   * 
   * For any valid registration data (full name, email, password, company name),
   * submitting the registration should create both a user record with admin role
   * and a company record, both retrievable from the database.
   */
  it('should create both user and company for valid registration data', async () => {
    await fc.assert(
      fc.asyncProperty(
        validNameArbitrary,
        validEmailArbitrary,
        validPasswordArbitrary,
        validCompanyNameArbitrary,
        async (fullName, email, password, companyName) => {
          // Track for cleanup
          createdUserEmails.push(email);

          // Register the user
          const result = await authService.register({
            fullName,
            email,
            password,
            companyName,
          });

          // Registration should succeed
          expect(result.success).toBe(true);

          // User should exist in database
          const user = await prisma.user.findUnique({
            where: { email },
            include: { company: true },
          });

          expect(user).not.toBeNull();
          expect(user!.name).toBe(fullName);
          expect(user!.email).toBe(email);
          expect(user!.role).toBe('admin');
          expect(user!.isActive).toBe(true);

          // Company should exist and be linked to user
          expect(user!.company).not.toBeNull();
          expect(user!.company.name).toBe(companyName);
          expect(user!.company.contactEmail).toBe(email);
        }
      ),
      { numRuns: 5 } // Limited runs due to database operations
    );
  }, 60000);
});

describe('Property 2: Password validation rules', () => {
  /**
   * **Feature: ats-enhancements-phase2, Property 2: Password validation rules**
   * **Validates: Requirements 1.3**
   * 
   * For any password string, if the password is less than 8 characters OR
   * does not match the confirm password field, the registration validation
   * should fail with appropriate error message.
   */
  it('should reject passwords shorter than 8 characters', () => {
    fc.assert(
      fc.property(
        shortPasswordArbitrary,
        (password) => {
          const result = validatePassword(password, password);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('8 characters');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should reject mismatched passwords', () => {
    fc.assert(
      fc.property(
        validPasswordArbitrary,
        validPasswordArbitrary,
        (password, confirmPassword) => {
          // Skip if passwords happen to match
          fc.pre(password !== confirmPassword);

          const result = validatePassword(password, confirmPassword);
          expect(result.valid).toBe(false);
          expect(result.error).toContain('match');
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should accept valid matching passwords of 8+ characters', () => {
    fc.assert(
      fc.property(
        validPasswordArbitrary,
        (password) => {
          const result = validatePassword(password, password);
          expect(result.valid).toBe(true);
          expect(result.error).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 3: Duplicate email prevention on registration', () => {
  /**
   * **Feature: ats-enhancements-phase2, Property 3: Duplicate email prevention on registration**
   * **Validates: Requirements 1.4**
   * 
   * For any email that already exists in the database, attempting to register
   * with that email should fail with an error indicating the email is already registered.
   */
  it('should reject registration with duplicate email', async () => {
    await fc.assert(
      fc.asyncProperty(
        validNameArbitrary,
        validEmailArbitrary,
        validPasswordArbitrary,
        validCompanyNameArbitrary,
        validNameArbitrary,
        validCompanyNameArbitrary,
        async (name1, email, password, company1, name2, company2) => {
          // Track for cleanup
          createdUserEmails.push(email);

          // First registration should succeed
          const result1 = await authService.register({
            fullName: name1,
            email,
            password,
            companyName: company1,
          });
          expect(result1.success).toBe(true);

          // Second registration with same email should fail
          await expect(
            authService.register({
              fullName: name2,
              email,
              password,
              companyName: company2,
            })
          ).rejects.toThrow(ConflictError);

          // Verify only one user exists with this email
          const users = await prisma.user.findMany({
            where: { email },
          });
          expect(users.length).toBe(1);
        }
      ),
      { numRuns: 5 } // Limited runs due to database operations
    );
  }, 60000);
});
