import { IsString, MinLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ResetPasswordDto {
  @ApiProperty({
    description: 'Token de restablecimiento recibido por email',
    example: 'a3f8e1d2c4b5...',
  })
  @IsString()
  token: string;

  @ApiProperty({ description: 'Nueva contraseña (mínimo 8 caracteres)', example: 'NuevaPass123!' })
  @IsString()
  @MinLength(8)
  password: string;
}
