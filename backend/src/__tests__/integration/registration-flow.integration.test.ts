/**
 * Integration Test: Complete Registration Flow
 * **Validates: Requirements 1.2, 1.5**
 * 
 * Tests the complete registration flow:
 * 1. Register new admin with company
 * 2. Verify company is created
 * 3. Login with new credentials
 */

import { describe, it, expect, afterEach } from 'vitest';
import prisma from '../../lib/prisma.js';
import authService from '../../services/auth.service.js';

// Track created entities for cleanup
const createdUserEmails: string[] = [];

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
  createdUserEmails.length = 0;
});

describe('Integration: Complete Registration Flow', () => {
  /**
   * Test the complete registration and login flow
   * Requirements: 1.2, 1.5
   */
  it('should register new admin, create company, and allow login', async () => {
    const testData = {
      fullName: 'Integration Test Admin',
      email: `integration-test-${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      companyName: 'Integration Test Company',
    };

    // Track for cleanup
    createdUserEmails.push(testData.email);

    // Step 1: Register new admin (Requirements 1.2)
    const registerResult = await authService.register(testData);
    
    expect(registerResult.success).toBe(true);
    expect(registerResult.message).toContain('successful');

    // Step 2: Verify company was created
    const user = await prisma.user.findUnique({
      where: { email: testData.email },
      include: { company: true },
    });

    expect(user).not.toBeNull();
    expect(user!.name).toBe(testData.fullName);
    expect(user!.email).toBe(testData.email);
    expect(user!.role).toBe('admin');
    expect(user!.isActive).toBe(true);
    
    // Verify company details
    expect(user!.company).not.toBeNull();
    expect(user!.company.name).toBe(testData.companyName);
    expect(user!.company.contactEmail).toBe(testData.email);

    // Step 3: Login with new credentials (Requirements 1.5)
    const loginResult = await authService.login({
      email: testData.email,
      password: testData.password,
    });

    expect(loginResult.token).toBeDefined();
    expect(loginResult.token.length).toBeGreaterThan(0);
    expect(loginResult.user).toBeDefined();
    expect(loginResult.user.id).toBe(user!.id);
    expect(loginResult.user.email).toBe(testData.email);
    expect(loginResult.user.role).toBe('admin');
    expect(loginResult.user.companyId).toBe(user!.companyId);
  }, 30000);

  /**
   * Test that registration fails with duplicate email
   * Requirements: 1.4
   */
  it('should reject registration with duplicate email', async () => {
    const testData = {
      fullName: 'First Admin',
      email: `duplicate-test-${Date.now()}@example.com`,
      password: 'SecurePassword123!',
      companyName: 'First Company',
    };

    // Track for cleanup
    createdUserEmails.push(testData.email);

    // First registration should succeed
    const firstResult = await authService.register(testData);
    expect(firstResult.success).toBe(true);

    // Second registration with same email should fail
    await expect(
      authService.register({
        fullName: 'Second Admin',
        email: testData.email,
        password: 'AnotherPassword123!',
        companyName: 'Second Company',
      })
    ).rejects.toThrow();
  }, 30000);

  /**
   * Test that login fails with wrong password
   * Requirements: 1.2
   */
  it('should reject login with wrong password', async () => {
    const testData = {
      fullName: 'Password Test Admin',
      email: `password-test-${Date.now()}@example.com`,
      password: 'CorrectPassword123!',
      companyName: 'Password Test Company',
    };

    // Track for cleanup
    createdUserEmails.push(testData.email);

    // Register user
    await authService.register(testData);

    // Login with wrong password should fail
    await expect(
      authService.login({
        email: testData.email,
        password: 'WrongPassword123!',
      })
    ).rejects.toThrow();
  }, 30000);
});
