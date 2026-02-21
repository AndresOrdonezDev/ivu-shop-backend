import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class RegisterDto {
  @ApiProperty({ description: 'Nombre del usuario', example: 'Juan' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Apellido del usuario', example: 'García' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ description: 'Correo electrónico único', example: 'juan@ejemplo.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña (mínimo 8 caracteres)', example: 'MiPass123!' })
  @IsString()
  @MinLength(8)
  password: string;
}
