import { Transform } from 'class-transformer';
import {
  IsDate,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Length,
  Min,
  MinLength,
} from 'class-validator';
import { normalizeCurrency, optionalTrim, parseDate, parseNumber } from './dto-transformers';

export class CreateFinanceTransactionDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsString()
  @MinLength(1)
  categoryCode!: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsUUID()
  managerId?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsUUID()
  orderId?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsUUID()
  orderReturnId?: string;

  @Transform(({ value }) => parseNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @Transform(({ value }) => normalizeCurrency(value))
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  reference?: string;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  description?: string;

  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  occurredAt?: Date;
}
