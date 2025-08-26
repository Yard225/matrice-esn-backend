export abstract class BaseEntity {
  id: string;
  createdAt: Date;
  updatedAt: Date;

  constructor() {
    this.createdAt = new Date();
    this.updatedAt = new Date();
  }

  public equals(entity: BaseEntity): boolean {
    return this.id === entity.id;
  }

  public isNew(): boolean {
    return !this.id;
  }
}