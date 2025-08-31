import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppModule } from '@/app.module';
import { IFixture } from '../fixtures/ports/Fixture.interface';

export class TestApp {
  private app: INestApplication;

  async setup() {
    const module = await Test.createTestingModule({
      imports: [
        AppModule,
        ConfigModule.forRoot({
          ignoreEnvFile: true,
          ignoreEnvVars: true,
          isGlobal: true,
        //   load: [
        //     () => ({
        //       DATABASE_URL:
        //         'mongodb://admin:azerty@localhost:3701/webinaires?authSource=admin&directConnection=true',
        //     }),
        //   ],
        }),
      ],
    }).compile();

    this.app = module.createNestApplication();
    this.app.init();
  }

  async cleanup() {
    return this.app.close();
  }

  async loadFixtures(fixtures: IFixture[]) {
    Promise.all(fixtures.map((fixture) => fixture.load(this)));
  }

  get<T>(name: string) {
    return this.app.get<T>(name);
  }

  getHttpServer() {
    return this.app.getHttpServer();
  }
}
