import {
  IsDateString, IsEnum, IsNumber, IsOptional,
  IsString, IsUUID, MaxLength, Min,
} from 'class-validator';
import { ExpensePaymentType } from '../enums/expense-payment-type.enum';

export class UpdateExpenseDto {
  @IsString()
  @MaxLength(255)
  @IsOptional()
  description?: string;

  @IsNumber()
  @Min(0)
  @IsOptional()
  amount?: number;

  @IsDateString()
  @IsOptional()
  expenseDate?: string;

  @IsEnum(ExpensePaymentType)
  @IsOptional()
  paymentType?: ExpensePaymentType;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
