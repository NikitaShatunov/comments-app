import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsEmail,
  IsString,
  MinLength,
  MaxLength,
  IsNumber,
  IsNotEmpty,
} from 'class-validator';

export class SignUpDto {
  @ApiProperty({ example: 4 })
  @IsNumber()
  id_role: number;

  @ApiProperty({ default: 'email@gmail.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ default: 'password' })
  @IsString()
  @MinLength(8)
  @MaxLength(20)
  password: string;
}
