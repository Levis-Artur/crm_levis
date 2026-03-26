import { Type, Transform } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsBoolean,
  IsDate,
  IsEmail,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  MinLength,
  ValidateNested,
} from 'class-validator';
import { CreateOrderItemDto } from './create-order-item.dto';
import { normalizeCurrency, optionalTrim, parseDate, parseNumber } from './dto-transformers';

export class CreateOrderDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  orderStatusCode?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  paymentStatusCode?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  deliveryStatusCode?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsString()
  @MinLength(1)
  customerName!: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(5)
  customerPhone?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(5)
  customerPhoneExtra?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsEmail()
  customerEmail?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  city?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  deliveryPoint?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  deliveryMethod?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  @MinLength(1)
  paymentMethod?: string;

  @Transform(({ value }) => normalizeCurrency(value))
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;

  @Transform(({ value }) => parseNumber(value))
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  prepaymentAmount?: number;

  @Transform(({ value }) => parseNumber(value))
  @IsOptional()
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  shippingCost?: number;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  comment?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  internalNote?: string;

  @IsOptional()
  @IsBoolean()
  isProblematic?: boolean;

  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  placedAt?: Date;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateOrderItemDto)
  items!: CreateOrderItemDto[];
}
