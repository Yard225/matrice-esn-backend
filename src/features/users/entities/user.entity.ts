import { BaseEntity } from '@/core/base/entities/Base.entity';
import { Email } from '@/features/auth/domain/value-objects/Email.vo';

type UserProps = {
  id: string;
  email: Email;
  firstName: string;
  lastName: string;
  password: string;
  role: string;
  department?: string;
  isActive: boolean;
};

export class User extends BaseEntity {
  lastLoginAt?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;

  constructor(public props: UserProps) {
    super(props.id);
  }

  get fullName(): string {
    return `${this.props.firstName} ${this.props.lastName}`;
  }

  public updateLastLogin(): void {
    this.lastLoginAt = new Date();
  }

  public deactivate(): void {
    this.props.isActive = false;
  }

  public activate(): void {
    this.props.isActive = true;
  }

  public setResetPasswordToken(
    token: string,
    expiresInMinutes: number = 60,
  ): void {
    this.resetPasswordToken = token;
    this.resetPasswordExpires = new Date(
      Date.now() + expiresInMinutes * 60 * 1000,
    );
  }

  public clearResetPasswordToken(): void {
    this.resetPasswordToken = undefined;
    this.resetPasswordExpires = undefined;
  }

  public isResetPasswordTokenValid(token: string): boolean {
    return (
      !this.resetPasswordToken &&
      this.resetPasswordToken === token &&
      !!this.resetPasswordExpires &&
      this.resetPasswordExpires > new Date()
    );
  }

  update(data: Partial<UserProps>): void {
    this.props = { ...this.props, ...data };
    this.setUpdatedAt();
  }
}
