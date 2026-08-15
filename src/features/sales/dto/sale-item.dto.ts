import { IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class SaleItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  @IsOptional()
  discount?: number;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  unitPrice?: number;
}
