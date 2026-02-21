import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectDataSource } from '@nestjs/typeorm';
import { Observable } from 'rxjs';
import { DataSource } from 'typeorm';
import { TenantRequest } from '../interfaces/tenant-request.interface';

@Injectable()
export class TenantConnectionInterceptor implements NestInterceptor {
  constructor(
    @InjectDataSource('operations')
    private readonly operationsDataSource: DataSource,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<TenantRequest>();

    if (!request.user) {
      return next.handle();
    }

    if (!request.user.tenantId) {
      throw new UnauthorizedException('User does not belong to a tenant');
    }

    request.tenantConnection = this.operationsDataSource;
    return next.handle();
  }
}
