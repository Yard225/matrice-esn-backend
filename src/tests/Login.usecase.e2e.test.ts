import { e2eUsers } from './seeds/User.seed';
import { TestApp } from './utils/TestApp';
import * as request from 'supertest';

describe('Feature: Organizing Webinaire', () => {
  let app: TestApp;

  const payload = {
    email: e2eUsers.alice.entity.props.email.value,
    password: e2eUsers.alice.entity.props.password,
  };

  beforeEach(async () => {
    app = new TestApp();
    await app.setup();
    await app.loadFixtures([e2eUsers.alice]);
  });

  afterEach(async () => {
    app.cleanup();
  });

  describe('Scenario: Happy Path', () => {
    // it('should login', async () => {
    //   const result = await request(app.getHttpServer())
    //     .post('/webinaires')
    //     .set('Authorization', e2eUsers.johnDoe.createAuthorizationToken())
    //     .send(payload);

    //   expect(result.status).toBe(201);
    //   expect(result.body).toEqual({ id: expect.any(String) });

    //   const webinaireRepository = app.get<IWebinaireRepository>(
    //     I_WEBINAIRE_REPOSITORY,
    //   );
    //   const webinaire = await webinaireRepository.findById(result.body.id);

    //   expect(webinaire).toBeDefined();
    //   expect(webinaire!.props).toEqual({
    //     id: result.body.id,
    //     organizerId: e2eUsers.johnDoe.entity.props.id,
    //     title: 'My first webinaire',
    //     seats: 100,
    //     startDate,
    //     endDate,
    //   });
    // });
  });

  describe('Scenario: the user is not authenticated', () => {
    // it('should reject', async () => {
    //   const result = await request(app.getHttpServer())
    //     .post('/webinaires')
    //     .send(payload);

    //   expect(result.status).toBe(403);
    // });
  });
});
