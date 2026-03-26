import { Transform } from 'class-transformer';
import {
  IsDate,
  IsInt,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
  MinLength,
} from 'class-validator';
import { optionalTrim, parseDate, parseInteger } from './dto-transformers';

export class ListOrdersQueryDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  orderStatusCode?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  placedFrom?: Date;

  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  placedTo?: Date;

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
