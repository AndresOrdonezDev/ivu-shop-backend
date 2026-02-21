import { IsBoolean, IsOptional, IsString, MaxLength } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class UpdateTenantDto {
  @ApiPropertyOptional({ description: 'Nombre del negocio', example: 'Bar El Patio Norte' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: 'Nombre completo del dueño', example: 'Juan García' })
  @IsString()
  @MaxLength(200)
  @IsOptional()
  ownerName?: string;

  @ApiPropertyOptional({ description: 'Teléfono de contacto', example: '6041234567' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({ description: 'Dirección del negocio', example: 'Carrera 80 # 45-12' })
  @IsString()
  @IsOptional()
  address?: string;

  @ApiPropertyOptional({ description: 'Ciudad', example: 'Bogotá' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({ description: 'País', example: 'Colombia' })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  country?: string;

  @ApiPropertyOptional({
    description: 'URL pública del logo del negocio',
    example: 'https://cdn.ivu.shop/logos/barpatio.png',
  })
  @IsString()
  @IsOptional()
  logoUrl?: string;

  @ApiPropertyOptional({ description: 'Activar o desactivar el tenant', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
