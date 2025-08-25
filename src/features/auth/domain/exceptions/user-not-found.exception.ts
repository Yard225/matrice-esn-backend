import { DomainException } from '@/core/domain/exceptions/domain.exception';

export class UserNotFoundException extends DomainException {
  constructor(identifier: string, identifierType: 'id' | 'email' = 'id') {
    super(
      `User not found with ${identifierType}: ${identifier}`,
      'USER_NOT_FOUND',
      { identifier, identifierType }
    );
  }
}