import {
  Column, CreateDateColumn, Entity, JoinColumn,
  ManyToOne, OneToMany, PrimaryGeneratedColumn, UpdateDateColumn,
} from 'typeorm';
import { PaymentType } from '../enums/payment-type.enum';
import { PurchaseStatus } from '../enums/purchase-status.enum';
import { PurchaseInvoiceItem } from './purchase-invoice-item.entity';
import { Egreso } from './egreso.entity';

@Entity('purchase_invoices')
export class PurchaseInvoice {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'uuid' })
  thirdPartyId: string;

  @Column({ type: 'varchar', length: 100 })
  invoiceNumber: string;

  @Column({ type: 'date' })
  invoiceDate: Date;

  @Column({ type: 'date', nullable: true })
  dueDate: Date | null;

  @Column({ type: 'enum', enum: PaymentType })
  paymentType: PaymentType;

  @Column({ type: 'enum', enum: PurchaseStatus, default: PurchaseStatus.PENDING })
  status: PurchaseStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  subtotal: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  taxAmount: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  total: number;

  @Column({ type: 'text', nullable: true })
  notes: string | null;

  @OneToMany(() => PurchaseInvoiceItem, (item) => item.invoice, { cascade: true })
  items: PurchaseInvoiceItem[];

  @OneToMany(() => Egreso, (egreso) => egreso.invoice)
  payments: Egreso[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
