import { IsEnum } from 'class-validator';
import { PurchaseStatus } from '../enums/purchase-status.enum';

export class UpdatePurchaseStatusDto {
  @IsEnum(PurchaseStatus)
  status: PurchaseStatus;
}
