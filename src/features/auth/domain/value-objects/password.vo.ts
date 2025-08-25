import { BadRequestException } from '@nestjs/common';

export class Password {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  public static create(password: string, skipValidation: boolean = false): Password {
    if (!password) {
      throw new BadRequestException('Password is required');
    }

    if (!skipValidation) {
      Password.validate(password);
    }

    return new Password(password);
  }

  public static createFromHash(hashedPassword: string): Password {
    if (!hashedPassword) {
      throw new BadRequestException('Hashed password is required');
    }
    return new Password(hashedPassword);
  }

  private static validate(password: string): void {
    if (password.length < 8) {
      throw new BadRequestException('Password must be at least 8 characters long');
    }

    if (password.length > 128) {
      throw new BadRequestException('Password must be less than 128 characters long');
    }

    // At least one uppercase letter
    if (!/[A-Z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one uppercase letter');
    }

    // At least one lowercase letter
    if (!/[a-z]/.test(password)) {
      throw new BadRequestException('Password must contain at least one lowercase letter');
    }

    // At least one number
    if (!/\d/.test(password)) {
      throw new BadRequestException('Password must contain at least one number');
    }

    // At least one special character
    if (!/[@$!%*?&]/.test(password)) {
      throw new BadRequestException('Password must contain at least one special character (@$!%*?&)');
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