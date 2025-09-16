import { DomainException } from '@/core/base/exceptions/Domain.exception';

export class RoleLevel {
  private readonly _value: 'middle' | 'senior' | 'expert';

  private constructor(value: 'middle' | 'senior' | 'expert') {
    this._value = value;
  }

  public static create(level: string): RoleLevel {
    // TODO: Validate level value against allowed values
    // TODO: Throw exception if invalid level
    // TODO: Handle case sensitivity
    // TODO: Return new RoleLevel instance
    
    if (!['middle', 'senior', 'expert'].includes(level)) {
      throw new DomainException(`Invalid role level: ${level}`, 'INVALID_ROLE_LEVEL');
    }
    
    return new RoleLevel(level as 'middle' | 'senior' | 'expert');
  }

  public get value(): 'middle' | 'senior' | 'expert' {
    return this._value;
  }

  public isMiddle(): boolean {
    return this._value === 'middle';
  }

  public isSenior(): boolean {
    return this._value === 'senior';
  }

  public isExpert(): boolean {
    return this._value === 'expert';
  }

  public getNumericLevel(): number {
    // TODO: Return numeric representation for sorting/comparison
    switch (this._value) {
      case 'middle': return 1;
      case 'senior': return 2;
      case 'expert': return 3;
    }
  }

  public equals(other: RoleLevel): boolean {
    return this._value === other._value;
  }

  public isHigherThan(other: RoleLevel): boolean {
    return this.getNumericLevel() > other.getNumericLevel();
  }

  public isLowerThan(other: RoleLevel): boolean {
    return this.getNumericLevel() < other.getNumericLevel();
  }
}