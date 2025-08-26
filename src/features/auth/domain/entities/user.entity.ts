// import { AuditableEntity } from '@/core/domain/entities/auditable.entity';
// import { Email } from '@/core/domain/value-objects/email.vo';

// type UserProps = {
//   email: string;
//   firstName: string;
//   lastName: string;
//   password: string;
//   role: string;
//   isActive: boolean;
//   department?: string;
//   lastLoginAt?: Date;
//   resetPasswordToken?: string;
//   resetPasswordExpires?: Date;
// };

// export class User extends AuditableEntity {
//   // private _email: string;
//   // firstName: string;
//   // lastName: string;
//   // password: string;
//   // role: string;
//   // department?: string;
//   // isActive: boolean;
//   // lastLoginAt?: Date;
//   // resetPasswordToken?: string;
//   // resetPasswordExpires?: Date;

//   constructor(
//     public props: UserProps,
//     createdBy?: string,
//   ) {
//     super(createdBy);
//   }

//   // get email(): Email {
//   //   return Email.create(this.props.email);
//   // }

//   // set email(email: Email) {
//   //   this.props.email = email.value;
//   // }

//   get fullName(): string {
//     return `${this.props.firstName} ${this.props.lastName}`;
//   }

//   public updateLastLogin(): void {
//     this.props.lastLoginAt = new Date();
//   }

//   public deactivate(): void {
//     this.props.isActive = false;
//   }

//   public activate(): void {
//     this.props.isActive = true;
//   }

//   public setResetPasswordToken(
//     token: string,
//     expiresInMinutes: number = 60,
//   ): void {
//     this.props.resetPasswordToken = token;
//     this.props.resetPasswordExpires = new Date(
//       Date.now() + expiresInMinutes * 60 * 1000,
//     );
//   }

//   public clearResetPasswordToken(): void {
//     this.props.resetPasswordToken = undefined;
//     this.props.resetPasswordExpires = undefined;
//   }

//   public isResetPasswordTokenValid(token: string): boolean {
//     return (
//       this.props.resetPasswordToken === token &&
//       this.props.resetPasswordExpires &&
//       this.props.resetPasswordExpires > new Date()
//     );
//   }

//   public updateProfile(
//     firstName?: string,
//     lastName?: string,
//     department?: string,
//   ): void {
//     if (firstName) this.props.firstName = firstName;
//     if (lastName) this.props.lastName = lastName;
//     if (department !== undefined) this.props.department = department;
//   }
// }
