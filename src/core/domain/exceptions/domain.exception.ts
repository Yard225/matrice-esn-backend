export abstract class DomainException extends Error {
  public readonly code: string;
  public readonly details?: Record<string, any>;

  constructor(message: string, code: string, details?: Record<string, any>) {
    super(message);
    this.code = code;
    this.details = details;
    this.name = this.constructor.name;
  }
}