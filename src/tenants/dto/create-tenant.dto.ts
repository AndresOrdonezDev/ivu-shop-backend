import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BusinessType } from '../../common/enums/business-type.enum';

export class CreateTenantDto {
  // ─── Datos del negocio ──────────────────────────────────────────────────────

  @ApiProperty({ description: 'Nombre del negocio', example: 'Bar El Patio' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiProperty({
    description: 'Tipo de negocio',
    enum: BusinessType,
    example: BusinessType.BAR,
  })
  @IsEnum(BusinessType)
  businessType: BusinessType;

  @ApiProperty({ description: 'Nombre completo del dueño del negocio', example: 'Juan García' })
  @IsString()
  @MaxLength(200)
  ownerName: string;

  @ApiProperty({
    description: 'Email de contacto del negocio',
    example: 'contacto@barpatio.com',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto del negocio', example: '6041234567' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Dirección del negocio', example: 'Calle 45 # 12-34' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Ciudad donde opera el negocio', example: 'Medellín' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'País (por defecto Colombia)', example: 'Colombia' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  // ─── Credenciales del owner ─────────────────────────────────────────────────

  @ApiProperty({ description: 'Nombre del dueño (para la cuenta de acceso)', example: 'Juan' })
  @IsString()
  @MaxLength(100)
  ownerFirstName: string;

  @ApiProperty({ description: 'Apellido del dueño', example: 'García' })
  @IsString()
  @MaxLength(100)
  ownerLastName: string;

  @ApiProperty({
    description: 'Email del dueño (usado para iniciar sesión)',
    example: 'juan@barpatio.com',
  })
  @IsEmail()
  ownerEmail: string;

  @ApiProperty({ description: 'Contraseña del dueño (mínimo 8 caracteres)', example: 'Seguro123!' })
  @IsString()
  @MinLength(8)
  ownerPassword: string;
}
