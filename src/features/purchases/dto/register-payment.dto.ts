import {
  IsDateString, IsEnum, IsNumber, IsOptional, IsString, MaxLength, Min,
} from 'class-validator';
import { EgresoPaymentMethod } from '../enums/egreso-payment-method.enum';

export class RegisterPaymentDto {
  @IsNumber()
  @Min(0.01)
  valorPagado: number;

  @IsEnum(EgresoPaymentMethod)
  formaPago: EgresoPaymentMethod;

  @IsNumber()
  @Min(0)
  @IsOptional()
  valorDeduccion?: number;

  @IsString()
  @MaxLength(255)
  @IsOptional()
  conceptoDeduccion?: string;

  @IsDateString()
  @IsOptional()
  fecha?: string;
}
