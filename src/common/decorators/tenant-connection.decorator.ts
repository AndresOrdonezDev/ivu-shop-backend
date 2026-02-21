import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { TenantRequest } from '../interfaces/tenant-request.interface';

export const TenantConnection = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): DataSource => {
    const request = ctx.switchToHttp().getRequest<TenantRequest>();
    return request.tenantConnection!;
  },
);
