import 'reflect-metadata';
import * as dotenv from 'dotenv';
import * as bcrypt from 'bcrypt';
import { DataSource } from 'typeorm';

dotenv.config();

// ─── DataSource ───────────────────────────────────────────────────────────────

const AppDataSource = new DataSource({
  type: 'postgres',
  host: process.env.SHARED_DB_HOST,
  port: Number(process.env.SHARED_DB_PORT),
  username: process.env.SHARED_DB_USERNAME,
  password: process.env.SHARED_DB_PASSWORD,
  database: process.env.SHARED_DB_NAME,
  entities: ['src/**/*.entity.ts'],
  synchronize: false,
});

// ─── Main ─────────────────────────────────────────────────────────────────────

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Database connected');

  await seedPlans();
  await seedDevTenant();

  await AppDataSource.destroy();
  console.log('✅ Seed completed');
}

// ─── Plans ────────────────────────────────────────────────────────────────────

async function seedPlans() {
  const planRepo = AppDataSource.getRepository('plans');

  const plans = [
    {
      name: 'Basic',
      description: 'Plan gratuito de prueba para empezar a conocer la plataforma.',
      price: 0,
      currency: 'COP',
      billingCycle: 'monthly',
      maxUsers: 1,
      maxProducts: 50,
      features: ['1 usuario', 'Hasta 50 productos', 'Soporte por email'],
      isActive: true,
      isPublic: true,
      sortOrder: 1,
    },
    {
      name: 'Pro',
      description: 'Ideal para negocios en crecimiento con múltiples empleados.',
      price: 99000,
      currency: 'COP',
      billingCycle: 'monthly',
      maxUsers: 5,
      maxProducts: 500,
      features: [
        'Hasta 5 usuarios',
        'Hasta 500 productos',
        'Reportes avanzados',
        'Soporte prioritario',
      ],
      isActive: true,
      isPublic: true,
      sortOrder: 2,
    },
    {
      name: 'Enterprise',
      description: 'Para negocios consolidados que necesitan escala total.',
      price: 199000,
      currency: 'COP',
      billingCycle: 'monthly',
      maxUsers: 20,
      maxProducts: -1,
      features: [
        'Hasta 20 usuarios',
        'Productos ilimitados',
        'Reportes avanzados',
        'Soporte 24/7',
        'Integraciones API',
        'Gestor de cuenta dedicado',
      ],
      isActive: true,
      isPublic: true,
      sortOrder: 3,
    },
  ];

  for (const plan of plans) {
    const existing = await planRepo.findOne({ where: { name: plan.name } });
    if (existing) {
      console.log(`  ⏭  Plan "${plan.name}" ya existe, omitiendo`);
      continue;
    }
    await planRepo.save(plan);
    console.log(`  ✅ Plan "${plan.name}" creado`);
  }
}

// ─── Dev Tenant ───────────────────────────────────────────────────────────────

async function seedDevTenant() {
  const tenantRepo  = AppDataSource.getRepository('tenants');
  const userRepo    = AppDataSource.getRepository('users');
  const subRepo     = AppDataSource.getRepository('subscriptions');
  const planRepo    = AppDataSource.getRepository('plans');

  // ── Platform admin tenant ──
  const platformSlug = 'platform-admin';
  let platformTenant = await tenantRepo.findOne({ where: { slug: platformSlug } });
  if (!platformTenant) {
    platformTenant = await tenantRepo.save({
      name: 'Platform Admin',
      slug: platformSlug,
      businessType: 'minimarket',
      ownerName: 'Admin',
      email: 'admin@platform.com',
      country: 'Colombia',
      isActive: true,
      isEmailVerified: true,
    });
    console.log('  ✅ Tenant plataforma creado');
  } else {
    console.log('  ⏭  Tenant plataforma ya existe, omitiendo');
  }

  // ── Platform admin user ──
  const adminEmail = 'admin@ivu.shop';
  let adminUser = await userRepo.findOne({ where: { email: adminEmail } });
  if (!adminUser) {
    const adminPassword = await bcrypt.hash('Andres93.', 12);
    await userRepo.save({
      tenantId: platformTenant.id,
      email: adminEmail,
      password: adminPassword,
      firstName: 'Platform',
      lastName: 'Admin',
      role: 'admin',
      isActive: true,
      isEmailVerified: true,
    });
    console.log(`  ✅ Admin creado: ${adminEmail} / Admin1234!`);
  } else {
    console.log('  ⏭  Admin ya existe, omitiendo');
  }

  // ── Dev test tenant ──
  const devSlug = 'bar-el-patio-dev';
  let devTenant = await tenantRepo.findOne({ where: { slug: devSlug } });
  if (!devTenant) {
    const now = new Date();
    devTenant = await tenantRepo.save({
      name: 'Bar El Patio Dev',
      slug: devSlug,
      businessType: 'bar',
      ownerName: 'Juan García',
      email: 'contacto@barpatio.dev',
      phone: '3001234567',
      address: 'Calle 45 # 12-34',
      city: 'Medellín',
      country: 'Colombia',
      isActive: true,
      isEmailVerified: true,
      trialEndsAt: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000),
    });
    console.log('  ✅ Tenant de desarrollo creado');

    // Owner del tenant de prueba
    const ownerPassword = await bcrypt.hash('Owner1234!', 12);
    const devOwner = await userRepo.save({
      tenantId: devTenant.id,
      email: 'owner@barpatio.dev',
      password: ownerPassword,
      firstName: 'Juan',
      lastName: 'García',
      role: 'owner',
      isActive: true,
      isEmailVerified: true,
    });
    console.log(`  ✅ Owner creado: owner@barpatio.dev / Owner1234!`);

    // Suscripción activa en el plan Pro
    const proPlan = await planRepo.findOne({ where: { name: 'Pro' } });
    if (proPlan) {
      await subRepo.save({
        tenantId: devTenant.id,
        planId: proPlan.id,
        status: 'active',
        startDate: new Date(),
        autoRenew: true,
      });
      console.log('  ✅ Suscripción Pro activa creada');
    }
  } else {
    console.log('  ⏭  Tenant de desarrollo ya existe, omitiendo');
  }
}

// ─── Run ──────────────────────────────────────────────────────────────────────

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
