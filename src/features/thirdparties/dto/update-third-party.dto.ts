import {
  IsBoolean, IsEmail, IsInt, IsNumber, IsOptional, IsString, MaxLength, Min, ValidateIf,
} from 'class-validator';

export class UpdateThirdPartyDto {
  @IsString()
  @MaxLength(50)
  @IsOptional()
  documentId?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  firstName?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  lastName?: string;

  @IsString()
  @MaxLength(50)
  @IsOptional()
  contact?: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  department?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  city?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsBoolean()
  @IsOptional()
  isSupplier?: boolean;

  @IsInt()
  @Min(0)
  @IsOptional()
  supplierCreditDays?: number;

  @IsBoolean()
  @IsOptional()
  isCustomer?: boolean;

  @IsBoolean()
  @IsOptional()
  customerCreditAuthorized?: boolean;

  // RN01: cuando el tercero es cliente autorizado para crédito, días y monto máximo son obligatorios.
  @ValidateIf((o) => o.isCustomer && o.customerCreditAuthorized)
  @IsInt()
  @Min(0)
  customerCreditDays?: number;

  @ValidateIf((o) => o.isCustomer && o.customerCreditAuthorized)
  @IsNumber()
  @Min(0)
  customerCreditLimit?: number;

  @IsBoolean()
  @IsOptional()
  invoiceAtCost?: boolean;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
