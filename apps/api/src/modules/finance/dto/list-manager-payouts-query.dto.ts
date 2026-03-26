import { Transform } from 'class-transformer';
import { IsDate, IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { ManagerPayoutStatus } from '../finance.enums';
import { parseDate, parseInteger } from './dto-transformers';

export class ListManagerPayoutsQueryDto {
  @IsOptional()
  @IsEnum(ManagerPayoutStatus)
  status?: ManagerPayoutStatus;

  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  paidFrom?: Date;

  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  paidTo?: Date;

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
