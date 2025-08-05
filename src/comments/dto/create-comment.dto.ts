import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Validate,
} from 'class-validator';
import { CommentImageOrParentConstraint } from 'src/common/validators/comment-image-or-parent.validator';

export class CreateCommentDto {
  @ApiProperty({ required: true, example: 'This is a comment' })
  @MaxLength(500)
  @IsString()
  @IsNotEmpty()
  text: string;

  @ApiProperty({ required: false, example: 1 })
  @IsNumber()
  @IsOptional()
  parentCommentId?: number;

  @ApiProperty({ required: false, example: 1 })
  @IsOptional()
  @IsNumber()
  imageId?: number;

  @Validate(CommentImageOrParentConstraint)
  private readonly __validateImageOrParent__: any;
}
