import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { OtpCode } from './entities/otp-code.entity';
import { User } from 'src/users/entities/user.entity';
import { OtpCodeController } from './otp-code.controller';
import { OtpCodeService } from './otp-code.service';

@Module({
  imports: [TypeOrmModule.forFeature([OtpCode, User])],
  controllers: [OtpCodeController],
  providers: [OtpCodeService],
  exports: [OtpCodeService],
})
export class OtpCodeModule {}
