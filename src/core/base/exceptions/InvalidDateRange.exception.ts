import { DomainException } from './Domain.exception';

export class InvalidDateRangeException extends DomainException {
  constructor(startDate: Date, endDate: Date, reason: string) {
    super('Start date must be before end date', 'INVALID_DATE_RANGE', {
      startDate,
      endDate,
      reason,
    });
  }
}
