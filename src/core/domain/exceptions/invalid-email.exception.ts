import { DomainException } from './domain.exception';

export class InvalidEmailException extends DomainException {
  constructor(email: string, reason: string) {
    super(
      `Invalid email format: ${email}`,
      'INVALID_EMAIL_FORMAT',
      { email, reason }
    );
  }
}