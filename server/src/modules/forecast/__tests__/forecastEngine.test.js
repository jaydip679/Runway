const { Decimal } = require('@prisma/client/runtime/library');
const { computeForecast, isOccurrenceDay } = require('../forecastEngine');
const { addDays } = require('date-fns');

describe('Forecast Engine', () => {
  let today;

  beforeEach(() => {
    today = new Date();
    today.setHours(0, 0, 0, 0);
  });

  describe('isOccurrenceDay', () => {
    it('returns true if target is exactly the nextOccurrenceDate', () => {
      const commitment = {
        nextOccurrenceDate: addDays(today, 5).toISOString(),
        intervalUnit: 'MONTHLY',
        intervalCount: 1,
      };
      expect(isOccurrenceDay(commitment, addDays(today, 5))).toBe(true);
    });

    it('expands DAILY occurrences correctly', () => {
      const commitment = {
        nextOccurrenceDate: addDays(today, 1).toISOString(),
        intervalUnit: 'DAILY',
        intervalCount: 2, // Every 2 days
      };
      expect(isOccurrenceDay(commitment, addDays(today, 1))).toBe(true);
      expect(isOccurrenceDay(commitment, addDays(today, 2))).toBe(false);
      expect(isOccurrenceDay(commitment, addDays(today, 3))).toBe(true);
    });

    it('expands WEEKLY occurrences correctly', () => {
      const commitment = {
        nextOccurrenceDate: addDays(today, 2).toISOString(),
        intervalUnit: 'WEEKLY',
        intervalCount: 1,
      };
      expect(isOccurrenceDay(commitment, addDays(today, 2))).toBe(true);
      expect(isOccurrenceDay(commitment, addDays(today, 9))).toBe(true);
      expect(isOccurrenceDay(commitment, addDays(today, 10))).toBe(false);
    });

    it('expands MONTHLY occurrences correctly', () => {
      const commitment = {
        nextOccurrenceDate: addDays(today, 5).toISOString(),
        intervalUnit: 'MONTHLY',
        intervalCount: 1,
      };
      const nextMonth = new Date(today);
      nextMonth.setDate(today.getDate() + 5);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      expect(isOccurrenceDay(commitment, addDays(today, 5))).toBe(true);
      expect(isOccurrenceDay(commitment, nextMonth)).toBe(true);
    });

    it('expands YEARLY occurrences correctly', () => {
      const commitment = {
        nextOccurrenceDate: addDays(today, 10).toISOString(),
        intervalUnit: 'YEARLY',
        intervalCount: 1,
      };
      const nextYear = new Date(today);
      nextYear.setDate(today.getDate() + 10);
      nextYear.setFullYear(nextYear.getFullYear() + 1);

      expect(isOccurrenceDay(commitment, addDays(today, 10))).toBe(true);
      expect(isOccurrenceDay(commitment, nextYear)).toBe(true);
    });
  });

  describe('computeForecast', () => {
    it('zero accounts / zero recurring / zero history -> flat projection', () => {
      const result = computeForecast({
        dayZeroBalance: new Decimal('0'),
        confirmedRecurring: [],
        discretionaryDaily: new Decimal('0'),
      });
      
      expect(result.length).toBe(60);
      expect(result[0].projectedBalance.toString()).toBe('0');
      expect(result[59].projectedBalance.toString()).toBe('0');
      expect(result[0].confidenceLevel).toBe('HIGH');
      expect(result[14].confidenceLevel).toBe('MEDIUM'); // Day 15
      expect(result[30].confidenceLevel).toBe('LOW'); // Day 31
    });

    it('subtracts discretionary daily average on every day', () => {
      const result = computeForecast({
        dayZeroBalance: new Decimal('100'),
        confirmedRecurring: [],
        discretionaryDaily: new Decimal('5'),
      });

      expect(result[0].projectedBalance.toString()).toBe('95');
      expect(result[1].projectedBalance.toString()).toBe('90');
      expect(result[59].projectedBalance.toString()).toBe('-200'); // 100 - (60 * 5)
    });

    it('correctly handles MONTHLY expense', () => {
      const result = computeForecast({
        dayZeroBalance: new Decimal('1000'),
        confirmedRecurring: [
          {
            type: 'EXPENSE',
            amount: new Decimal('500'),
            nextOccurrenceDate: addDays(today, 5).toISOString(),
            intervalUnit: 'MONTHLY',
            intervalCount: 1
          }
        ],
        discretionaryDaily: new Decimal('0'),
      });

      expect(result[3].projectedBalance.toString()).toBe('1000'); // day 4
      expect(result[4].projectedBalance.toString()).toBe('500'); // day 5
      expect(result[5].projectedBalance.toString()).toBe('500'); // day 6
    });

    it('correctly handles WEEKLY income', () => {
      const result = computeForecast({
        dayZeroBalance: new Decimal('0'),
        confirmedRecurring: [
          {
            type: 'INCOME',
            amount: new Decimal('100'),
            nextOccurrenceDate: addDays(today, 7).toISOString(),
            intervalUnit: 'WEEKLY',
            intervalCount: 1
          }
        ],
        discretionaryDaily: new Decimal('0'),
      });

      expect(result[5].projectedBalance.toString()).toBe('0');
      expect(result[6].projectedBalance.toString()).toBe('100'); // day 7
      expect(result[13].projectedBalance.toString()).toBe('200'); // day 14
      expect(result[20].projectedBalance.toString()).toBe('300'); // day 21
    });

    it('confidence level boundaries', () => {
      const result = computeForecast({
        dayZeroBalance: new Decimal('0'),
        confirmedRecurring: [],
        discretionaryDaily: new Decimal('0'),
      });

      expect(result[13].confidenceLevel).toBe('HIGH'); // Day 14
      expect(result[14].confidenceLevel).toBe('MEDIUM'); // Day 15
      expect(result[29].confidenceLevel).toBe('MEDIUM'); // Day 30
      expect(result[30].confidenceLevel).toBe('LOW'); // Day 31
      expect(result[59].confidenceLevel).toBe('LOW'); // Day 60
    });

    it('day-0 balance correctly equals sum of supplied balances', () => {
       const result = computeForecast({
        dayZeroBalance: new Decimal('350.50'),
        confirmedRecurring: [],
        discretionaryDaily: new Decimal('10'),
      });
      expect(result[0].projectedBalance.toString()).toBe('340.5'); // 350.50 - 10
    });
  });
});
