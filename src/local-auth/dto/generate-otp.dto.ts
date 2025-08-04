import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsEnum } from 'class-validator';

export class GenerateOtpDto {
  @ApiProperty({ default: 'test1' })
  @IsEmail()
  email: string;

  @ApiProperty({ example: 'reset password' })
  @IsEnum(['verify account', 'reset email', 'reset password'])
  type: 'verify account' | 'reset email' | 'reset password';
}
