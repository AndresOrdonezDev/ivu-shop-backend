import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { BusinessType } from '../../../common/enums/business-type.enum';

export class CreateTenantDto {
  // ─── Datos del negocio ──────────────────────────────────────────────────────

  @IsString()
  @MaxLength(100)
  name: string;

  @IsEnum(BusinessType)
  businessType: BusinessType;

  @IsString()
  @MaxLength(200)
  ownerName: string;

  @IsEmail()
  email: string;

  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  // ─── Credenciales del owner ─────────────────────────────────────────────────

  @IsString()
  @MaxLength(100)
  ownerFirstName: string;

  @IsString()
  @MaxLength(100)
  ownerLastName: string;

  @IsEmail()
  ownerEmail: string;

  @IsString()
  @MinLength(8)
  ownerPassword: string;
}
