import { BaseEntity } from './base.entity';

export abstract class AuditableEntity extends BaseEntity {
  createdBy?: string;
  updatedBy?: string;
  deletedAt?: Date;
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