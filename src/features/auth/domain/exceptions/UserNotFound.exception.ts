import { DomainException } from '@/core/base/exceptions/Domain.exception';

export class UserNotFoundException extends DomainException {
  constructor(
    message: string,
    code: 'ID_NOT_FOUND' | 'EMAIL_NOT_FOUND' = 'ID_NOT_FOUND',
  ) {
    super(message, code, { message, code });
  }
}
