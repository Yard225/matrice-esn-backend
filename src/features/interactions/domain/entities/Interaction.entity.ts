import { BaseEntity } from '@/core/base/entities/Base.entity';

type InteractionMetadata = {
  category: 'interne' | 'externe' | 'client';
  priority: 'low' | 'medium' | 'high' | 'critical';
  tags?: string[];
};

type InteractionVue = {
  roleId: string;
  title: string;
  fournit: string[];
  livrables: string[];
  attend: string[];
  livrablesAttendus: string[];
};

type InteractionProps = {
  id: string;
  metadata: InteractionMetadata;
  vue1: InteractionVue;
  vue2: InteractionVue;
  isActive: boolean;
};

export class Interaction extends BaseEntity {
  constructor(public props: InteractionProps) {
    super(props.id);
  }

  public updateMetadata(metadata: Partial<InteractionMetadata>): void {
    // TODO: Validate metadata fields
    // TODO: Merge with existing metadata
    // TODO: Set updated timestamp
    this.props.metadata = { ...this.props.metadata, ...metadata };
    this.setUpdatedAt();
  }

  public updateVue1(vue: Partial<InteractionVue>): void {
    // TODO: Validate vue data
    // TODO: Merge with existing vue1 data
    // TODO: Set updated timestamp
    this.props.vue1 = { ...this.props.vue1, ...vue };
    this.setUpdatedAt();
  }

  public updateVue2(vue: Partial<InteractionVue>): void {
    // TODO: Validate vue data
    // TODO: Merge with existing vue2 data
    // TODO: Set updated timestamp
    this.props.vue2 = { ...this.props.vue2, ...vue };
    this.setUpdatedAt();
  }

  public addTag(tag: string): void {
    // TODO: Validate tag is not empty
    // TODO: Check if tag already exists
    // TODO: Add tag to metadata
    // TODO: Set updated timestamp
    if (!this.props.metadata.tags) {
      this.props.metadata.tags = [];
    }
    if (!this.props.metadata.tags.includes(tag)) {
      this.props.metadata.tags.push(tag);
      this.setUpdatedAt();
    }
  }

  public removeTag(tag: string): void {
    // TODO: Check if tags array exists
    // TODO: Remove tag from array
    // TODO: Set updated timestamp
    if (this.props.metadata.tags) {
      this.props.metadata.tags = this.props.metadata.tags.filter(t => t !== tag);
      this.setUpdatedAt();
    }
  }

  public setPriority(priority: 'low' | 'medium' | 'high' | 'critical'): void {
    // TODO: Validate priority value
    // TODO: Update metadata priority
    // TODO: Set updated timestamp
    this.props.metadata.priority = priority;
    this.setUpdatedAt();
  }

  public setCategory(category: 'interne' | 'externe' | 'client'): void {
    // TODO: Validate category value
    // TODO: Update metadata category
    // TODO: Set updated timestamp
    this.props.metadata.category = category;
    this.setUpdatedAt();
  }

  public activate(): void {
    this.props.isActive = true;
    this.setUpdatedAt();
  }

  public deactivate(): void {
    this.props.isActive = false;
    this.setUpdatedAt();
  }

  public getRoleIds(): string[] {
    return [this.props.vue1.roleId, this.props.vue2.roleId];
  }

  public hasRole(roleId: string): boolean {
    return this.getRoleIds().includes(roleId);
  }

  public isHighPriority(): boolean {
    return this.props.metadata.priority === 'high' || this.props.metadata.priority === 'critical';
  }

  public isCritical(): boolean {
    return this.props.metadata.priority === 'critical';
  }

  public isInternal(): boolean {
    return this.props.metadata.category === 'interne';
  }

  public isExternal(): boolean {
    return this.props.metadata.category === 'externe';
  }

  public isClient(): boolean {
    return this.props.metadata.category === 'client';
  }
}