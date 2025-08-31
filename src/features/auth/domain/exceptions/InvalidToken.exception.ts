import { DomainException } from '@/core/base/exceptions/Domain.exception';

export class InvalidToken extends DomainException {
  constructor(message: string, code: string = 'INVALID_TOKEN') {
    super(message, code);
  }
}
