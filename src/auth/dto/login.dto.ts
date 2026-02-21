import { IsEmail, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class LoginDto {
  @ApiProperty({ description: 'Correo electrónico registrado', example: 'owner@barpatio.dev' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña del usuario', example: 'Owner1234!' })
  @IsString()
  password: string;
}
