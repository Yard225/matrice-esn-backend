import { Password } from '@/features/auth/domain/value-objects/Password.vo';
import { InvalidPasswordException } from '@/core/base/exceptions/InvalidPassword.exception';

describe('Feature: Email VO', () => {
  let password: Password;

  beforeEach(async () => {
    password = Password.create('Azerty123@');
  });

  describe('Scenario: Happy Path', () => {
    const payload = 'Azerty123@';

    it('should create and return the same password value', () => {
      const result = Password.create(payload);
      expect(result).toEqual(password);
    });
  });

  describe('Scenario: empty password', () => {
    const payload = '';

    it('should failed if email is empty', () => {
      expect(() => Password.create(payload, true)).toThrow(
        InvalidPasswordException,
      );
    });
  });

  describe('Scenario: Validation skip', () => {
    const payload = 'azerty';

    it('should not validate password requirement', () => {
      const result = Password.create(payload, true);
      expect(result.value).toBe(payload);
    });
  });

  describe('Scenario: Password length must be greater than 8 characters', () => {
    const payload = 'azerty@';

    it('should failed if password is under 8 characters', () => {
      expect(() => Password.create(payload)).toThrow(
        'Password must be at least 8 characters long',
      );
    });
  });

  describe('Scenario: Password length must be lower than 128 characters', () => {
    const payload = 'a@'.repeat(128);

    it('should failed if password is not under 128 characters', () => {
      expect(() => Password.create(payload)).toThrow(
        'Password must be less than 128 characters long',
      );
    });
  });

  describe('Scenario: Password must have at least one uppercase letter', () => {
    const payload = 'aaaaaaaaaa';

    it('should failed if password does not have one uppercase letter', () => {
      expect(() => Password.create(payload)).toThrow(
        'Password must contain at least one uppercase letter',
      );
    });
  });

  describe('Scenario: Password must have at least one number', () => {
    const payload = 'Aaaaaaaaaa@';

    it('should failed if password does not have one number', () => {
      expect(() => Password.create(payload)).toThrow(
        'Password must contain at least one number',
      );
    });
  });

  describe('Scenario: Password must have at least one lowercase letter', () => {
    const payload = 'AAAAAAAAAAAA@';

    it('should failed if password does not have one lowercase letter', () => {
      expect(() => Password.create(payload)).toThrow(
        'Password must contain at least one lowercase letter',
      );
    });
  });

  describe('Scenario: Create password from hash', () => {
    const payload = 'tkaecbacbaebak355jagè23xaxhxax';

    it('should create and return password', () => {
      const createdPassword = Password.createFromHash(payload);
      expect(createdPassword.value).toBe(payload);
    });
  });

  describe('Scenario: Create password from hash', () => {
    const payload = '';

    it('should failed if password is empty or undefined or null', () => {
      expect(() => Password.createFromHash(payload)).toThrow(
        'Hashed password is required',
      );
    });
  });
});
