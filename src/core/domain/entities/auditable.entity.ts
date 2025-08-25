import { Column } from 'typeorm';
import { BaseEntity } from './base.entity';

export abstract class AuditableEntity extends BaseEntity {
  @Column({ type: 'uuid', nullable: true })
  createdBy?: string;

  @Column({ type: 'uuid', nullable: true })
  updatedBy?: string;

  @Column({ type: 'timestamp', nullable: true })
  deletedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  deletedBy?: string;

  constructor(createdBy?: string) {
    super();
    this.createdBy = createdBy;
  }

  public softDelete(deletedBy: string): void {
    this.deletedAt = new Date();
    this.deletedBy = deletedBy;
  }

  public isDeleted(): boolean {
    return !!this.deletedAt;
  }

  public restore(): void {
    this.deletedAt = undefined;
    this.deletedBy = undefined;
  }
}