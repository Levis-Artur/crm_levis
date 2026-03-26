import { Transform } from 'class-transformer';
import { IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { optionalTrim, parseNumber } from './dto-transformers';

export class UpdateOrderReturnDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  reason?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  notes?: string;

  @Transform(({ value }) => parseNumber(value))
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  amount?: number;
}
