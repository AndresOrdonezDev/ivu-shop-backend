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
import { ApiPropertyOptional } from '@nestjs/swagger';
import { BillingCycle } from '../../common/enums/billing-cycle.enum';

export class UpdatePlanDto {
  @ApiPropertyOptional({ description: 'Nombre del plan', example: 'Pro Plus' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Descripción del plan',
    example: 'Versión mejorada del plan Pro.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({ description: 'Precio del plan', example: 119000 })
  @IsNumber()
  @Min(0)
  @IsOptional()
  price?: number;

  @ApiPropertyOptional({ description: 'Moneda (ISO 4217)', example: 'COP' })
  @IsString()
  @IsOptional()
  @MaxLength(10)
  currency?: string;

  @ApiPropertyOptional({
    description: 'Ciclo de facturación',
    enum: BillingCycle,
    example: BillingCycle.YEARLY,
  })
  @IsEnum(BillingCycle)
  @IsOptional()
  billingCycle?: BillingCycle;

  @ApiPropertyOptional({ description: 'Número máximo de usuarios', example: 8 })
  @IsInt()
  @Min(1)
  @IsOptional()
  maxUsers?: number;

  @ApiPropertyOptional({
    description: 'Número máximo de productos (-1 para ilimitado)',
    example: 1000,
  })
  @IsInt()
  @Min(-1)
  @IsOptional()
  maxProducts?: number;

  @ApiPropertyOptional({
    description: 'Lista de características incluidas',
    example: ['Hasta 8 usuarios', 'Productos ilimitados'],
    type: [String],
  })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  features?: string[];

  @ApiPropertyOptional({ description: 'Plan activo', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: 'Visible en precios públicos', example: true })
  @IsBoolean()
  @IsOptional()
  isPublic?: boolean;

  @ApiPropertyOptional({ description: 'Orden de presentación en la UI', example: 2 })
  @IsInt()
  @IsOptional()
  sortOrder?: number;
}
