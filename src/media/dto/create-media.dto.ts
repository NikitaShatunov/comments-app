import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(50)
  name: string;

  @IsString()
  @IsOptional()
  @MaxLength(250)
  description?: string;
}
