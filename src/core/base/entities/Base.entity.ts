export abstract class BaseEntity {
  id: string;
  private readonly createdAt?: Date;
  private updatedAt?: Date;

  constructor(id: string) {
    this.createdAt = new Date();
    this.id = id;
  }

  public equals(entity: BaseEntity): boolean {
    return this.id === entity.id;
  }

  public isNew(): boolean {
    return !this.id;
  }

  get createdDate(): Date | undefined {
    return this.createdAt;
  }

  setUpdatedAt(): void {
    this.updatedAt = new Date();
  }
}
