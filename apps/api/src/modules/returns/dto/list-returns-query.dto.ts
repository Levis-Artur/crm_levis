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

export class ListReturnsQueryDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  search?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  returnStatusCode?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  requestedFrom?: Date;

  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  requestedTo?: Date;

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
