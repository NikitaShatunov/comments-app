import { ApiPropertyOptional } from '@nestjs/swagger';
import { PageOptionsDto } from '../page-options.dto';
import { IsNotEmpty, IsNumber, IsOptional, IsString } from 'class-validator';
import { Type } from 'class-transformer';

export class MediaPageDto extends PageOptionsDto {
  @ApiPropertyOptional({
    example: 'email@gmail.com',
    description: 'Search by email, description, title or user name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search?: string;

  @ApiPropertyOptional({
    example: 2,
    description: 'Search by portfolio id',
  })
  @IsOptional()
  @IsNumber()
  @Type(() => Number)
  portfolioId?: number;
}
