// import { InvalidEmailException } from '../exceptions/invalid-email.exception';

export class Email {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(email: string): Email {
    //     if (!email) {
    //       throw new InvalidEmailException(email, 'Email is required');
    //     }

    //     const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    //     if (!emailRegex.test(email)) {
    //       throw new InvalidEmailException(email, 'Invalid email format pattern');
    //     }

    return new Email(email.toLowerCase().trim());
  }

  public get value(): string {
    return this._value;
  }

  //   public getDomain(): string {
  //     return this._value.split('@')[1];
  //   }

  //   public getLocalPart(): string {
  //     return this._value.split('@')[0];
  //   }

  //   public equals(other: Email): boolean {
  //     return this._value === other._value;
  //   }

  //   public toString(): string {
  //     return this._value;
  //   }
}
