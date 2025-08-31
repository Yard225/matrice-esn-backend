import { DomainException } from '@/core/base/exceptions/Domain.exception';

export class ExpiredToken extends DomainException {
  constructor(message: string, code: string = 'EXPIRED_TOKEN') {
    super(message, code);
  }
}
