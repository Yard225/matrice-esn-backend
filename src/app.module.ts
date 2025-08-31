import { Module } from '@nestjs/common';
import { AuthModule } from './features/auth/auth.module';
import { ConfigModule } from '@nestjs/config';
import appConfig from './shared/config/app.config';
import databaseConfig from './shared/config/database.config';
import jwtConfig from './shared/config/jwt.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      load: [appConfig, databaseConfig, jwtConfig],
      isGlobal: true,
      ignoreEnvFile: false,
      envFilePath: ['.env'],
      ignoreEnvVars: false,
    }),
    AuthModule,
  ],
  providers: [],
})
export class AppModule {}
