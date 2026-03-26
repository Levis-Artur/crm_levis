import { Transform } from 'class-transformer';
import {
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { optionalTrim, parseInteger, parseNumber } from '../../orders/dto/dto-transformers';

export class CreateOrderShipmentDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsString()
  @MinLength(1)
  recipientRef!: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsString()
  @MinLength(1)
  recipientContactRef!: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsString()
  @MinLength(1)
  recipientCityRef!: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsString()
  @MinLength(1)
  recipientWarehouseRef!: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(191)
  recipientName?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(5)
  @MaxLength(32)
  recipientPhone?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  destinationCity?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(120)
  destinationBranch?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  @MaxLength(255)
  cargoDescription?: string;

  @Transform(({ value }) => parseNumber(value))
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  declaredValue?: number;

  @Transform(({ value }) => parseNumber(value))
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  cashOnDeliveryAmount?: number;

  @Transform(({ value }) => parseNumber(value))
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  shippingCost?: number;

  @Transform(({ value }) => parseNumber(value))
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  weight?: number;

  @Transform(({ value }) => parseInteger(value))
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 0 })
  @Min(1)
  seatsAmount?: number;
}
