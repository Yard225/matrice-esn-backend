import { IUseCase } from '@/core/ports/UseCase.interface';
import { ValidateTokenRequest } from '../models/Request.model';
import { VallidateTokenResponse } from '../models/Response.model';

export class ValidateTokenUseCase
  implements IUseCase<ValidateTokenRequest, VallidateTokenResponse>
{
  constructor() {}

  execute(request: ValidateTokenRequest): Promise<VallidateTokenResponse> {
    throw new Error('Method not implemented.');
  }
}
