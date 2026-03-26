import {
  IsArray, IsEnum, IsNumber, IsOptional,
  IsString, IsUUID, Min, ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';
import { SalePaymentType } from '../enums/sale-payment-type.enum';
import { SaleItemDto } from './sale-item.dto';

export class CreateSaleDto {
  @IsUUID()
  @IsOptional()
  customerId?: string;

  @IsEnum(SalePaymentType)
  paymentType: SalePaymentType;

  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SaleItemDto)
  items: SaleItemDto[];

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsString()
  @IsOptional()
  notes?: string;
}
