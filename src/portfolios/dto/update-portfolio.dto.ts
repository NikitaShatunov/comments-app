import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class UpdatePortfolioDto {
  @ApiProperty({
    example: 'My Portfolio',
    description: 'Title of the portfolio',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  title: string;

  @ApiPropertyOptional({
    example: 'A description of the portfolio',
    description: 'Description of the portfolio',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(250)
  description?: string;

  @ApiPropertyOptional({
    example: true,
    description: 'Visibility of the portfolio',
  })
  @IsOptional()
  @IsBoolean()
  isPublic?: boolean;
}
