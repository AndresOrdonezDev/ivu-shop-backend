import {
  Body, Controller, Delete, Get, HttpCode, HttpStatus,
  Param, Patch, Post, Query, UseGuards,
} from '@nestjs/common';
import { ThirdpartiesService, ThirdPartyType } from './thirdparties.service';
import { CreateThirdPartyDto } from './dto/create-third-party.dto';
import { UpdateThirdPartyDto } from './dto/update-third-party.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { User } from '../../core/users/entities/user.entity';

@Controller('thirdparties')
@UseGuards(JwtAuthGuard)
export class ThirdpartiesController {
  constructor(private readonly thirdpartiesService: ThirdpartiesService) {}

  @Get()
  findAll(@Query('type') type: ThirdPartyType | undefined, @CurrentUser() user: User) {
    return this.thirdpartiesService.findAll(user.tenantId!, type);
  }

  @Get(':id')
  findOne(@Param('id') id: string, @CurrentUser() user: User) {
    return this.thirdpartiesService.findById(id, user.tenantId!);
  }

  @Post()
  create(@Body() dto: CreateThirdPartyDto, @CurrentUser() user: User) {
    return this.thirdpartiesService.create(dto, user.tenantId!);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateThirdPartyDto, @CurrentUser() user: User) {
    return this.thirdpartiesService.update(id, dto, user.tenantId!);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  deactivate(@Param('id') id: string, @CurrentUser() user: User) {
    return this.thirdpartiesService.deactivate(id, user.tenantId!);
  }
}
