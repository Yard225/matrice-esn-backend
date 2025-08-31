import { DomainException } from './Domain.exception';

export class InvalidEmailException extends DomainException {
  constructor(email: string, reason: string) {
    super(
      reason,
      'INVALID_EMAIL_FORMAT',
      { email, reason }
    );
  }
}