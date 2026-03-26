import { Transform } from 'class-transformer';
import { IsDate, IsOptional } from 'class-validator';
import { parseDate } from './dto-transformers';

export class FinanceSummaryQueryDto {
  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  from?: Date;

  @Transform(({ value }) => parseDate(value))
  @IsOptional()
  @IsDate()
  to?: Date;
}
