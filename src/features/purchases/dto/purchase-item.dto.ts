import { IsInt, IsNumber, IsOptional, IsUUID, Min } from 'class-validator';

export class PurchaseItemDto {
  @IsUUID()
  productId: string;

  @IsInt()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitCost: number;

  @IsInt()
  @Min(0)
  @IsOptional()
  taxPercent?: number;
}
