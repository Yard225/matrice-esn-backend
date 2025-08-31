import { DateRange } from '@/core/base/value-objects/DateRange.vo';

describe('Feature: Email VO', () => {
  let dateRange: DateRange;

  const startDate = new Date('2025-01-01T10:10:00.000Z');
  const endDate = new Date('2025-01-02T10:10:00.000Z');

  const startFromDays = new Date();

  beforeEach(async () => {
    dateRange = DateRange.create(startDate, endDate);
  });

  describe('Scenario: Happy Path', () => {
    const payload = {
      startDate: new Date('2025-01-01T10:10:00.000Z'),
      endDate: new Date('2025-01-02T10:10:00.000Z'),
    };

    it('should return create and return the daterange', () => {
      const result = DateRange.create(payload.startDate, payload.endDate);

      expect(result).toEqual(dateRange);
    });
  });

  describe('Scenario: Incorrect date range', () => {
    const payload = {
      startDate: new Date('2025-01-12T10:10:00.000Z'),
      endDate: new Date('2025-01-10T10:10:00.000Z'),
    };

    it('should failed if startDate must great than endDate', () => {
      expect(() =>
        DateRange.create(
          new Date(payload.startDate),
          new Date(payload.endDate),
        ),
      ).toThrow('Start date must be before end date');
    });
  });

  describe('Scenario: Create Date range from days', () => {
    const payload = 5;

    it('should return daterange', () => {
      const result = DateRange.createFromDays(payload);

      expect(result).toBeDefined();
    });
  });
});
