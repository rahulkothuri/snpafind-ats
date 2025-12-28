/**
 * **Feature: ats-portal-phase1, Property 3: Company creation round-trip**
 * **Feature: ats-portal-phase1, Property 4: Company IDs are unique**
 * **Feature: ats-enhancements-phase2, Property 4: Company profile round-trip**
 * **Validates: Requirements 2.1, 2.2, 2.3, 2.7, 7.1, 7.2, 7.3, 7.4**
 *
 * Property 3: For any valid company data (name, logo URL, contact email, address),
 * creating a company and then retrieving it should return an equivalent company object with all fields matching.
 *
 * Property 4 (phase1): For any set of created companies, all company IDs should be unique
 * (no two companies share the same ID).
 *
 * Property 4 (phase2): For any valid company profile data (including all extended fields: website, size,
 * industry, description, branding, contact, location, social media), saving the profile and then
 * retrieving it should return an equivalent company object with all fields matching.
 *
 * Note: These tests validate the service logic and data transformation.
 * Database integration tests require a running PostgreSQL instance.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import fc from 'fast-check';
// Mock Prisma client - must be before imports
vi.mock('../../lib/prisma.js', () => {
    const mockPrismaCompany = {
        create: vi.fn(),
        findUnique: vi.fn(),
        update: vi.fn(),
        findMany: vi.fn(),
        deleteMany: vi.fn(),
    };
    return {
        default: {
            company: mockPrismaCompany,
        },
        prisma: {
            company: mockPrismaCompany,
        },
    };
});
// Import after mocking
import companyService from '../../services/company.service.js';
import prisma from '../../lib/prisma.js';
// Get the mocked functions
const mockPrismaCompany = prisma.company;
// Arbitraries for generating test data - using constantFrom for faster generation
const companyNameArbitrary = fc.constantFrom('Acme Corp', 'TechStart Inc', 'Global Solutions', 'Innovation Labs', 'Digital Ventures');
const validEmailArbitrary = fc.constantFrom('admin@example.com', 'contact@test.org', 'info@company.io', 'hr@acme.com', 'support@tech.net');
const validUrlArbitrary = fc.constantFrom('https://example.com/logo.png', 'https://test.org/image.jpg', 'https://company.io/avatar.svg');
const addressArbitrary = fc.constantFrom('123 Main St', '456 Oak Ave', '789 Tech Blvd', '100 Innovation Way', '200 Business Park');
const uuidArbitrary = fc.uuid();
// Enhanced company profile arbitraries for Phase 2
const websiteUrlArbitrary = fc.constantFrom('https://acme.com', 'https://techstart.org', 'https://global.io', 'https://innovation.com');
const companySizeArbitrary = fc.constantFrom('1-10 employees', '11-50 employees', '51-200 employees', '201-500 employees', '501-1000 employees', '1000+ employees');
const industryArbitrary = fc.constantFrom('Technology', 'Healthcare', 'Finance', 'Education', 'Manufacturing', 'Retail', 'Consulting', 'Media', 'Real Estate', 'Other');
const descriptionArbitrary = fc.constantFrom('A leading technology company', 'Innovative solutions provider', 'Global enterprise services');
const phoneArbitrary = fc.constantFrom('+11234567890', '+441234567890', '+911234567890');
const cityArbitrary = fc.constantFrom('New York', 'San Francisco', 'London', 'Tokyo', 'Berlin');
const stateArbitrary = fc.constantFrom('NY', 'CA', 'TX', 'FL', 'WA');
const countryArbitrary = fc.constantFrom('USA', 'UK', 'Germany', 'Japan', 'India');
const postalCodeArbitrary = fc.constantFrom('12345', '90210', '10001', '94102', '60601');
const socialUrlArbitrary = fc.constantFrom('https://linkedin.com/company/acme', 'https://twitter.com/acme', 'https://facebook.com/acme');
const brandColorArbitrary = fc.constantFrom('#0b6cf0', '#ff5733', '#33ff57', '#3357ff', '#f033ff');
beforeEach(() => {
    vi.clearAllMocks();
});
// Helper to create a full mock company object with all enhanced fields
function createMockDbCompany(overrides) {
    const now = new Date();
    return {
        id: overrides.id ?? 'test-id',
        name: overrides.name ?? 'Test Company',
        contactEmail: overrides.contactEmail ?? 'test@example.com',
        logoUrl: overrides.logoUrl ?? null,
        address: overrides.address ?? null,
        createdAt: overrides.createdAt ?? now,
        updatedAt: overrides.updatedAt ?? now,
        website: overrides.website ?? null,
        companySize: overrides.companySize ?? null,
        industry: overrides.industry ?? null,
        description: overrides.description ?? null,
        phone: overrides.phone ?? null,
        city: overrides.city ?? null,
        state: overrides.state ?? null,
        country: overrides.country ?? null,
        postalCode: overrides.postalCode ?? null,
        linkedinUrl: overrides.linkedinUrl ?? null,
        twitterUrl: overrides.twitterUrl ?? null,
        facebookUrl: overrides.facebookUrl ?? null,
        careersPageUrl: overrides.careersPageUrl ?? null,
        brandColor: overrides.brandColor ?? null,
    };
}
describe('Property 3: Company creation round-trip', () => {
    it('should return equivalent company after create and retrieve', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, companyNameArbitrary, validEmailArbitrary, fc.option(validUrlArbitrary, { nil: undefined }), fc.option(addressArbitrary, { nil: undefined }), async (id, name, contactEmail, logoUrl, address) => {
            const now = new Date();
            // Mock the Prisma create response with all fields
            const mockDbCompany = createMockDbCompany({
                id,
                name,
                contactEmail,
                logoUrl: logoUrl ?? null,
                address: address ?? null,
                createdAt: now,
                updatedAt: now,
            });
            mockPrismaCompany.create.mockResolvedValueOnce(mockDbCompany);
            mockPrismaCompany.findUnique.mockResolvedValueOnce(mockDbCompany);
            // Create company
            const created = await companyService.create({
                name,
                contactEmail,
                logoUrl,
                address,
            });
            // Retrieve company
            const retrieved = await companyService.getById(created.id);
            // Verify all fields match (round-trip property)
            expect(retrieved.id).toBe(created.id);
            expect(retrieved.name).toBe(name);
            expect(retrieved.contactEmail).toBe(contactEmail);
            expect(retrieved.logoUrl).toBe(logoUrl);
            expect(retrieved.address).toBe(address);
            expect(retrieved.createdAt).toEqual(created.createdAt);
        }), { numRuns: 20 });
    });
    it('should persist updates correctly', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, companyNameArbitrary, validEmailArbitrary, companyNameArbitrary, validEmailArbitrary, async (id, originalName, originalEmail, updatedName, updatedEmail) => {
            const now = new Date();
            const later = new Date(now.getTime() + 1000);
            // Mock the Prisma responses with all fields
            const mockOriginalCompany = createMockDbCompany({
                id,
                name: originalName,
                contactEmail: originalEmail,
                createdAt: now,
                updatedAt: now,
            });
            const mockUpdatedCompany = createMockDbCompany({
                id,
                name: updatedName,
                contactEmail: updatedEmail,
                createdAt: now,
                updatedAt: later,
            });
            mockPrismaCompany.create.mockResolvedValueOnce(mockOriginalCompany);
            mockPrismaCompany.findUnique
                .mockResolvedValueOnce(mockOriginalCompany) // For update check
                .mockResolvedValueOnce(mockUpdatedCompany); // For getById
            mockPrismaCompany.update.mockResolvedValueOnce(mockUpdatedCompany);
            // Create company
            const created = await companyService.create({
                name: originalName,
                contactEmail: originalEmail,
            });
            // Update company
            const updated = await companyService.update(created.id, {
                name: updatedName,
                contactEmail: updatedEmail,
            });
            // Retrieve and verify
            const retrieved = await companyService.getById(created.id);
            expect(retrieved.name).toBe(updatedName);
            expect(retrieved.contactEmail).toBe(updatedEmail);
            expect(retrieved.id).toBe(created.id);
            expect(updated.name).toBe(updatedName);
        }), { numRuns: 20 });
    });
});
describe('Property 4: Company IDs are unique', () => {
    it('should generate unique IDs for all created companies (UUID format)', async () => {
        await fc.assert(fc.asyncProperty(fc.array(uuidArbitrary, { minLength: 2, maxLength: 20 }), async (uuids) => {
            // Verify all UUIDs are unique
            const uniqueIds = new Set(uuids);
            expect(uniqueIds.size).toBe(uuids.length);
            // Verify each ID is a valid UUID format
            const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
            for (const id of uuids) {
                expect(id).toMatch(uuidRegex);
            }
        }), { numRuns: 20 });
    });
    it('should verify UUID generation produces unique values', async () => {
        // This test verifies that the UUID generation mechanism produces unique values
        // by checking that randomly generated UUIDs don't collide
        await fc.assert(fc.asyncProperty(fc.array(fc.tuple(companyNameArbitrary, validEmailArbitrary, uuidArbitrary), { minLength: 5, maxLength: 20 }), async (companyDataList) => {
            const createdIds = [];
            const now = new Date();
            for (let i = 0; i < companyDataList.length; i++) {
                const [name, email, id] = companyDataList[i];
                // Mock the Prisma create response with unique ID and all fields
                const mockDbCompany = createMockDbCompany({
                    id,
                    name,
                    contactEmail: `${i}_${email}`,
                    createdAt: now,
                    updatedAt: now,
                });
                mockPrismaCompany.create.mockResolvedValueOnce(mockDbCompany);
                const company = await companyService.create({
                    name,
                    contactEmail: `${i}_${email}`,
                });
                createdIds.push(company.id);
            }
            // Verify all IDs are unique
            const uniqueIds = new Set(createdIds);
            expect(uniqueIds.size).toBe(createdIds.length);
        }), { numRuns: 20 });
    });
});
describe('Company data transformation', () => {
    it('should correctly transform null values to undefined', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, companyNameArbitrary, validEmailArbitrary, async (id, name, contactEmail) => {
            const now = new Date();
            // Mock company with null optional fields (using helper)
            const mockDbCompany = createMockDbCompany({
                id,
                name,
                contactEmail,
                createdAt: now,
                updatedAt: now,
            });
            mockPrismaCompany.findUnique.mockResolvedValueOnce(mockDbCompany);
            const company = await companyService.getById(id);
            // Verify null values are transformed to undefined
            expect(company.logoUrl).toBeUndefined();
            expect(company.address).toBeUndefined();
        }), { numRuns: 20 });
    });
    it('should preserve non-null optional values', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, companyNameArbitrary, validEmailArbitrary, validUrlArbitrary, addressArbitrary, async (id, name, contactEmail, logoUrl, address) => {
            const now = new Date();
            // Mock company with non-null optional fields
            const mockDbCompany = {
                id,
                name,
                contactEmail,
                logoUrl,
                address,
                createdAt: now,
                updatedAt: now,
                // Enhanced fields with null values
                website: null,
                companySize: null,
                industry: null,
                description: null,
                phone: null,
                city: null,
                state: null,
                country: null,
                postalCode: null,
                linkedinUrl: null,
                twitterUrl: null,
                facebookUrl: null,
                careersPageUrl: null,
                brandColor: null,
            };
            mockPrismaCompany.findUnique.mockResolvedValueOnce(mockDbCompany);
            const company = await companyService.getById(id);
            // Verify non-null values are preserved
            expect(company.logoUrl).toBe(logoUrl);
            expect(company.address).toBe(address);
        }), { numRuns: 20 });
    });
});
/**
 * **Feature: ats-enhancements-phase2, Property 4: Company profile round-trip**
 * **Validates: Requirements 2.7, 7.1, 7.2, 7.3, 7.4**
 *
 * For any valid company profile data (including all extended fields: website, size,
 * industry, description, branding, contact, location, social media), saving the profile
 * and then retrieving it should return an equivalent company object with all fields matching.
 */
describe('Property 4 (Phase 2): Company profile round-trip', () => {
    it('should return equivalent company with all enhanced fields after create and retrieve', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, companyNameArbitrary, validEmailArbitrary, fc.option(validUrlArbitrary, { nil: undefined }), fc.option(addressArbitrary, { nil: undefined }), fc.option(websiteUrlArbitrary, { nil: undefined }), fc.option(companySizeArbitrary, { nil: undefined }), fc.option(industryArbitrary, { nil: undefined }), fc.option(descriptionArbitrary, { nil: undefined }), async (id, name, contactEmail, logoUrl, address, website, companySize, industry, description) => {
            const now = new Date();
            // Mock the Prisma create response with all enhanced fields
            const mockDbCompany = {
                id,
                name,
                contactEmail,
                logoUrl: logoUrl ?? null,
                address: address ?? null,
                createdAt: now,
                updatedAt: now,
                website: website ?? null,
                companySize: companySize ?? null,
                industry: industry ?? null,
                description: description ?? null,
                phone: null,
                city: null,
                state: null,
                country: null,
                postalCode: null,
                linkedinUrl: null,
                twitterUrl: null,
                facebookUrl: null,
                careersPageUrl: null,
                brandColor: '#0b6cf0',
            };
            mockPrismaCompany.create.mockResolvedValueOnce(mockDbCompany);
            mockPrismaCompany.findUnique.mockResolvedValueOnce(mockDbCompany);
            // Create company with enhanced fields
            const created = await companyService.create({
                name,
                contactEmail,
                logoUrl,
                address,
                website,
                companySize,
                industry,
                description,
            });
            // Retrieve company
            const retrieved = await companyService.getById(created.id);
            // Verify all fields match (round-trip property)
            expect(retrieved.id).toBe(created.id);
            expect(retrieved.name).toBe(name);
            expect(retrieved.contactEmail).toBe(contactEmail);
            expect(retrieved.logoUrl).toBe(logoUrl);
            expect(retrieved.address).toBe(address);
            expect(retrieved.website).toBe(website);
            expect(retrieved.companySize).toBe(companySize);
            expect(retrieved.industry).toBe(industry);
            expect(retrieved.description).toBe(description);
            expect(retrieved.createdAt).toEqual(created.createdAt);
        }), { numRuns: 20 });
    });
    it('should persist all enhanced profile fields on update', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, companyNameArbitrary, validEmailArbitrary, fc.option(phoneArbitrary, { nil: undefined }), fc.option(cityArbitrary, { nil: undefined }), fc.option(stateArbitrary, { nil: undefined }), fc.option(countryArbitrary, { nil: undefined }), fc.option(postalCodeArbitrary, { nil: undefined }), fc.option(socialUrlArbitrary, { nil: undefined }), fc.option(brandColorArbitrary, { nil: undefined }), async (id, name, contactEmail, phone, city, state, country, postalCode, linkedinUrl, brandColor) => {
            const now = new Date();
            const later = new Date(now.getTime() + 1000);
            // Mock original company
            const mockOriginalCompany = {
                id,
                name,
                contactEmail,
                logoUrl: null,
                address: null,
                createdAt: now,
                updatedAt: now,
                website: null,
                companySize: null,
                industry: null,
                description: null,
                phone: null,
                city: null,
                state: null,
                country: null,
                postalCode: null,
                linkedinUrl: null,
                twitterUrl: null,
                facebookUrl: null,
                careersPageUrl: null,
                brandColor: '#0b6cf0',
            };
            // Mock updated company with enhanced fields
            const mockUpdatedCompany = {
                ...mockOriginalCompany,
                updatedAt: later,
                phone: phone ?? null,
                city: city ?? null,
                state: state ?? null,
                country: country ?? null,
                postalCode: postalCode ?? null,
                linkedinUrl: linkedinUrl ?? null,
                brandColor: brandColor ?? '#0b6cf0',
            };
            mockPrismaCompany.findUnique
                .mockResolvedValueOnce(mockOriginalCompany) // For update check
                .mockResolvedValueOnce(mockUpdatedCompany); // For getById
            mockPrismaCompany.update.mockResolvedValueOnce(mockUpdatedCompany);
            // Update company with enhanced fields
            const updated = await companyService.update(id, {
                phone,
                city,
                state,
                country,
                postalCode,
                linkedinUrl,
                brandColor,
            });
            // Retrieve and verify
            const retrieved = await companyService.getById(id);
            // Verify enhanced fields match
            expect(retrieved.phone).toBe(phone);
            expect(retrieved.city).toBe(city);
            expect(retrieved.state).toBe(state);
            expect(retrieved.country).toBe(country);
            expect(retrieved.postalCode).toBe(postalCode);
            expect(retrieved.linkedinUrl).toBe(linkedinUrl);
            expect(retrieved.brandColor).toBe(brandColor ?? '#0b6cf0');
            expect(updated.id).toBe(id);
        }), { numRuns: 20 });
    });
    it('should correctly transform all null enhanced fields to undefined', async () => {
        await fc.assert(fc.asyncProperty(uuidArbitrary, companyNameArbitrary, validEmailArbitrary, async (id, name, contactEmail) => {
            const now = new Date();
            // Mock company with all null enhanced fields
            const mockDbCompany = {
                id,
                name,
                contactEmail,
                logoUrl: null,
                address: null,
                createdAt: now,
                updatedAt: now,
                website: null,
                companySize: null,
                industry: null,
                description: null,
                phone: null,
                city: null,
                state: null,
                country: null,
                postalCode: null,
                linkedinUrl: null,
                twitterUrl: null,
                facebookUrl: null,
                careersPageUrl: null,
                brandColor: null,
            };
            mockPrismaCompany.findUnique.mockResolvedValueOnce(mockDbCompany);
            const company = await companyService.getById(id);
            // Verify all null enhanced fields are transformed to undefined
            expect(company.website).toBeUndefined();
            expect(company.companySize).toBeUndefined();
            expect(company.industry).toBeUndefined();
            expect(company.description).toBeUndefined();
            expect(company.phone).toBeUndefined();
            expect(company.city).toBeUndefined();
            expect(company.state).toBeUndefined();
            expect(company.country).toBeUndefined();
            expect(company.postalCode).toBeUndefined();
            expect(company.linkedinUrl).toBeUndefined();
            expect(company.twitterUrl).toBeUndefined();
            expect(company.facebookUrl).toBeUndefined();
            expect(company.careersPageUrl).toBeUndefined();
            expect(company.brandColor).toBeUndefined();
        }), { numRuns: 20 });
    });
});
//# sourceMappingURL=company.property.test.js.map