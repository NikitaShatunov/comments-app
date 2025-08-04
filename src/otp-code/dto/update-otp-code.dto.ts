import { PartialType } from '@nestjs/swagger';
import { CreateOtpCodeDto } from './create-otp-code.dto';
import { IsEnum } from 'class-validator';

export class UpdateOtpCodeDto extends PartialType(CreateOtpCodeDto) {
  @IsEnum({
    type: 'enum',
    enum: ['unused', 'used', 'invalid'],
  })
  status: 'unused' | 'used' | 'invalid';
}
