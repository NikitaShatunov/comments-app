import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsNumberString,
  Length,
} from 'class-validator';

export class CreateOtpCodeDto {
  @ApiProperty({ example: '1234' })
  @IsNumberString()
  @Length(4, 4, { message: 'OTP must be a string with 4 characters' })
  value: string;

  @ApiProperty({ example: '15' })
  @IsNumber()
  expirationMinutes: number;

  @ApiProperty({ example: 'verify account' })
  @IsIn(['verify account', 'reset email', 'reset password'])
  type: 'verify account' | 'reset email' | 'reset password';

  @ApiProperty({ example: 2 })
  @IsInt()
  @IsNotEmpty()
  userId: number;

  @ApiProperty({ example: 'lead' })
  @IsEnum(['user', 'lead'])
  role: string;
}
