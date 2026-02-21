import {
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

export class CreateUserDto {
  @ApiProperty({ description: 'Nombre del usuario', example: 'María' })
  @IsString()
  @MaxLength(100)
  firstName: string;

  @ApiProperty({ description: 'Apellido del usuario', example: 'López' })
  @IsString()
  @MaxLength(100)
  lastName: string;

  @ApiProperty({ description: 'Correo electrónico único', example: 'maria@empresa.com' })
  @IsEmail()
  email: string;

  @ApiProperty({ description: 'Contraseña (mínimo 8 caracteres)', example: 'Segura123!' })
  @IsString()
  @MinLength(8)
  password: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario dentro del tenant',
    enum: Role,
    example: Role.EMPLOYEE,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({ description: 'Número de teléfono', example: '3001234567' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;
}
