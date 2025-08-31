import { DomainException } from './Domain.exception';

export class BadRequestException extends DomainException {
  constructor(
    message: string,
    code: string,
    details?: Record<string, unknown>,
  ) {
    super(message, code, details);
  }
}
