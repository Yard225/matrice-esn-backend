import { AuditableEntity } from '@/core/domain/entities/auditable.entity';
import { Email } from '@/core/domain/value-objects/email.vo';
import { Column, Entity } from 'typeorm';

@Entity('users')
export class User extends AuditableEntity {
  @Column({ type: 'varchar', length: 255, unique: true })
  private _email: string;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100 })
  lastName: string;

  @Column({ type: 'varchar', length: 255 })
  password: string;

  @Column({ type: 'varchar', length: 50, default: 'user' })
  role: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department?: string;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @Column({ type: 'timestamp', nullable: true })
  lastLoginAt?: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  resetPasswordToken?: string;

  @Column({ type: 'timestamp', nullable: true })
  resetPasswordExpires?: Date;

  constructor(
    email: Email,
    firstName: string,
    lastName: string,
    password: string,
    role: string = 'user',
    department?: string,
    createdBy?: string
  ) {
    super(createdBy);
    this._email = email.value;
    this.firstName = firstName;
    this.lastName = lastName;
    this.password = password;
    this.role = role;
    this.department = department;
    this.isActive = true;
  }

  get email(): Email {
    return Email.create(this._email);
  }

  set email(email: Email) {
    this._email = email.value;
  }

  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }

  public updateLastLogin(): void {
    this.lastLoginAt = new Date();
  }

  public deactivate(): void {
    this.isActive = false;
  }

  public activate(): void {
    this.isActive = true;
  }

  public setResetPasswordToken(token: string, expiresInMinutes: number = 60): void {
    this.resetPasswordToken = token;
    this.resetPasswordExpires = new Date(Date.now() + expiresInMinutes * 60 * 1000);
  }

  public clearResetPasswordToken(): void {
    this.resetPasswordToken = undefined;
    this.resetPasswordExpires = undefined;
  }

  public isResetPasswordTokenValid(token: string): boolean {
    return (
      this.resetPasswordToken === token &&
      this.resetPasswordExpires &&
      this.resetPasswordExpires > new Date()
    );
  }

  public updateProfile(
    firstName?: string,
    lastName?: string,
    department?: string
  ): void {
    if (firstName) this.firstName = firstName;
    if (lastName) this.lastName = lastName;
    if (department !== undefined) this.department = department;
  }
}