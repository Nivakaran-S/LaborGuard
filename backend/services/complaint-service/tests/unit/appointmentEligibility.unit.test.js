/**
 * appointmentEligibility.unit.test.js
 *
 * Pure-function tests for the auto-booking gate. The integration test
 * verifies the wire-up; this test pins down the eligibility matrix so a
 * future product-spec drift is loud instead of silent.
 *
 * Eligibility matrix (per the workflow audit):
 *   eligible categories: wage_theft, wrongful_termination, harassment, discrimination
 *   eligible priorities: high, critical
 *   any other combination → ineligible
 */

const { isEligibleForAppointment } = require('../../src/services/appointmentService');

describe('isEligibleForAppointment', () => {
    const eligibleCategories = ['wage_theft', 'wrongful_termination', 'harassment', 'discrimination'];
    const eligiblePriorities = ['high', 'critical'];
    const ineligibleCategories = ['unsafe_conditions', 'unpaid_overtime', 'other'];
    const ineligiblePriorities = ['low', 'medium'];

    describe('returns true for the full eligibility matrix', () => {
        for (const cat of eligibleCategories) {
            for (const pri of eligiblePriorities) {
                it(`category=${cat}, priority=${pri}`, () => {
                    expect(isEligibleForAppointment(cat, pri)).toBe(true);
                });
            }
        }
    });

    describe('rejects ineligible category × any priority', () => {
        for (const cat of ineligibleCategories) {
            for (const pri of [...eligiblePriorities, ...ineligiblePriorities]) {
                it(`category=${cat}, priority=${pri}`, () => {
                    expect(isEligibleForAppointment(cat, pri)).toBe(false);
                });
            }
        }
    });

    describe('rejects eligible category × low/medium priority', () => {
        for (const cat of eligibleCategories) {
            for (const pri of ineligiblePriorities) {
                it(`category=${cat}, priority=${pri}`, () => {
                    expect(isEligibleForAppointment(cat, pri)).toBe(false);
                });
            }
        }
    });

    describe('rejects garbage / missing inputs', () => {
        it.each([
            [undefined, 'critical'],
            ['wage_theft', undefined],
            [null, null],
            ['', ''],
            ['WAGE_THEFT', 'critical'],   // case-sensitive
            ['wage_theft', 'CRITICAL'],   // case-sensitive
        ])('isEligibleForAppointment(%p, %p) → false', (cat, pri) => {
            expect(isEligibleForAppointment(cat, pri)).toBe(false);
        });
    });
});
