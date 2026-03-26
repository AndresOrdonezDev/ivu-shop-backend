import { IsInt, IsOptional, IsString, IsUUID } from 'class-validator';

export class AdjustInventoryDto {
  @IsUUID()
  productId: string;

  @IsInt()
  quantity: number; // positivo = entrada, negativo = salida

  @IsString()
  @IsOptional()
  note?: string;
}
