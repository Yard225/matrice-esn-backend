import { IPasswordService } from '../../domain/services/HashingService.interface';
import * as bcrypt from 'bcryptjs';

export class BcryptHasherService implements IPasswordService {
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hashSync(plainPassword);
  }

  async verify(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  generateRandomPassword(length?: number): string {
    if (!length) length = 16;

    let generatedPassword: string = '';

    const possibleCaracters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,-./:;<=>?@[]^_`{|}~';

    for (let i = 0; i < length; i++) {
      generatedPassword += possibleCaracters.charAt(
        Math.floor(Math.random() * possibleCaracters.length),
      );
    }

    return generatedPassword;
  }
}
