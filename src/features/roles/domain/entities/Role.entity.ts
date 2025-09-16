import { BaseEntity } from '@/core/base/entities/Base.entity';

type RoleProps = {
  id: string;
  name: string;
  icon: string;
  category: string;
  level: 'middle' | 'senior' | 'expert';
  description: string;
  skills: string[];
  requirements?: string[];
  responsibilities?: string[];
  isActive: boolean;
};

export class Role extends BaseEntity {
  constructor(public props: RoleProps) {
    super(props.id);
  }

  public updateBasicInfo(name: string, description: string, icon: string): void {
    // TODO: Validate name is not empty
    // TODO: Validate description is not empty
    // TODO: Update entity properties
    // TODO: Set updated timestamp
    this.props.name = name;
    this.props.description = description;
    this.props.icon = icon;
    this.setUpdatedAt();
  }

  public updateSkills(skills: string[]): void {
    // TODO: Validate skills array is not empty
    // TODO: Validate each skill is not empty string
    // TODO: Remove duplicates from skills
    // TODO: Update skills property
    // TODO: Set updated timestamp
    this.props.skills = skills;
    this.setUpdatedAt();
  }

  public updateLevel(level: 'middle' | 'senior' | 'expert'): void {
    // TODO: Validate level is valid enum value
    // TODO: Update level property
    // TODO: Set updated timestamp
    this.props.level = level;
    this.setUpdatedAt();
  }

  public updateCategory(category: string): void {
    // TODO: Validate category is not empty
    // TODO: Update category property
    // TODO: Set updated timestamp
    this.props.category = category;
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

  public addRequirement(requirement: string): void {
    // TODO: Validate requirement is not empty
    // TODO: Check if requirement already exists
    // TODO: Add requirement to array
    // TODO: Set updated timestamp
    if (!this.props.requirements) {
      this.props.requirements = [];
    }
    this.props.requirements.push(requirement);
    this.setUpdatedAt();
  }

  public removeRequirement(requirement: string): void {
    // TODO: Check if requirements array exists
    // TODO: Find and remove requirement
    // TODO: Set updated timestamp
    if (this.props.requirements) {
      this.props.requirements = this.props.requirements.filter(req => req !== requirement);
      this.setUpdatedAt();
    }
  }

  public addResponsibility(responsibility: string): void {
    // TODO: Validate responsibility is not empty
    // TODO: Check if responsibility already exists
    // TODO: Add responsibility to array
    // TODO: Set updated timestamp
    if (!this.props.responsibilities) {
      this.props.responsibilities = [];
    }
    this.props.responsibilities.push(responsibility);
    this.setUpdatedAt();
  }

  public removeResponsibility(responsibility: string): void {
    // TODO: Check if responsibilities array exists
    // TODO: Find and remove responsibility
    // TODO: Set updated timestamp
    if (this.props.responsibilities) {
      this.props.responsibilities = this.props.responsibilities.filter(resp => resp !== responsibility);
      this.setUpdatedAt();
    }
  }

  public hasSkill(skill: string): boolean {
    // TODO: Search for skill in skills array (case insensitive)
    return this.props.skills.some(s => s.toLowerCase() === skill.toLowerCase());
  }

  public getSkillsCount(): number {
    return this.props.skills.length;
  }

  public isExpertLevel(): boolean {
    return this.props.level === 'expert';
  }

  public isSeniorLevel(): boolean {
    return this.props.level === 'senior';
  }

  public isMiddleLevel(): boolean {
    return this.props.level === 'middle';
  }
}