import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Post,
  Query,
  Res,
  UseGuards,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
  ApiUnauthorizedResponse,
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiForbiddenResponse,
  ApiQuery,
} from '@nestjs/swagger';
import type { Response } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto } from './dto/register.dto';
import { LoginDto } from './dto/login.dto';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AuthGuard } from '@nestjs/passport';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { User } from '../users/entities/user.entity';
import { JwtPayload } from './types/jwt-payload.type';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @ApiOperation({ summary: 'Registrar un nuevo usuario standalone' })
  @ApiCreatedResponse({ description: 'Usuario creado. Se envía email de verificación.' })
  @ApiBadRequestResponse({ description: 'Email ya en uso o datos inválidos.' })
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Get('verify-email')
  @ApiOperation({ summary: 'Verificar correo electrónico con token' })
  @ApiQuery({ name: 'token', description: 'Token recibido por email', type: String })
  @ApiOkResponse({ description: 'Email verificado correctamente.' })
  @ApiBadRequestResponse({ description: 'Token inválido o expirado.' })
  verifyEmail(@Query('token') token: string) {
    return this.authService.verifyEmail(token);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Iniciar sesión y obtener JWT' })
  @ApiOkResponse({ description: 'Login exitoso. Retorna accessToken. Setea cookie refresh_token.' })
  @ApiUnauthorizedResponse({ description: 'Credenciales inválidas o usuario inactivo.' })
  @ApiForbiddenResponse({ description: 'Email no verificado.' })
  login(@Body() dto: LoginDto, @Res({ passthrough: true }) res: Response) {
    return this.authService.login(dto, res);
  }

  @UseGuards(AuthGuard('jwt-refresh'))
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Renovar access token usando refresh token (cookie)' })
  @ApiOkResponse({ description: 'Nuevo accessToken generado.' })
  @ApiUnauthorizedResponse({ description: 'Refresh token inválido o expirado.' })
  @ApiForbiddenResponse({ description: 'Reuso de refresh token detectado.' })
  refresh(
    @CurrentUser() user: JwtPayload & { refreshToken: string },
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.refresh(user.sub, user.refreshToken, res);
  }

  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Solicitar email de restablecimiento de contraseña' })
  @ApiOkResponse({ description: 'Si el email existe, se envía un enlace de recuperación.' })
  forgotPassword(@Body() dto: ForgotPasswordDto) {
    return this.authService.forgotPassword(dto.email);
  }

  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Restablecer contraseña con token de recuperación' })
  @ApiOkResponse({ description: 'Contraseña actualizada. Sesiones anteriores invalidadas.' })
  @ApiBadRequestResponse({ description: 'Token inválido o expirado.' })
  resetPassword(@Body() dto: ResetPasswordDto) {
    return this.authService.resetPassword(dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('access-token')
  @ApiOperation({ summary: 'Cerrar sesión e invalidar tokens' })
  @ApiOkResponse({ description: 'Sesión cerrada. Cookie eliminada.' })
  @ApiUnauthorizedResponse({ description: 'Token inválido o expirado.' })
  logout(
    @CurrentUser() user: User,
    @Res({ passthrough: true }) res: Response,
  ) {
    return this.authService.logout(user.id, res);
  }
}
