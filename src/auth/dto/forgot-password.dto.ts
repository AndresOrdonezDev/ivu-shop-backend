import { IsEmail } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ForgotPasswordDto {
  @ApiProperty({
    description: 'Correo del usuario para recibir el enlace de recuperación',
    example: 'juan@ejemplo.com',
  })
  @IsEmail()
  email: string;
}
