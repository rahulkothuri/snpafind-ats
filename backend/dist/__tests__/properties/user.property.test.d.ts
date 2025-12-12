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
export {};
//# sourceMappingURL=user.property.test.d.ts.map