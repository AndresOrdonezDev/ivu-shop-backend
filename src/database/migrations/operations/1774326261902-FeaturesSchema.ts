import { MigrationInterface, QueryRunner } from "typeorm";

export class FeaturesSchema1774326261902 implements MigrationInterface {
    name = 'FeaturesSchema1774326261902'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "suppliers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(200) NOT NULL, "phone" character varying(20), "email" character varying(255), "address" text, "notes" text, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sale_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "saleId" uuid NOT NULL, "productId" uuid NOT NULL, "quantity" integer NOT NULL, "unitPrice" numeric(12,2) NOT NULL, "costAtSale" numeric(12,2) NOT NULL DEFAULT '0', "taxPercent" integer NOT NULL DEFAULT '0', "discount" numeric(12,2) NOT NULL DEFAULT '0', "subtotal" numeric(12,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a7dc5b4562a9e590528b3e08ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."sales_paymenttype_enum" AS ENUM('CASH', 'CARD', 'TRANSFER', 'CREDIT')`);
        await queryRunner.query(`CREATE TYPE "public"."sales_status_enum" AS ENUM('COMPLETED', 'CANCELLED', 'PENDING')`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "customerId" uuid, "userId" uuid NOT NULL, "saleDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "paymentType" "public"."sales_paymenttype_enum" NOT NULL, "status" "public"."sales_status_enum" NOT NULL DEFAULT 'COMPLETED', "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "taxAmount" numeric(12,2) NOT NULL DEFAULT '0', "discount" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(100) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7069dac60d88408eca56fdc9e0c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_barcodes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "productId" uuid NOT NULL, "barcode" character varying(100) NOT NULL, CONSTRAINT "PK_459d7d53aebb732e6c8460247d6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9ea55c8ac9dab9e48ea5c0b206" ON "product_barcodes" ("tenantId", "barcode") `);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(200) NOT NULL, "description" text, "price" numeric(10,2) NOT NULL, "cost" numeric(10,2) NOT NULL DEFAULT '0', "tax" integer NOT NULL DEFAULT '0', "stock" integer NOT NULL DEFAULT '0', "minStock" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "purchase_invoice_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "invoiceId" uuid NOT NULL, "productId" uuid NOT NULL, "quantity" integer NOT NULL, "unitCost" numeric(10,2) NOT NULL, "taxPercent" integer NOT NULL DEFAULT '0', "subtotal" numeric(10,2) NOT NULL, CONSTRAINT "PK_58ee6edea797913186eb5f3b329" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."purchase_invoices_paymenttype_enum" AS ENUM('CASH', 'CREDIT')`);
        await queryRunner.query(`CREATE TYPE "public"."purchase_invoices_status_enum" AS ENUM('PENDING', 'PAID', 'PARTIAL')`);
        await queryRunner.query(`CREATE TABLE "purchase_invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "supplierId" uuid NOT NULL, "invoiceNumber" character varying(100) NOT NULL, "invoiceDate" date NOT NULL, "dueDate" date, "paymentType" "public"."purchase_invoices_paymenttype_enum" NOT NULL, "status" "public"."purchase_invoices_status_enum" NOT NULL DEFAULT 'PENDING', "subtotal" numeric(10,2) NOT NULL DEFAULT '0', "taxAmount" numeric(10,2) NOT NULL DEFAULT '0', "total" numeric(10,2) NOT NULL DEFAULT '0', "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_efa8a22a9bf7685952deba65c30" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."inventory_movements_type_enum" AS ENUM('INITIAL', 'ENTRY', 'EXIT', 'ADJUSTMENT', 'SALE', 'RETURN')`);
        await queryRunner.query(`CREATE TYPE "public"."inventory_movements_referencetype_enum" AS ENUM('PURCHASE', 'SALE', 'MANUAL')`);
        await queryRunner.query(`CREATE TABLE "inventory_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "productId" uuid NOT NULL, "type" "public"."inventory_movements_type_enum" NOT NULL, "quantity" integer NOT NULL, "costAtMovement" numeric(10,2) NOT NULL DEFAULT '0', "referenceType" "public"."inventory_movements_referencetype_enum", "referenceId" uuid, "note" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d7597827c1dcffae889db3ab873" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."expenses_paymenttype_enum" AS ENUM('CASH', 'CARD', 'TRANSFER')`);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "categoryId" uuid, "userId" uuid NOT NULL, "description" character varying(255) NOT NULL, "amount" numeric(12,2) NOT NULL, "expenseDate" date NOT NULL, "paymentType" "public"."expenses_paymenttype_enum" NOT NULL, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "expense_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(100) NOT NULL, CONSTRAINT "PK_d0ef31e189d9523461215b62775" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "customers" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(200) NOT NULL, "documentId" character varying(50), "phone" character varying(20), "email" character varying(255), "address" text, "notes" text, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_133ec679a801fab5e070f73d3ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_category_rel" ("productId" uuid NOT NULL, "categoryId" uuid NOT NULL, CONSTRAINT "PK_36e255f4e3c1c0084c7c22a08cd" PRIMARY KEY ("productId", "categoryId"))`);
        await queryRunner.query(`CREATE INDEX "IDX_8fdd0a998ec54fb0e7757ba0bf" ON "product_category_rel" ("productId") `);
        await queryRunner.query(`CREATE INDEX "IDX_281bb986e1dae94eba56afafd3" ON "product_category_rel" ("categoryId") `);
        await queryRunner.query(`ALTER TABLE "sale_items" ADD CONSTRAINT "FK_c642be08de5235317d4cf3deb40" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_barcodes" ADD CONSTRAINT "FK_258b80cebb40fb6ac0f54126959" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "FK_aa15b27c707f20842b187791631" FOREIGN KEY ("invoiceId") REFERENCES "purchase_invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "FK_8e6dffac8199b07fee7a2383fcd" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_05715a7ea47e49653f164c0dd8c" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_category_rel" ADD CONSTRAINT "FK_8fdd0a998ec54fb0e7757ba0bf4" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE CASCADE`);
        await queryRunner.query(`ALTER TABLE "product_category_rel" ADD CONSTRAINT "FK_281bb986e1dae94eba56afafd38" FOREIGN KEY ("categoryId") REFERENCES "product_categories"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "product_category_rel" DROP CONSTRAINT "FK_281bb986e1dae94eba56afafd38"`);
        await queryRunner.query(`ALTER TABLE "product_category_rel" DROP CONSTRAINT "FK_8fdd0a998ec54fb0e7757ba0bf4"`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_05715a7ea47e49653f164c0dd8c"`);
        await queryRunner.query(`ALTER TABLE "purchase_invoice_items" DROP CONSTRAINT "FK_8e6dffac8199b07fee7a2383fcd"`);
        await queryRunner.query(`ALTER TABLE "purchase_invoice_items" DROP CONSTRAINT "FK_aa15b27c707f20842b187791631"`);
        await queryRunner.query(`ALTER TABLE "product_barcodes" DROP CONSTRAINT "FK_258b80cebb40fb6ac0f54126959"`);
        await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT "FK_c642be08de5235317d4cf3deb40"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_281bb986e1dae94eba56afafd3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8fdd0a998ec54fb0e7757ba0bf"`);
        await queryRunner.query(`DROP TABLE "product_category_rel"`);
        await queryRunner.query(`DROP TABLE "customers"`);
        await queryRunner.query(`DROP TABLE "expense_categories"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
        await queryRunner.query(`DROP TYPE "public"."expenses_paymenttype_enum"`);
        await queryRunner.query(`DROP TABLE "inventory_movements"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_movements_referencetype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_movements_type_enum"`);
        await queryRunner.query(`DROP TABLE "purchase_invoices"`);
        await queryRunner.query(`DROP TYPE "public"."purchase_invoices_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."purchase_invoices_paymenttype_enum"`);
        await queryRunner.query(`DROP TABLE "purchase_invoice_items"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9ea55c8ac9dab9e48ea5c0b206"`);
        await queryRunner.query(`DROP TABLE "product_barcodes"`);
        await queryRunner.query(`DROP TABLE "product_categories"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`DROP TYPE "public"."sales_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sales_paymenttype_enum"`);
        await queryRunner.query(`DROP TABLE "sale_items"`);
        await queryRunner.query(`DROP TABLE "suppliers"`);
    }

}
