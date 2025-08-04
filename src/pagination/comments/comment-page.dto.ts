import { ApiProperty } from '@nestjs/swagger';
import { PageOptionsDto } from '../page-options.dto';
import { IsEnum, IsOptional } from 'class-validator';

enum SortBy {
  CREATED_AT = 'comment.createdAt',
  USER_NAME = 'user.name',
  EMAIL = 'user.email',
}

export class CommentPageDto extends PageOptionsDto {
  @ApiProperty({
    enum: SortBy,
    required: false,
    description: 'Field to sort by',
  })
  @IsEnum(SortBy)
  @IsOptional()
  sortBy?: SortBy;
}
