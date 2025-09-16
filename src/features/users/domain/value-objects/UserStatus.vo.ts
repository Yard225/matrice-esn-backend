import { DomainException } from '@/core/base/exceptions/Domain.exception';

export class UserStatus {
  private readonly _value: 'active' | 'inactive' | 'suspended';

  private constructor(value: 'active' | 'inactive' | 'suspended') {
    this._value = value;
  }

  public static create(status: string): UserStatus {
    // TODO: Validate status value against allowed values
    // TODO: Throw exception if invalid status
    // TODO: Handle case sensitivity
    
    if (!['active', 'inactive', 'suspended'].includes(status)) {
      throw new DomainException(`Invalid user status: ${status}`, 'INVALID_USER_STATUS');
    }
    
    return new UserStatus(status as 'active' | 'inactive' | 'suspended');
  }

  public get value(): 'active' | 'inactive' | 'suspended' {
    return this._value;
  }

  public isActive(): boolean {
    // TODO: Return true if status is active
    return this._value === 'active';
  }

  public equals(other: UserStatus): boolean {
    return this._value === other._value;
  }
}