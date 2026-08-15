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

export class UpdateProductDto {
  @IsEnum(ProductType)
  @IsOptional()
  type?: ProductType;

  @IsString()
  @MaxLength(200)
  @IsOptional()
  name?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @MaxLength(100)
  @IsOptional()
  refFabrica?: string;

  @ValidateIf((o: UpdateProductDto) => o.price !== undefined)
  @IsNumber()
  @Min(0)
  price?: number;

  @ValidateIf((o: UpdateProductDto) => o.tax !== undefined)
  @IsInt()
  @Min(0)
  tax?: number;

  @ValidateIf((o: UpdateProductDto) => o.cost !== undefined)
  @IsNumber()
  @Min(0)
  cost?: number;

  @ValidateIf((o: UpdateProductDto) => o.minStock !== undefined)
  @IsInt()
  @Min(0)
  minStock?: number;

  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @IsBoolean()
  @IsOptional()
  isVariablePrice?: boolean;

  @ValidateIf((o: UpdateProductDto) => o.lineId !== undefined)
  @IsUUID()
  lineId?: string;

  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  barcodes?: string[];
}
