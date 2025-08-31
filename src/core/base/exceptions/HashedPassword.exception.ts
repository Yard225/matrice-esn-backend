import { DomainException } from "./Domain.exception";

export class HashedPasswordException extends DomainException {
  constructor(message: string, code: string) {
    super(message, code, {
      message,
    });
  }
}
