// import {
//   Entity,
//   Column,
//   PrimaryGeneratedColumn,
//   CreateDateColumn,
//   UpdateDateColumn,
// } from 'typeorm';

// @Entity('users')
// export class UserSchema {
//   @PrimaryGeneratedColumn('uuid')
//   id: string;

//   @Column({ type: 'varchar', length: 255, unique: true })
//   email: string;

//   @Column({ type: 'varchar', length: 100 })
//   firstName: string;

//   @Column({ type: 'varchar', length: 100 })
//   lastName: string;

//   @Column({ type: 'varchar', length: 255 })
//   password: string;

//   @Column({ type: 'varchar', length: 50, default: 'user' })
//   role: string;

//   @Column({ type: 'varchar', length: 100, nullable: true })
//   department?: string;

//   @Column({ type: 'boolean', default: true })
//   isActive: boolean;

//   @Column({ type: 'timestamp', nullable: true })
//   lastLoginAt?: Date;

//   @Column({ type: 'varchar', length: 255, nullable: true })
//   resetPasswordToken?: string;

//   @Column({ type: 'timestamp', nullable: true })
//   resetPasswordExpires?: Date;

//   // Audit fields
//   @Column({ type: 'uuid', nullable: true })
//   createdBy?: string;

//   @Column({ type: 'uuid', nullable: true })
//   updatedBy?: string;

//   @Column({ type: 'timestamp', nullable: true })
//   deletedAt?: Date;

//   @Column({ type: 'uuid', nullable: true })
//   deletedBy?: string;

//   @CreateDateColumn({
//     type: 'timestamp',
//     default: () => 'CURRENT_TIMESTAMP',
//   })
//   createdAt: Date;

//   @UpdateDateColumn({
//     type: 'timestamp',
//     default: () => 'CURRENT_TIMESTAMP',
//     onUpdate: 'CURRENT_TIMESTAMP',
//   })
//   updatedAt: Date;
// }
