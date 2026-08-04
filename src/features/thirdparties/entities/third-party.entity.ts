import {
  Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';

@Entity('third_parties')
export class ThirdParty {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  documentId: string | null;

  @Column({ type: 'varchar', length: 100 })
  firstName: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  lastName: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  contact: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  email: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  department: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  city: string | null;

  @Column({ type: 'text', nullable: true })
  address: string | null;

  @Column({ type: 'boolean', default: false })
  isSupplier: boolean;

  @Column({ type: 'int', nullable: true })
  supplierCreditDays: number | null;

  @Column({ type: 'boolean', default: false })
  isCustomer: boolean;

  @Column({ type: 'boolean', default: false })
  customerCreditAuthorized: boolean;

  @Column({ type: 'int', nullable: true })
  customerCreditDays: number | null;

  @Column({ type: 'decimal', precision: 12, scale: 2, nullable: true })
  customerCreditLimit: number | null;

  @Column({ type: 'boolean', default: false })
  invoiceAtCost: boolean;

  @Column({ type: 'boolean', default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
