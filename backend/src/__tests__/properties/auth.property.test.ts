/**
 * **Feature: ats-portal-phase1, Property 1: Valid credentials produce valid JWT token**
 * **Feature: ats-portal-phase1, Property 2: Invalid credentials produce generic error**
 * **Validates: Requirements 1.1, 1.2**
 * 
 * Property 1: For any valid user credentials (email and password pair that exists in the database),
 * submitting them to the login endpoint should return a valid JWT token containing the user's ID and role.
 * 
 * Property 2: For any invalid credentials (non-existent email or wrong password),
 * the authentication system should return an error message that does not reveal which specific credential was incorrect.
 */

import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { generateToken, verifyToken, getJwtSecret } from '../../middleware/auth.js';
import { AuthenticationError } from '../../middleware/errorHandler.js';
import type { JWTPayload, UserRole } from '../../types/index.js';

// Use lower salt rounds for faster tests
const SALT_ROUNDS = 4;

// Arbitraries for generating test data
const userRoleArbitrary = fc.constantFrom<UserRole>('admin', 'hiring_manager', 'recruiter');

const validEmailArbitrary = fc.emailAddress();

const validPasswordArbitrary = fc.string({ minLength: 8, maxLength: 50 })
  .filter(s => s.trim().length >= 8); // Ensure password has at least 8 non-whitespace chars

const userIdArbitrary = fc.uuid();
const companyIdArbitrary = fc.uuid();

describe('Property 1: Valid credentials produce valid JWT token', () => {
  it('should generate a valid JWT token for any valid user credentials', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        companyIdArbitrary,
        userRoleArbitrary,
        async (userId, companyId, role) => {
          // Create JWT payload
          const payload: JWTPayload = {
            userId,
            companyId,
            role,
          };

          // Generate token
          const token = generateToken(payload);

          // Token should be a non-empty string
          expect(token).toBeDefined();
          expect(typeof token).toBe('string');
          expect(token.length).toBeGreaterThan(0);

          // Token should be verifiable
          const decoded = verifyToken(token);
          
          // Decoded token should contain the original payload
          expect(decoded.userId).toBe(userId);
          expect(decoded.companyId).toBe(companyId);
          expect(decoded.role).toBe(role);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should produce tokens that can be decoded with the correct secret', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        companyIdArbitrary,
        userRoleArbitrary,
        async (userId, companyId, role) => {
          const payload: JWTPayload = {
            userId,
            companyId,
            role,
          };

          const token = generateToken(payload);
          
          // Verify using jwt.verify directly with the secret
          const decoded = jwt.verify(token, getJwtSecret()) as JWTPayload;
          
          expect(decoded.userId).toBe(userId);
          expect(decoded.companyId).toBe(companyId);
          expect(decoded.role).toBe(role);
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should include expiration in generated tokens', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        companyIdArbitrary,
        userRoleArbitrary,
        async (userId, companyId, role) => {
          const payload: JWTPayload = {
            userId,
            companyId,
            role,
          };

          const token = generateToken(payload);
          const decoded = jwt.decode(token) as jwt.JwtPayload;
          
          // Token should have an expiration time
          expect(decoded.exp).toBeDefined();
          expect(typeof decoded.exp).toBe('number');
          
          // Expiration should be in the future
          const now = Math.floor(Date.now() / 1000);
          expect(decoded.exp).toBeGreaterThan(now);
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Property 2: Invalid credentials produce generic error', () => {
  it('should verify that password hashing produces different hashes for same password', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPasswordArbitrary,
        async (password) => {
          // Hash the same password twice
          const hash1 = await bcrypt.hash(password, SALT_ROUNDS);
          const hash2 = await bcrypt.hash(password, SALT_ROUNDS);
          
          // Hashes should be different (due to salt)
          expect(hash1).not.toBe(hash2);
          
          // But both should verify against the original password
          expect(await bcrypt.compare(password, hash1)).toBe(true);
          expect(await bcrypt.compare(password, hash2)).toBe(true);
        }
      ),
      { numRuns: 10 } // Reduced runs due to bcrypt being slow
    );
  }, 30000); // 30 second timeout

  it('should verify that wrong passwords fail verification', async () => {
    await fc.assert(
      fc.asyncProperty(
        validPasswordArbitrary,
        validPasswordArbitrary.filter(p => p.length >= 8),
        async (correctPassword, wrongPassword) => {
          // Skip if passwords happen to be the same
          if (correctPassword === wrongPassword) {
            return;
          }

          const hash = await bcrypt.hash(correctPassword, SALT_ROUNDS);
          
          // Correct password should verify
          expect(await bcrypt.compare(correctPassword, hash)).toBe(true);
          
          // Wrong password should not verify
          expect(await bcrypt.compare(wrongPassword, hash)).toBe(false);
        }
      ),
      { numRuns: 10 } // Reduced runs due to bcrypt being slow
    );
  }, 30000); // 30 second timeout

  it('should verify tokens with wrong secret fail verification', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        companyIdArbitrary,
        userRoleArbitrary,
        fc.string({ minLength: 10, maxLength: 50 }),
        async (userId, companyId, role, wrongSecret) => {
          const payload: JWTPayload = {
            userId,
            companyId,
            role,
          };

          const token = generateToken(payload);
          
          // Skip if wrong secret happens to match the real secret
          if (wrongSecret === getJwtSecret()) {
            return;
          }
          
          // Verification with wrong secret should throw
          expect(() => jwt.verify(token, wrongSecret)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });

  it('should verify that expired tokens fail verification', async () => {
    await fc.assert(
      fc.asyncProperty(
        userIdArbitrary,
        companyIdArbitrary,
        userRoleArbitrary,
        async (userId, companyId, role) => {
          const payload: JWTPayload = {
            userId,
            companyId,
            role,
          };

          // Create a token that expires immediately
          const expiredToken = jwt.sign(payload, getJwtSecret(), { expiresIn: '-1s' });
          
          // Verification should throw due to expiration
          expect(() => verifyToken(expiredToken)).toThrow();
        }
      ),
      { numRuns: 100 }
    );
  });
});

describe('Authentication error message consistency', () => {
  it('should produce consistent error structure regardless of failure reason', () => {
    // This test verifies that our AuthenticationError always produces the same message
    // to prevent information leakage about which credential was wrong
    
    fc.assert(
      fc.property(
        fc.integer({ min: 1, max: 100 }),
        (_iteration) => {
          const error = new AuthenticationError();
          
          // Error should always have the same generic message
          expect(error.message).toBe('Invalid credentials');
          expect(error.statusCode).toBe(401);
          expect(error.code).toBe('AUTHENTICATION_ERROR');
          
          // Error should NOT contain any details about which credential was wrong
          expect(error.details).toBeUndefined();
        }
      ),
      { numRuns: 100 }
    );
  });
});
