import { ApiProperty } from '@nestjs/swagger';
import {
  IsEmail,
  IsString,
  Length,
  MaxLength,
  MinLength,
} from 'class-validator';

export class RecoverPasswordDto {
  @ApiProperty({ default: 'test1' })
  @IsEmail()
  email: string;

  @ApiProperty({ default: 'test1' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  newPassword: string;

  @ApiProperty({ default: '111111' })
  @IsString()
  @Length(6, 6, { message: 'OTP must be a string with 6 characters' })
  otp: string;
}
