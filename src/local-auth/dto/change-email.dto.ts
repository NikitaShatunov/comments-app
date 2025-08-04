import { ApiProperty } from '@nestjs/swagger';
import { IsEmail, IsString, MaxLength, MinLength } from 'class-validator';

export class ChangeEmailDto {
  @ApiProperty({ default: 'test1' })
  @IsEmail()
  email: string;

  @ApiProperty({ default: 'test1' })
  @IsEmail()
  newEmail: string;

  @ApiProperty({ default: 'test1' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  password: string;
}
