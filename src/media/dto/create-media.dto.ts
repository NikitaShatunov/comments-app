import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class CreateMediaDto {
  @IsString()
  @IsNotEmpty()
  name: string;

  @IsOptional()
  @IsBoolean()
  is_public: boolean;
}
