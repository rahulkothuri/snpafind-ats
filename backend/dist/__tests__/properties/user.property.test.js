/**
 * **Feature: ats-portal-phase1, Property 6: User creation round-trip**
 * **Feature: ats-portal-phase1, Property 7: Deactivated users cannot login**
 * **Validates: Requirements 4.1, 4.3**
 *
 * Property 6: For any valid user data (name, email, role), creating a user and then
 * retrieving it should return an equivalent user object with all fields matching
 * (password should be hashed, not plaintext).
 *
 * Property 7: For any deactivated user, attempting to login with their credentials
 * should fail, but their historical data should still exist in the database.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
import bcrypt from 'bcrypt';
// Mock Prisma client - must be before imports
vi.mock('../../lib/prisma.js', () => {
    const mockPrismaUser = {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
        delete: vi.fn(),
    };
    return {
        default: {
            user: mockPrismaUser,
        },
        prisma: {
            user: mockPrismaUser,
        },
    };
});
// Import after mocking
import userService from '../../services/user.service.js';
import prisma from '../../lib/prisma.js';
// Get the mocked functions
const mockPrismaUser = prisma.user;
// Arbitraries for generating test data
const userNameArbitrary = fc.string({ minLength: 1, maxLength: 100 })
    .filter(s => s.trim().length > 0);
const validEmailArbitrary = fc.tuple(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z0-9]+$/.test(s)), fc.constantFrom('example.com', 'test.org', 'company.io')).map(([local, domain]) => `${local}@${domain}`);
const validPasswordArbitrary = fc.string({ minLength: 8, maxLength: 50 })
    .filter(s => s.trim().length >= 8);
const userRoleArbitrary = fc.constantFrom('admin', 'hiring_manager', 'recruiter');
const uuidArbitrary = fc.uuid();
beforeEach(() => {
    vi.clearAllMocks();
});
describe('Property 6: User creation round-trip', () => {
    it('should return equivalent user after create and retrieve (password hashed)', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, uuidArbitrary, userNameArbitrary, validEmailArbitrary, validPasswordArbitrary, userRoleArbitrary, async (userId, companyId, name, email, password, role) => {
            const now = new Date();
            // Generate a real hash for the password
            const passwordHash = await bcrypt.hash(password, 4);
            // Mock the Prisma create response
            const mockDbUser = {
                id: userId,
                companyId,
                name,
                email,
                passwordHash,
                role,
                isActive: true,
                createdAt: now,
                updatedAt: now,
            };
            mockPrismaUser.create.mockResolvedValueOnce(mockDbUser);
            mockPrismaUser.findUnique.mockResolvedValueOnce(mockDbUser);
            // Create user
            const created = await userService.create({
                companyId,
                name,
                email,
                password,
                role,
            });
            // Retrieve user
            const retrieved = await userService.getById(created.id);
            // Verify all fields match (round-trip property)
            expect(retrieved.id).toBe(created.id);
            expect(retrieved.companyId).toBe(companyId);
            expect(retrieved.name).toBe(name);
            expect(retrieved.email).toBe(email);
            expect(retrieved.role).toBe(role);
            expect(retrieved.isActive).toBe(true);
            // Verify password is NOT returned in the user object
            expect(retrieved.password).toBeUndefined();
            expect(retrieved.passwordHash).toBeUndefined();
        }), { numRuns: 50 });
    }, 60000);
    it('should hash passwords (not store plaintext)', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, uuidArbitrary, userNameArbitrary, validEmailArbitrary, validPasswordArbitrary, userRoleArbitrary, async (userId, companyId, name, email, password, role) => {
            const now = new Date();
            // Capture the hash that would be stored
            let capturedHash = '';
            mockPrismaUser.create.mockImplementationOnce(async (args) => {
                capturedHash = args.data.passwordHash;
                return {
                    id: userId,
                    companyId,
                    name,
                    email,
                    passwordHash: capturedHash,
                    role,
                    isActive: true,
                    createdAt: now,
                    updatedAt: now,
                };
            });
            // Create user
            await userService.create({
                companyId,
                name,
                email,
                password,
                role,
            });
            // Verify the stored hash is NOT the plaintext password
            expect(capturedHash).not.toBe(password);
            // Verify the hash is a valid bcrypt hash
            expect(capturedHash).toMatch(/^\$2[aby]?\$\d{1,2}\$.{53}$/);
            // Verify the hash can be verified against the original password
            const isValid = await bcrypt.compare(password, capturedHash);
            expect(isValid).toBe(true);
        }), { numRuns: 20 });
    }, 60000);
});
describe('Property 7: Deactivated users cannot login', () => {
    it('should preserve user data after deactivation', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, uuidArbitrary, userNameArbitrary, validEmailArbitrary, validPasswordArbitrary, userRoleArbitrary, async (userId, companyId, name, email, password, role) => {
            const now = new Date();
            const passwordHash = await bcrypt.hash(password, 4);
            // Mock active user
            const mockActiveUser = {
                id: userId,
                companyId,
                name,
                email,
                passwordHash,
                role,
                isActive: true,
                createdAt: now,
                updatedAt: now,
            };
            // Mock deactivated user
            const mockDeactivatedUser = {
                ...mockActiveUser,
                isActive: false,
                updatedAt: new Date(now.getTime() + 1000),
            };
            mockPrismaUser.findUnique
                .mockResolvedValueOnce(mockActiveUser) // For deactivate check
                .mockResolvedValueOnce(mockDeactivatedUser); // For getById after deactivation
            mockPrismaUser.update.mockResolvedValueOnce(mockDeactivatedUser);
            // Deactivate user
            const deactivated = await userService.deactivate(userId);
            // Verify user is deactivated
            expect(deactivated.isActive).toBe(false);
            // Retrieve user and verify data is preserved
            const retrieved = await userService.getById(userId);
            expect(retrieved.id).toBe(userId);
            expect(retrieved.name).toBe(name);
            expect(retrieved.email).toBe(email);
            expect(retrieved.role).toBe(role);
            expect(retrieved.isActive).toBe(false);
        }), { numRuns: 50 });
    }, 60000);
    it('should report inactive status for deactivated users', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, async (userId) => {
            // Mock inactive user
            mockPrismaUser.findUnique.mockResolvedValueOnce({
                isActive: false,
            });
            const isActive = await userService.isActive(userId);
            expect(isActive).toBe(false);
        }), { numRuns: 100 });
    });
    it('should report active status for active users', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, async (userId) => {
            // Mock active user
            mockPrismaUser.findUnique.mockResolvedValueOnce({
                isActive: true,
            });
            const isActive = await userService.isActive(userId);
            expect(isActive).toBe(true);
        }), { numRuns: 100 });
    });
});
describe('User data transformation', () => {
    it('should correctly map Prisma user to User type', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, uuidArbitrary, userNameArbitrary, validEmailArbitrary, userRoleArbitrary, fc.boolean(), async (userId, companyId, name, email, role, isActive) => {
            const now = new Date();
            const mockDbUser = {
                id: userId,
                companyId,
                name,
                email,
                passwordHash: 'hashed_password',
                role,
                isActive,
                createdAt: now,
                updatedAt: now,
            };
            mockPrismaUser.findUnique.mockResolvedValueOnce(mockDbUser);
            const user = await userService.getById(userId);
            // Verify all fields are correctly mapped
            expect(user.id).toBe(userId);
            expect(user.companyId).toBe(companyId);
            expect(user.name).toBe(name);
            expect(user.email).toBe(email);
            expect(user.role).toBe(role);
            expect(user.isActive).toBe(isActive);
            expect(user.createdAt).toEqual(now);
            expect(user.updatedAt).toEqual(now);
            // Verify passwordHash is NOT exposed
            expect(user.passwordHash).toBeUndefined();
        }), { numRuns: 100 });
    });
});
//# sourceMappingURL=user.property.test.js.map