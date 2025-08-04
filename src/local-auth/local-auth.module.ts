import { Module } from '@nestjs/common';
import { LocalAuthService } from './local-auth.service';
import { LocalAuthController } from './local-auth.controller';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtModule } from '@nestjs/jwt';
import { User } from 'src/users/entities/user.entity';
import { OtpCode } from 'src/otp-code/entities/otp-code.entity';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { UsersService } from 'src/users/users.service';
import { OtpCodeService } from 'src/otp-code/otp-code.service';
import { LocalStrategy } from './strategies/local.strategy';
import { JwtStrategy } from './strategies/jwt.strategy';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User, OtpCode]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET_KEY'),
        signOptions: { expiresIn: '7d' },
      }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    LocalAuthService,
    LocalStrategy,
    JwtStrategy,
    UsersService,
    OtpCodeService,
  ],
  controllers: [LocalAuthController],
  exports: [LocalAuthService],
})
export class LocalAuthModule {}
