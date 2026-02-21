import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './entities/user.entity';
import { CreateUserDto } from './dto/create-user.dto';

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

  async findByVerificationToken(token: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.verificationToken')
      .where('user.verificationToken = :token', { token })
      .getOne();
  }

  async findByResetPasswordToken(token: string): Promise<User | null> {
    return this.usersRepository
      .createQueryBuilder('user')
      .addSelect('user.resetPasswordToken')
      .where('user.resetPasswordToken = :token', { token })
      .getOne();
  }

  async findAll(): Promise<User[]> {
    return this.usersRepository.find();
  }

  async create(dto: CreateUserDto): Promise<User> {
    const existing = await this.findByEmail(dto.email);
    if (existing) {
      throw new ConflictException('Email already in use');
    }
    const hashedPassword = await bcrypt.hash(dto.password, 12);
    return this.usersRepository.save({ ...dto, password: hashedPassword });
  }

  async save(user: Partial<User>): Promise<User> {
    return this.usersRepository.save(user);
  }

  async update(id: string, partial: Partial<User>): Promise<void> {
    await this.usersRepository.update(id, partial);
  }

  async remove(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
