import { Request } from 'express';
import { DataSource } from 'typeorm';
import { User } from '../../users/entities/user.entity';

export interface TenantRequest extends Request {
  user?: User;
  tenantConnection?: DataSource;
}
