import { DomainException } from './domain.exception';

export class BusinessRuleException extends DomainException {
  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message, code, details);
  }
}