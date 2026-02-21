import { MigrationInterface, QueryRunner } from "typeorm";

export class CompleteSchema1771651086574 implements MigrationInterface {
    name = 'CompleteSchema1771651086574'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "name"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isVerified"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verificationToken"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "verificationTokenExpiry"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetPasswordToken"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "resetPasswordTokenExpiry"`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "currency" character varying(10) NOT NULL DEFAULT 'COP'`);
        await queryRunner.query(`CREATE TYPE "public"."plans_billingcycle_enum" AS ENUM('monthly', 'yearly')`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "billingCycle" "public"."plans_billingcycle_enum" NOT NULL DEFAULT 'monthly'`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "maxProducts" integer NOT NULL DEFAULT '100'`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "features" jsonb NOT NULL DEFAULT '[]'`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "isPublic" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "plans" ADD "sortOrder" integer NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "trialStartDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "trialEndDate" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "cancelledAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "cancelReason" text`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "autoRenew" boolean NOT NULL DEFAULT true`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ADD "metadata" jsonb`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "ownerName" character varying(200) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "email" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD CONSTRAINT "UQ_155c343439adc83ada6ee3f48be" UNIQUE ("email")`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "phone" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "address" text`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "city" character varying(100)`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "country" character varying(100) NOT NULL DEFAULT 'Colombia'`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "logoUrl" character varying`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "isEmailVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "tenants" ADD "trialEndsAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "firstName" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastName" character varying(100) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "users" ADD "phone" character varying(20)`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isEmailVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emailVerificationToken" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "emailVerificationTokenExpiresAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetToken" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "passwordResetTokenExpiresAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "lastLoginAt" TIMESTAMP`);
        await queryRunner.query(`ALTER TYPE "public"."subscriptions_status_enum" RENAME TO "subscriptions_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum" AS ENUM('trial', 'active', 'past_due', 'cancelled', 'expired')`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" TYPE "public"."subscriptions_status_enum" USING "status"::"text"::"public"."subscriptions_status_enum"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'trial'`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum_old"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum" RENAME TO "users_role_enum_old"`);
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum" AS ENUM('owner', 'admin', 'employee')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum" USING "role"::"text"::"public"."users_role_enum"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'employee'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."users_role_enum_old" AS ENUM('USER', 'ADMIN')`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" TYPE "public"."users_role_enum_old" USING "role"::"text"::"public"."users_role_enum_old"`);
        await queryRunner.query(`ALTER TABLE "users" ALTER COLUMN "role" SET DEFAULT 'USER'`);
        await queryRunner.query(`DROP TYPE "public"."users_role_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."users_role_enum_old" RENAME TO "users_role_enum"`);
        await queryRunner.query(`CREATE TYPE "public"."subscriptions_status_enum_old" AS ENUM('active', 'inactive', 'trial')`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" TYPE "public"."subscriptions_status_enum_old" USING "status"::"text"::"public"."subscriptions_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" ALTER COLUMN "status" SET DEFAULT 'trial'`);
        await queryRunner.query(`DROP TYPE "public"."subscriptions_status_enum"`);
        await queryRunner.query(`ALTER TYPE "public"."subscriptions_status_enum_old" RENAME TO "subscriptions_status_enum"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastLoginAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordResetTokenExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "passwordResetToken"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerificationTokenExpiresAt"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "emailVerificationToken"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "isEmailVerified"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "lastName"`);
        await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "firstName"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "trialEndsAt"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "isEmailVerified"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "logoUrl"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "country"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "city"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "address"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "phone"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP CONSTRAINT "UQ_155c343439adc83ada6ee3f48be"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "email"`);
        await queryRunner.query(`ALTER TABLE "tenants" DROP COLUMN "ownerName"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "metadata"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "autoRenew"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "cancelReason"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "cancelledAt"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "trialEndDate"`);
        await queryRunner.query(`ALTER TABLE "subscriptions" DROP COLUMN "trialStartDate"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "sortOrder"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "isPublic"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "features"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "maxProducts"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "billingCycle"`);
        await queryRunner.query(`DROP TYPE "public"."plans_billingcycle_enum"`);
        await queryRunner.query(`ALTER TABLE "plans" DROP COLUMN "currency"`);
        await queryRunner.query(`ALTER TABLE "users" ADD "resetPasswordTokenExpiry" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "resetPasswordToken" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "verificationTokenExpiry" TIMESTAMP`);
        await queryRunner.query(`ALTER TABLE "users" ADD "verificationToken" character varying`);
        await queryRunner.query(`ALTER TABLE "users" ADD "isVerified" boolean NOT NULL DEFAULT false`);
        await queryRunner.query(`ALTER TABLE "users" ADD "name" character varying(100) NOT NULL`);
    }

}
