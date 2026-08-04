import {
  Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn,
} from 'typeorm';
import { PurchaseInvoice } from './purchase-invoice.entity';
import { EgresoPaymentMethod } from '../enums/egreso-payment-method.enum';

@Entity('egresos')
export class Egreso {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  tenantId: string;

  @Column({ type: 'int' })
  consecutivo: number;

  @Column({ type: 'date' })
  fecha: Date;

  @Column({ type: 'uuid' })
  thirdPartyId: string;

  @Column({ type: 'uuid' })
  invoiceId: string;

  @Column({ type: 'decimal', precision: 12, scale: 2 })
  valorPagado: number;

  @Column({ type: 'enum', enum: EgresoPaymentMethod })
  formaPago: EgresoPaymentMethod;

  @Column({ type: 'decimal', precision: 12, scale: 2, default: 0 })
  valorDeduccion: number;

  @Column({ type: 'varchar', length: 255, nullable: true })
  conceptoDeduccion: string | null;

  @Column({ type: 'uuid' })
  elaboradoPor: string;

  @ManyToOne(() => PurchaseInvoice, (invoice) => invoice.payments)
  @JoinColumn({ name: 'invoiceId' })
  invoice: PurchaseInvoice;

  @CreateDateColumn()
  createdAt: Date;
}
