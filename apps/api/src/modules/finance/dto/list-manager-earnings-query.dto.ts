import { Transform } from 'class-transformer';
import { IsDate, IsInt, IsOptional, Max, Min } from 'class-validator';
import { parseDate, parseInteger } from './dto-transformers';

export class ListManagerEarningsQueryDto {
  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  completedFrom?: Date;

  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  completedTo?: Date;

  @Transform(({ value }) => parseInteger(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @Transform(({ value }) => parseInteger(value))
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
