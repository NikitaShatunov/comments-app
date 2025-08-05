import { ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdateMediaDto {
  @ApiPropertyOptional({ example: 'Some name' })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name?: string;

  @ApiPropertyOptional({ example: 'Some description' })
  @IsString()
  @IsOptional()
  @MaxLength(250)
  description?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
