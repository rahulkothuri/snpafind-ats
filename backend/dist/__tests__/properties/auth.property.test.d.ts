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
export {};
//# sourceMappingURL=auth.property.test.d.ts.map