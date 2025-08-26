import { Email } from '@/core/domain/value-objects/email.vo';

describe('Feature: Email VO', () => {
  let email: Email;

  beforeEach(async () => {
    email = Email.create('johndoe@gmail.com');
  });

  describe('Scenario: Happy Path', () => {
    const payload = 'tamanrobert@gmail.com';

    it('should create an email', async () => {
      const result = Email.create(payload);

      expect(result.value).toBe(payload);
    });
  });

  describe('Scenario: Invalid Email VO', () => {
    const payload = {};

    it('', async () => {});
  });
});
