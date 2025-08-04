import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PageOptionsDto } from '../page-options.dto';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class PortfolioPageDto extends PageOptionsDto {
  @ApiPropertyOptional({
    example: 'email@gmail.com',
    description: 'Search by email, description, title or user name',
  })
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  search?: string;
}
