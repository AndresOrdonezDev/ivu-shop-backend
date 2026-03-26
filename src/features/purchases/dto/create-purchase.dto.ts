import {
  IsArray, IsDateString, IsEnum, IsOptional,
  IsString, IsUUID, MaxLength, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { PaymentType } from '../enums/payment-type.enum';
import { PurchaseItemDto } from './purchase-item.dto';

export class CreatePurchaseDto {
  @IsUUID()
  supplierId: string;

  @IsString()
  @MaxLength(100)
  invoiceNumber: string;

  @IsDateString()
  invoiceDate: string;

  @IsDateString()
  @IsOptional()
  dueDate?: string;

  @IsEnum(PaymentType)
  paymentType: PaymentType;

  @IsString()
  @IsOptional()
  notes?: string;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => PurchaseItemDto)
  items: PurchaseItemDto[];
}
