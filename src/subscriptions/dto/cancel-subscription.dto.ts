import { IsOptional, IsString } from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class CancelSubscriptionDto {
  @ApiPropertyOptional({
    description: 'Razón de la cancelación',
    example: 'El plan no se ajusta a mis necesidades actuales.',
  })
  @IsString()
  @IsOptional()
  reason?: string;
}
