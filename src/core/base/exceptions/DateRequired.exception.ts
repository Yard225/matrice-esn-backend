import { DomainException } from './Domain.exception';

export class DateRequired extends DomainException {
  constructor(startDate: Date, endDate: Date, reason: string) {
    super('Start date and end date are required', 'EMPTY_DATE', {
      startDate,
      endDate,
      reason,
    });
  }
}
