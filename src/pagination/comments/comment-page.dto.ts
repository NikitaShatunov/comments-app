import { ApiProperty } from '@nestjs/swagger';
import { PageOptionsDto } from '../page-options.dto';
import { IsNumber } from 'class-validator';
import { Type } from 'class-transformer';

export class CommentPageDto extends PageOptionsDto {
  @ApiProperty({
    example: 1,
    required: true,
    description: 'Image ID to filter by',
  })
  @IsNumber()
  @Type(() => Number)
  imageId: number;
}
