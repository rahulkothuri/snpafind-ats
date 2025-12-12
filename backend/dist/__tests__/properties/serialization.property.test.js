/**
 * **Feature: ats-portal-phase1, Property 20: JSON serialization round-trip**
 * **Validates: Requirements 14.4, 14.5**
 *
 * Property: For any entity with complex fields (arrays, objects),
 * serializing to JSON for storage and then deserializing should
 * produce an equivalent entity object.
 */
import { describe, it, expect } from 'vitest';
import fc from 'fast-check';
// Serialization functions (simulating database storage)
function serializeCandidate(candidate) {
    return JSON.stringify({
        ...candidate,
        skills: JSON.stringify(candidate.skills),
        metadata: candidate.metadata ? JSON.stringify(candidate.metadata) : null,
    });
}
function deserializeCandidate(json) {
    const parsed = JSON.parse(json);
    return {
        ...parsed,
        skills: JSON.parse(parsed.skills),
        metadata: parsed.metadata ? JSON.parse(parsed.metadata) : undefined,
    };
}
function serializeActivity(activity) {
    return JSON.stringify({
        ...activity,
        metadata: activity.metadata ? JSON.stringify(activity.metadata) : null,
    });
}
function deserializeActivity(json) {
    const parsed = JSON.parse(json);
    return {
        ...parsed,
        metadata: parsed.metadata ? JSON.parse(parsed.metadata) : null,
    };
}
// Arbitraries for generating test data
const skillArbitrary = fc.string({ minLength: 1, maxLength: 50 })
    .filter(s => !s.includes('"') && !s.includes('\\'));
const candidateArbitrary = fc.record({
    id: fc.uuid(),
    name: fc.string({ minLength: 1, maxLength: 100 }),
    email: fc.emailAddress(),
    skills: fc.array(skillArbitrary, { minLength: 0, maxLength: 20 }),
    metadata: fc.option(fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)), fc.oneof(fc.string({ maxLength: 100 }), fc.integer(), fc.boolean())), { nil: undefined }),
});
const activityArbitrary = fc.record({
    id: fc.uuid(),
    activityType: fc.constantFrom('stage_change', 'note_added', 'resume_uploaded', 'interview_scheduled', 'score_updated'),
    description: fc.string({ minLength: 1, maxLength: 500 }),
    metadata: fc.option(fc.dictionary(fc.string({ minLength: 1, maxLength: 20 }).filter(s => /^[a-zA-Z_][a-zA-Z0-9_]*$/.test(s)), fc.oneof(fc.string({ maxLength: 100 }), fc.integer(), fc.boolean())), { nil: null }),
});
describe('Property 20: JSON serialization round-trip', () => {
    it('should preserve candidate data through serialization/deserialization', () => {
        fc.assert(fc.property(candidateArbitrary, (candidate) => {
            const serialized = serializeCandidate(candidate);
            const deserialized = deserializeCandidate(serialized);
            expect(deserialized.id).toBe(candidate.id);
            expect(deserialized.name).toBe(candidate.name);
            expect(deserialized.email).toBe(candidate.email);
            expect(deserialized.skills).toEqual(candidate.skills);
            if (candidate.metadata === undefined) {
                expect(deserialized.metadata).toBeUndefined();
            }
            else {
                expect(deserialized.metadata).toEqual(candidate.metadata);
            }
        }), { numRuns: 100 });
    });
    it('should preserve activity data through serialization/deserialization', () => {
        fc.assert(fc.property(activityArbitrary, (activity) => {
            const serialized = serializeActivity(activity);
            const deserialized = deserializeActivity(serialized);
            expect(deserialized.id).toBe(activity.id);
            expect(deserialized.activityType).toBe(activity.activityType);
            expect(deserialized.description).toBe(activity.description);
            expect(deserialized.metadata).toEqual(activity.metadata);
        }), { numRuns: 100 });
    });
    it('should handle empty skills array', () => {
        fc.assert(fc.property(fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            skills: fc.constant([]),
        }), (candidate) => {
            const serialized = serializeCandidate(candidate);
            const deserialized = deserializeCandidate(serialized);
            expect(deserialized.skills).toEqual([]);
            expect(deserialized.skills.length).toBe(0);
        }), { numRuns: 100 });
    });
    it('should handle skills with special characters', () => {
        fc.assert(fc.property(fc.record({
            id: fc.uuid(),
            name: fc.string({ minLength: 1, maxLength: 100 }),
            email: fc.emailAddress(),
            skills: fc.array(fc.constantFrom('C++', 'C#', 'Node.js', 'React/Redux', 'AWS (Lambda)'), { minLength: 1, maxLength: 10 }),
        }), (candidate) => {
            const serialized = serializeCandidate(candidate);
            const deserialized = deserializeCandidate(serialized);
            expect(deserialized.skills).toEqual(candidate.skills);
        }), { numRuns: 100 });
    });
});
//# sourceMappingURL=serialization.property.test.js.map