import { Transform } from 'class-transformer';
import { IsOptional, IsString, MinLength } from 'class-validator';
import { optionalTrim } from './dto-transformers';

export class UpdateOrderStatusDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsString()
  @MinLength(1)
  orderStatusCode!: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  cancelReason?: string;
}
