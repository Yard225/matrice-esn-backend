import * as bcrypt from 'bcryptjs';
import { IPasswordHasher } from '../ports/password-hasher.interface';

export class BcryptPasswordHasher implements IPasswordHasher {
  async hash(plainPassword: string): Promise<string> {
    return bcrypt.hash(plainPassword, 12);
  }

  async verify(
    plainPassword: string,
    hashedPassword: string,
  ): Promise<boolean> {
    return bcrypt.compareSync(plainPassword, hashedPassword);
  }

  generateRandomPassword(length?: number): string {
    if (!length) length = 16;
    let generatedPassword = '';

    const possibleCharacters =
      'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!#$%&()*+,-./:;<=>?@[]^_`{|}~';

    for (let i = 0; i < length; i++) {
      generatedPassword += possibleCharacters.charAt(
        Math.floor(Math.random() * possibleCharacters.length),
      );
    }

    return generatedPassword;
  }
}
