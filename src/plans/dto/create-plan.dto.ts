import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { BillingCycle } from '../../common/enums/billing-cycle.enum';

export class CreatePlanDto {
  @ApiProperty({ description: 'Nombre del plan', example: 'Pro' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Descripción del plan',
    example: 'Ideal para negocios en crecimiento con múltiples empleados.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({ description: 'Precio del plan en la moneda indicada', example: 99000 })
  @IsNumber()
  @Min(0)
  price: number;

  @ApiPropertyOptional({ description: 'Moneda del precio (ISO 4217)', example: 'COP' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Ciclo de facturación',
    enum: BillingCycle,
    example: BillingCycle.MONTHLY,
  })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiProperty({ description: 'Número máximo de usuarios permitidos en el tenant', example: 5 })
  @IsInt()
  @Min(1)
  maxUsers: number;

  @ApiPropertyOptional({
    description: 'Número máximo de productos/items (-1 para ilimitado)',
    example: 500,
  })
  @IsInt()
  @Min(-1)
  @IsOptional()
  maxProducts?: number;

  @ApiPropertyOptional({
    description: 'Lista de características incluidas en el plan',
    example: ['Hasta 5 usuarios', 'Reportes avanzados', 'Soporte prioritario'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ description: 'Plan activo y disponible', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Visible en la página de precios pública',
    example: true,
  })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({
    description: 'Orden de presentación en la UI (menor número = primero)',
    example: 2,
  })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
