import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import compression from 'compression';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const isDev = process.env.NODE_ENV !== 'production';

  // ─── Seguridad ────────────────────────────────────────────────────────────────
  // En dev se relaja CSP para que Swagger UI funcione correctamente
  app.use(
    helmet({
      contentSecurityPolicy: isDev ? false : undefined,
    }),
  );
  app.use(compression());
  app.use(cookieParser());

  // ─── CORS ─────────────────────────────────────────────────────────────────────
  app.enableCors({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:3001',
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  });

  // ─── Validación global ────────────────────────────────────────────────────────
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  app.setGlobalPrefix('api/v1');

  // ─── Swagger (solo fuera de producción) ───────────────────────────────────────
  if (isDev) {
    const config = new DocumentBuilder()
      .setTitle('IVU Shop API')
      .setDescription('API multi-tenant SaaS para pequeños negocios')
      .setVersion('1.0')
      .addTag('auth', 'Autenticación y gestión de sesiones')
      .addTag('tenants', 'Registro y gestión de negocios (tenants)')
      .addTag('users', 'Gestión de usuarios dentro de un tenant')
      .addTag('plans', 'Planes de suscripción disponibles')
      .addTag('subscriptions', 'Suscripciones de los tenants')
      .addBearerAuth(
        { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
        'access-token',
      )
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/docs', app, document, {
      swaggerOptions: {
        persistAuthorization: true,
      },
    });
  }

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
