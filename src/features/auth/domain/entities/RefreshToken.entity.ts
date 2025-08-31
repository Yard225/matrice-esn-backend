import { BaseEntity } from '@/core/base/entities/Base.entity';

type RefreshTokenProps = {
  id: string;
  sub: string;
  iat: number;
  exp: number;
};

export class RefreshToken extends BaseEntity {
  constructor(public props: RefreshTokenProps) {
    super(props.id);
  }
}
