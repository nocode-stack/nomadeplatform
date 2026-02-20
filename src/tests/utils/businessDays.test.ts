import { describe, it, expect } from 'vitest';
import { isWeekday, addBusinessDays, getBusinessDaysBetween } from '../../utils/businessDays';

describe('businessDays utility', () => {
    describe('isWeekday', () => {
        it('should return true for a Monday', () => {
            const monday = new Date('2024-02-12'); // Monday
            expect(isWeekday(monday)).toBe(true);
        });

        it('should return false for a Saturday', () => {
            const saturday = new Date('2024-02-10'); // Saturday
            expect(isWeekday(saturday)).toBe(false);
        });
    });

    describe('addBusinessDays', () => {
        it('should add 1 business day correctly (Monday to Tuesday)', () => {
            const monday = new Date('2024-02-12');
            const result = addBusinessDays(monday, 1);
            expect(result.toISOString().split('T')[0]).toBe('2024-02-13');
        });

        it('should skip weekends when adding business days (Friday to Monday)', () => {
            const friday = new Date('2024-02-09');
            const result = addBusinessDays(friday, 1);
            expect(result.toISOString().split('T')[0]).toBe('2024-02-12');
        });
    });

    describe('getBusinessDaysBetween', () => {
        it('should calculate days correctly within the same week', () => {
            const start = new Date('2024-02-12'); // Mon
            const end = new Date('2024-02-14'); // Wed
            expect(getBusinessDaysBetween(start, end)).toBe(3); // Mon, Tue, Wed
        });

        it('should exclude weekends from the count', () => {
            const start = new Date('2024-02-09'); // Fri
            const end = new Date('2024-02-12'); // Mon
            expect(getBusinessDaysBetween(start, end)).toBe(2); // Fri, Mon
        });
    });
});
