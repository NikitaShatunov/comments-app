import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsArray,
  IsInt,
  IsNotEmpty,
  MaxLength,
} from 'class-validator';

export class CreatePortfolioDto {
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
    example: [1, 2, 3],
    description: 'Array of image IDs',
  })
  @IsOptional()
  @IsArray()
  @IsInt({ each: true })
  imagesIds?: number[];
}
