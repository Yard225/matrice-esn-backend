type AccessTokenProps = {
  id: string;
  sub: string;
  role: string;
  firstName: string;
  lastName: string;
  iat: number;
  exp: number;
  iss?: string;
  aud?: string;
};

export class AccessToken {
  private readonly _props: AccessTokenProps;

  private constructor(props: AccessTokenProps) {
    this._props = props;
  }

  public static create(props: AccessTokenProps): AccessToken {
    return new AccessToken(props);
  }

  public get id(): string {
    return this._props.id;
  }

  public get sub(): string {
    return this._props.sub;
  }
  
  public get role(): string {
    return this._props.role;
  }

  public get firstName(): string {
    return this._props.firstName;
  }

  public get lastName(): string {
    return this._props.lastName;
  }

  public get iat(): number {
    return this._props.iat;
  }

  public get exp(): number {
    return this._props.exp;
  }

  public get iss(): string | undefined {
    return this._props.iss;
  }

  public get aud(): string | undefined {
    return this._props.aud;
  }

  public isExpired(): boolean {
    return Date.now() >= this._props.exp * 1000;
  }

  public getFullName(): string {
    return `${this._props.firstName} ${this._props.lastName}`;
  }

  public toPayload(): Omit<AccessTokenProps, 'id'> {
    const { id, ...payload } = this._props;
    return payload;
  }
}