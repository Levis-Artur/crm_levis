import { Transform } from 'class-transformer';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { optionalTrim } from './dto-transformers';

export class UpdateOrderReturnStatusDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsString()
  @MinLength(1)
  returnStatusCode!: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  notes?: string;
}
