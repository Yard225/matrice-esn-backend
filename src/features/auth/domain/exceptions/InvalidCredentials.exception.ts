import { DomainException } from '@/core/base/exceptions/Domain.exception';

export class InvalidCredentialsException extends DomainException {
  constructor(message: string, code: string = 'INCORRECT_PASSWORD') {
    super(message, code);
  }
}
