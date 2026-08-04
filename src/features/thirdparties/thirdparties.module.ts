import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThirdParty } from './entities/third-party.entity';
import { ThirdpartiesService } from './thirdparties.service';
import { ThirdpartiesController } from './thirdparties.controller';

@Module({
  imports: [TypeOrmModule.forFeature([ThirdParty], 'operations')],
  controllers: [ThirdpartiesController],
  providers: [ThirdpartiesService],
  exports: [ThirdpartiesService],
})
export class ThirdpartiesModule {}
