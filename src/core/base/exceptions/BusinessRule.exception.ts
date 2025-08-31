import { DomainException } from './Domain.exception';

export class BusinessRuleException extends DomainException {
  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message, code, details);
  }
}