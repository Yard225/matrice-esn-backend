import { HashedPasswordException } from "@/core/base/exceptions/HashedPassword.exception";
import { InvalidPasswordException } from "@/core/base/exceptions/InvalidPassword.exception";

export class Password {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(
    password: string,
    skipValidation: boolean = false,
  ): Password {
    if (!password) {
      throw new InvalidPasswordException(
        'Password is required',
        'EMPTY_PASSWORD',
      );
    }

    if (!skipValidation) {
      Password.validate(password);
    }

    return new Password(password);
  }

  public static createFromHash(hashedPassword: string): Password {
    if (!hashedPassword) {
      throw new HashedPasswordException(
        'Hashed password is required',
        'EMPTY_HASHED_PASSWORD',
      );
    }

    return new Password(hashedPassword);
  }

  public static validate(password: string): void {
    if (password.length < 8) {
      throw new InvalidPasswordException(
        'Password must be at least 8 characters long',
        'INVALID_PASSWORD_LENGTH',
      );
    }

    if (password.length > 128) {
      throw new InvalidPasswordException(
        'Password must be less than 128 characters long',
        'INVALID_PASSWORD_LENGTH',
      );
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new InvalidPasswordException(
        'Password must contain at least one uppercase letter',
        'PASSOWRD_VALIDATION_FAILED',
      );
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new InvalidPasswordException(
        'Password must contain at least one lowercase letter',
        'PASSOWRD_VALIDATION_FAILED',
      );
    }

    // At least one number
    if (!/\d/.test(password)) {
      throw new InvalidPasswordException(
        'Password must contain at least one number',
        'PASSOWRD_VALIDATION_FAILED',
      );
    }

    // At least one special character
    if (!/[@$!%*?&]/.test(password)) {
      throw new InvalidPasswordException(
        'Password must contain at least one special character (@$!%*?&)',
        'PASSOWRD_VALIDATION_FAILED',
      );
    }
  }

  public get value(): string {
    return this._value;
  }

  public equals(other: Password): boolean {
    return this._value === other._value;
  }

  public toString(): string {
    return '[PROTECTED]';
  }
}
