import { InvalidEmailException } from '@/core/base/exceptions/InvalidEmail.exception';
import { Email } from '@/features/auth/domain/value-objects/Email.vo';

describe('Feature: Email VO', () => {
  let email: Email;

  beforeEach(async () => {
    email = Email.create('johndoe@gmail.com');
  });

  describe('Scenario: Happy Path', () => {
    const payload = 'johndoe@gmail.com';

    it('should return create and the same email value', () => {
      const result = Email.create(payload);

      expect(result).toEqual(email);
    });
  });

  describe('Scenario: empty Email VO', () => {
    const payload = '';

    it('should failed if email is empty', () => {
      expect(() => Email.create(payload)).toThrow(InvalidEmailException);
    });
  });
  
  describe('Scenario: Invalid Email VO', () => {
    const payload = 'tamanrobertgmail.com';

    it('should failed if email is invalid', () => {
      expect(() => Email.create(payload)).toThrow(InvalidEmailException);
    });
  });
});
