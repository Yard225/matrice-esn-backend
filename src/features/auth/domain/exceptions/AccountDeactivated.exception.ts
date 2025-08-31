import { DomainException } from '@/core/base/exceptions/Domain.exception';

export class AccountDeactivatedException extends DomainException {
  constructor(message: string, code: string = 'ACCOUNT_DEACTIVATE') {
    super(message, code);
  }
}
