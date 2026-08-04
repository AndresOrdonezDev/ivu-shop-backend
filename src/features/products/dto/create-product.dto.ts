import {
  IsArray,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
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

  @IsNumber()
  @Min(0)
  price: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  tax?: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  cost?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  initialStock?: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  minStock?: number;

  @IsUUID()
  @IsOptional()
  lineId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  barcodes?: string[];
}
