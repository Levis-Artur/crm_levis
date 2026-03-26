import { Transform } from 'class-transformer';
import { IsDate, IsNumber, IsOptional, IsString, IsUUID, Length, Min } from 'class-validator';
import { normalizeCurrency, optionalTrim, parseDate, parseNumber } from './dto-transformers';

export class CreateManagerPayoutDto {
  @Transform(({ value }) => optionalTrim(value))
  @IsUUID()
  managerId!: string;

  @Transform(({ value }) => parseNumber(value))
  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0.01)
  amount!: number;

  @Transform(({ value }) => normalizeCurrency(value))
  @IsOptional()
  @IsString()
  @Length(3, 3)
  currencyCode?: string;

  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  periodStart?: Date;

  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  periodEnd?: Date;

  @Transform(({ value }) => optionalTrim(value))
  @IsOptional()
  @IsString()
  notes?: string;
}
