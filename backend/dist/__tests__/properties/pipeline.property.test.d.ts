/**
 * **Feature: ats-portal-phase1, Property 11: Default stages are initialized**
 * **Feature: ats-portal-phase1, Property 12: Custom sub-stage insertion preserves order**
 * **Feature: ats-portal-phase1, Property 13: Stage reordering maintains candidate associations**
 * **Validates: Requirements 6.1, 6.2, 6.4**
 *
 * Property 11: For any newly created job, the pipeline should contain the default stages
 * (Queue, Applied, Screening, Shortlisted, Interview, Selected, Offer, Hired) in the correct order.
 *
 * Property 12: For any pipeline and custom sub-stage inserted at position N, the sub-stage
 * should appear at position N and all subsequent stages should have their positions incremented.
 *
 * Property 13: For any pipeline with candidates, reordering stages should update stage positions
 * while maintaining all candidate-stage associations correctly.
 */
export {};
//# sourceMappingURL=pipeline.property.test.d.ts.map