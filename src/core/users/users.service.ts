import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';
import { Role } from '../../common/enums/role.enum';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
  ) {}

  async findById(id: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { id } });
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.usersRepository.findOne({ where: { email } });
  }

  async findByEmailWithPassword(email: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.password')
      .where('user.email = :email', { email })
      .getOne();
  }

  async findByIdWithRefreshToken(id: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.refreshToken')
      .where('user.id = :id', { id })
      .getOne();
  }

  async findByEmailVerificationToken(token: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.emailVerificationToken')
      .where('user.emailVerificationToken = :token', { token })
      .getOne();
  }

  async findByPasswordResetToken(token: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.passwordResetToken')
      .where('user.passwordResetToken = :token', { token })
      .getOne();
  }

  async findByTenant(tenantId: string): Promise<User[]> {
    return this.usersRepository.find({
      where: { tenantId, isActive: true },
      order: { createdAt: 'ASC' },
    });
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async create(dto: CreateUserDto, tenantId: string): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    return this.usersRepository.save({
      ...dto,
      password: hashedPassword,
      tenantId,
      role: dto.role ?? Role.EMPLOYEE,
    });
  }

  async save(user: Partial<User>): Promise<User> {
    return this.usersRepository.save(user);
  }

  async update(id: string, partial: Partial<User>): Promise<void> {
    await this.usersRepository.update(id, partial);
  }

  async deactivate(id: string): Promise<void> {
    const user = await this.findById(id);
    if (!user) throw new NotFoundException(`User ${id} not found`);
    await this.usersRepository.update(id, { isActive: false });
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
