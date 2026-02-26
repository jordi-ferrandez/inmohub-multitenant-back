import { normalizeDateToUTC, formatDateOnly } from './dateUtils';
import { DateTime } from 'luxon';

describe('dateUtils', () => {
    describe('normalizeDateToUTC', () => {
        it('should return Date object if input is Date', () => {
            const date = new Date();
            const result = normalizeDateToUTC(date);
            expect(result).toBe(date);
        });

        it('should normalize YYYY-MM-DD string to UTC midnight', () => {
            const dateString = '2025-11-22';
            const result = normalizeDateToUTC(dateString);
            
            // Expected: 2025-11-22T00:00:00.000Z
            expect(result.toISOString()).toBe('2025-11-22T00:00:00.000Z');
        });

        it('should respect user timezone when provided', () => {
            const dateString = '2025-11-22';
            const userTimezone = 'America/New_York'; // UTC-5 (Nov is EST)
            const result = normalizeDateToUTC(dateString, userTimezone);
            
            // Midnight in NY is 05:00 UTC
            expect(result.toISOString()).toBe('2025-11-22T05:00:00.000Z');
        });

        it('should fallback to JS Date parsing for other formats', () => {
            const isoString = '2025-11-22T10:30:00.000Z';
            const result = normalizeDateToUTC(isoString);
            expect(result.toISOString()).toBe(isoString);
        });
    });

    describe('formatDateOnly', () => {
        it('should format Date object to YYYY-MM-DD', () => {
            const date = new Date('2025-11-22T15:00:00Z');
            const result = formatDateOnly(date);
            expect(result).toBe('2025-11-22');
        });

        it('should format ISO string to YYYY-MM-DD', () => {
            const dateString = '2025-11-22T15:00:00Z';
            const result = formatDateOnly(dateString);
            expect(result).toBe('2025-11-22');
        });
    });
});
