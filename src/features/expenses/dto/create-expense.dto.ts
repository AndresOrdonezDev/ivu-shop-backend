import {
  IsDateString, IsEnum, IsNumber, IsOptional,
  IsString, IsUUID, MaxLength, Min,
} from 'class-validator';
import { ExpensePaymentType } from '../enums/expense-payment-type.enum';

export class CreateExpenseDto {
  @IsString()
  @MaxLength(255)
  description: string;

  @IsNumber()
  @Min(0)
  amount: number;

  @IsDateString()
  expenseDate: string;

  @IsEnum(ExpensePaymentType)
  paymentType: ExpensePaymentType;

  @IsUUID()
  @IsOptional()
  categoryId?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
