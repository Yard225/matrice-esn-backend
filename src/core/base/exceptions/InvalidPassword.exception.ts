import { DomainException } from "./Domain.exception";


export class InvalidPasswordException extends DomainException {
  constructor(message: string, code: string) {
    super(message, code, {
      message,
    });
  }
}
