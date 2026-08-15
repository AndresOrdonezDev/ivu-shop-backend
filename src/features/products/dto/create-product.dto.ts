import {
  IsArray,
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
  ValidateIf,
} from 'class-validator';
import { ProductType } from '../enums/product-type.enum';

export class CreateProductDto {
  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @IsString()
  @MaxLength(200)
  name: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  refFabrica?: string;

  @ValidateIf((o: CreateProductDto) => !o.isVariablePrice)
  @IsNumber()
  @Min(0)
  price?: number;

  @IsBoolean()
  @IsOptional()
  isVariablePrice?: boolean;

  @ValidateIf((o: CreateProductDto) => o.tax !== undefined)
  @IsInt()
  @Min(0)
  tax?: number;

  @ValidateIf((o: CreateProductDto) => o.cost !== undefined)
  @IsNumber()
  @Min(0)
  cost?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  initialStock?: number;

  @ValidateIf((o: CreateProductDto) => o.minStock !== undefined)
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsUUID()
  lineId: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  barcodes?: string[];
}
