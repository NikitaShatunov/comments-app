import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ValidationPipe } from '@nestjs/common';
import { UsersModule } from './users/users.module';
import { LocalAuthModule } from './local-auth/local-auth.module';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { MediaModule } from './media/media.module';
import { CommentsModule } from './comments/comments.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  const config = new DocumentBuilder()
    .setTitle('API for Lanars')
    .setDescription('API documentation for the Lanars test application')
    .setVersion('1.2')
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
    include: [
      UsersModule,
      LocalAuthModule,
      PortfoliosModule,
      MediaModule,
      CommentsModule,
    ],
  });
  SwaggerModule.setup('api', app, document);

  app.useGlobalPipes(new ValidationPipe());
  app.enableCors();

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
