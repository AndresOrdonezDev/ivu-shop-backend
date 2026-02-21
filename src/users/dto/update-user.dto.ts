import {
  IsBoolean,
  IsEnum,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';
import { ApiPropertyOptional } from '@nestjs/swagger';
import { Role } from '../../common/enums/role.enum';

export class UpdateUserDto {
  @ApiPropertyOptional({ description: 'Nombre del usuario', example: 'María' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  firstName?: string;

  @ApiPropertyOptional({ description: 'Apellido del usuario', example: 'López' })
  @IsString()
  @MaxLength(100)
  @IsOptional()
  lastName?: string;

  @ApiPropertyOptional({ description: 'Número de teléfono', example: '3009876543' })
  @IsString()
  @IsOptional()
  @MaxLength(20)
  phone?: string;

  @ApiPropertyOptional({
    description: 'Rol del usuario dentro del tenant',
    enum: Role,
    example: Role.EMPLOYEE,
  })
  @IsEnum(Role)
  @IsOptional()
  role?: Role;

  @ApiPropertyOptional({ description: 'Estado activo/inactivo del usuario', example: true })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;
}
