import { DomainException } from './domain.exception';

export class BadRequestException extends DomainException {
  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>,
  ) {
    super(message, code, details);
  }
}
