import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { LocalAuthModule } from './local-auth/local-auth.module';
import { ThrottlerGuard } from '@nestjs/throttler';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.use(cookieParser());

  const config = new DocumentBuilder()
    .setTitle('API for Lanars')
    .setDescription('API documentation for the Lanars test application')
    .setVersion('1.1')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config, {
    include: [UsersModule, LocalAuthModule],
  });
  SwaggerModule.setup('api', app, document);

  app.use(bodyParser.json());
  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
