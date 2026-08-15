import { MigrationInterface, QueryRunner } from "typeorm";

export class FeaturesSchema1774326261902 implements MigrationInterface {
    name = 'FeaturesSchema1774326261902'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "third_parties" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "documentId" character varying(50), "firstName" character varying(100) NOT NULL, "lastName" character varying(100), "contact" character varying(50), "email" character varying(255), "department" character varying(100), "city" character varying(100), "address" text, "isSupplier" boolean NOT NULL DEFAULT false, "supplierCreditDays" integer, "isCustomer" boolean NOT NULL DEFAULT false, "customerCreditAuthorized" boolean NOT NULL DEFAULT false, "customerCreditDays" integer, "customerCreditLimit" numeric(12,2), "invoiceAtCost" boolean NOT NULL DEFAULT false, "isActive" boolean NOT NULL DEFAULT true, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_b70ac51766a9e3144f778cfe81e" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "sale_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "saleId" uuid NOT NULL, "productId" uuid NOT NULL, "quantity" integer NOT NULL, "unitPrice" numeric(12,2) NOT NULL, "costAtSale" numeric(12,2) NOT NULL DEFAULT '0', "taxPercent" integer NOT NULL DEFAULT '0', "discount" numeric(12,2) NOT NULL DEFAULT '0', "subtotal" numeric(12,2) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_5a7dc5b4562a9e590528b3e08ab" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."sales_paymenttype_enum" AS ENUM('CASH', 'CARD', 'TRANSFER', 'CREDIT')`);
        await queryRunner.query(`CREATE TYPE "public"."sales_status_enum" AS ENUM('COMPLETED', 'CANCELLED', 'PENDING')`);
        await queryRunner.query(`CREATE TABLE "sales" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "thirdPartyId" uuid, "userId" uuid NOT NULL, "saleDate" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(), "paymentType" "public"."sales_paymenttype_enum" NOT NULL, "status" "public"."sales_status_enum" NOT NULL DEFAULT 'COMPLETED', "subtotal" numeric(12,2) NOT NULL DEFAULT '0', "taxAmount" numeric(12,2) NOT NULL DEFAULT '0', "discount" numeric(12,2) NOT NULL DEFAULT '0', "total" numeric(12,2) NOT NULL DEFAULT '0', "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_4f0bc990ae81dba46da680895ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_lines" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(100) NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_7069dac60d88408eca56fdc9e0c" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "product_barcodes" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "productId" uuid NOT NULL, "barcode" character varying(100) NOT NULL, CONSTRAINT "PK_459d7d53aebb732e6c8460247d6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_9ea55c8ac9dab9e48ea5c0b206" ON "product_barcodes" ("tenantId", "barcode") `);
        await queryRunner.query(`CREATE TYPE "public"."products_type_enum" AS ENUM('PRODUCT', 'SERVICE')`);
        await queryRunner.query(`CREATE TABLE "products" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "type" "public"."products_type_enum" NOT NULL DEFAULT 'PRODUCT', "name" character varying(200) NOT NULL, "description" text, "refFabrica" character varying(100), "price" numeric(10,2) NOT NULL, "isVariablePrice" boolean NOT NULL DEFAULT false, "cost" numeric(10,2) NOT NULL DEFAULT '0', "averageCost" numeric(10,2) NOT NULL DEFAULT '0', "tax" integer NOT NULL DEFAULT '0', "stock" integer NOT NULL DEFAULT '0', "minStock" integer NOT NULL DEFAULT '0', "isActive" boolean NOT NULL DEFAULT true, "lineId" uuid, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_0806c755e0aca124e67c0cf6d7d" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "purchase_invoice_items" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "invoiceId" uuid NOT NULL, "productId" uuid NOT NULL, "quantity" integer NOT NULL, "unitCost" numeric(10,2) NOT NULL, "taxPercent" integer NOT NULL DEFAULT '0', "subtotal" numeric(10,2) NOT NULL, CONSTRAINT "PK_58ee6edea797913186eb5f3b329" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."purchase_invoices_paymenttype_enum" AS ENUM('CASH', 'CREDIT')`);
        await queryRunner.query(`CREATE TYPE "public"."purchase_invoices_status_enum" AS ENUM('PENDING', 'PAID', 'PARTIAL', 'CANCELLED')`);
        await queryRunner.query(`CREATE TABLE "purchase_invoices" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "thirdPartyId" uuid NOT NULL, "invoiceNumber" character varying(100) NOT NULL, "invoiceDate" date NOT NULL, "dueDate" date, "paymentType" "public"."purchase_invoices_paymenttype_enum" NOT NULL, "status" "public"."purchase_invoices_status_enum" NOT NULL DEFAULT 'PENDING', "subtotal" numeric(10,2) NOT NULL DEFAULT '0', "taxAmount" numeric(10,2) NOT NULL DEFAULT '0', "total" numeric(10,2) NOT NULL DEFAULT '0', "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_efa8a22a9bf7685952deba65c30" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."egresos_formapago_enum" AS ENUM('CASH', 'CARD', 'TRANSFER')`);
        await queryRunner.query(`CREATE TABLE "egresos" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "consecutivo" integer NOT NULL, "fecha" date NOT NULL, "thirdPartyId" uuid NOT NULL, "invoiceId" uuid NOT NULL, "valorPagado" numeric(12,2) NOT NULL, "formaPago" "public"."egresos_formapago_enum" NOT NULL, "valorDeduccion" numeric(12,2) NOT NULL DEFAULT '0', "conceptoDeduccion" character varying(255), "elaboradoPor" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_1a5da5c8b7e9c8b0e8f1a2b3c4d5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."inventory_movements_type_enum" AS ENUM('INITIAL', 'ENTRY', 'EXIT', 'ADJUSTMENT', 'SALE', 'RETURN')`);
        await queryRunner.query(`CREATE TYPE "public"."inventory_movements_referencetype_enum" AS ENUM('PURCHASE', 'SALE', 'MANUAL')`);
        await queryRunner.query(`CREATE TABLE "inventory_movements" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "productId" uuid NOT NULL, "type" "public"."inventory_movements_type_enum" NOT NULL, "quantity" integer NOT NULL, "costAtMovement" numeric(10,2) NOT NULL DEFAULT '0', "referenceType" "public"."inventory_movements_referencetype_enum", "referenceId" uuid, "note" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_d7597827c1dcffae889db3ab873" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TYPE "public"."expenses_paymenttype_enum" AS ENUM('CASH', 'CARD', 'TRANSFER')`);
        await queryRunner.query(`CREATE TABLE "expenses" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "categoryId" uuid, "userId" uuid NOT NULL, "description" character varying(255) NOT NULL, "amount" numeric(12,2) NOT NULL, "expenseDate" date NOT NULL, "paymentType" "public"."expenses_paymenttype_enum" NOT NULL, "notes" text, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_94c3ceb17e3140abc9282c20610" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "expense_categories" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "tenantId" uuid NOT NULL, "name" character varying(100) NOT NULL, CONSTRAINT "PK_d0ef31e189d9523461215b62775" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "sale_items" ADD CONSTRAINT "FK_c642be08de5235317d4cf3deb40" FOREIGN KEY ("saleId") REFERENCES "sales"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "product_barcodes" ADD CONSTRAINT "FK_258b80cebb40fb6ac0f54126959" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "products" ADD CONSTRAINT "FK_7d20de8d5a5c6b8b8b2c6e0c1a1" FOREIGN KEY ("lineId") REFERENCES "product_lines"("id") ON DELETE SET NULL ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "FK_aa15b27c707f20842b187791631" FOREIGN KEY ("invoiceId") REFERENCES "purchase_invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "purchase_invoice_items" ADD CONSTRAINT "FK_8e6dffac8199b07fee7a2383fcd" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "egresos" ADD CONSTRAINT "FK_2b6d8f4a1c3e5b7d9f0a1c2e3d4f" FOREIGN KEY ("invoiceId") REFERENCES "purchase_invoices"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "inventory_movements" ADD CONSTRAINT "FK_05715a7ea47e49653f164c0dd8c" FOREIGN KEY ("productId") REFERENCES "products"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "inventory_movements" DROP CONSTRAINT "FK_05715a7ea47e49653f164c0dd8c"`);
        await queryRunner.query(`ALTER TABLE "egresos" DROP CONSTRAINT "FK_2b6d8f4a1c3e5b7d9f0a1c2e3d4f"`);
        await queryRunner.query(`ALTER TABLE "purchase_invoice_items" DROP CONSTRAINT "FK_8e6dffac8199b07fee7a2383fcd"`);
        await queryRunner.query(`ALTER TABLE "purchase_invoice_items" DROP CONSTRAINT "FK_aa15b27c707f20842b187791631"`);
        await queryRunner.query(`ALTER TABLE "products" DROP CONSTRAINT "FK_7d20de8d5a5c6b8b8b2c6e0c1a1"`);
        await queryRunner.query(`ALTER TABLE "product_barcodes" DROP CONSTRAINT "FK_258b80cebb40fb6ac0f54126959"`);
        await queryRunner.query(`ALTER TABLE "sale_items" DROP CONSTRAINT "FK_c642be08de5235317d4cf3deb40"`);
        await queryRunner.query(`DROP TABLE "expense_categories"`);
        await queryRunner.query(`DROP TABLE "expenses"`);
        await queryRunner.query(`DROP TYPE "public"."expenses_paymenttype_enum"`);
        await queryRunner.query(`DROP TABLE "inventory_movements"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_movements_referencetype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."inventory_movements_type_enum"`);
        await queryRunner.query(`DROP TABLE "egresos"`);
        await queryRunner.query(`DROP TYPE "public"."egresos_formapago_enum"`);
        await queryRunner.query(`DROP TABLE "purchase_invoices"`);
        await queryRunner.query(`DROP TYPE "public"."purchase_invoices_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."purchase_invoices_paymenttype_enum"`);
        await queryRunner.query(`DROP TABLE "purchase_invoice_items"`);
        await queryRunner.query(`DROP TABLE "products"`);
        await queryRunner.query(`DROP TYPE "public"."products_type_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9ea55c8ac9dab9e48ea5c0b206"`);
        await queryRunner.query(`DROP TABLE "product_barcodes"`);
        await queryRunner.query(`DROP TABLE "product_lines"`);
        await queryRunner.query(`DROP TABLE "sales"`);
        await queryRunner.query(`DROP TYPE "public"."sales_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."sales_paymenttype_enum"`);
        await queryRunner.query(`DROP TABLE "sale_items"`);
        await queryRunner.query(`DROP TABLE "third_parties"`);
    }

}
