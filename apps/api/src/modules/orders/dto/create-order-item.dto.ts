import { Transform } from 'class-transformer';
import {
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { optionalTrim, parseInteger, parseNumber } from './dto-transformers';

export class CreateOrderItemDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(100)
  sku?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsUrl({
    require_protocol: true,
  })
  @MaxLength(1024)
  purchaseLink?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsString()
  @MinLength(1)
  productName!: string;

  @Transform(({ value }) => parseInteger(value))
  @IsInt()
  @Min(1)
  quantity!: number;

  @Transform(({ value }) => parseNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  purchasePrice!: number;

  @Transform(({ value }) => parseNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  salePrice!: number;

  @Transform(({ value }) => parseNumber(value))
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  discountAmount?: number;
}
