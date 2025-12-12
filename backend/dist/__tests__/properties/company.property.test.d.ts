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
export {};
//# sourceMappingURL=company.property.test.d.ts.map