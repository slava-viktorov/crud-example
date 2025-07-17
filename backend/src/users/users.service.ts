import { Inject, Injectable } from '@nestjs/common';
import {
  IUsersRepository,
  USERS_REPOSITORY,
} from './users.repository.interface';
import { User } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @Inject(USERS_REPOSITORY)
    private readonly usersRepository: IUsersRepository,
  ) {}

  async create(data: {
    email: string;
    username: string;
    passwordHash: string;
    source?: string;
  }): Promise<User> {
    const user = await this.usersRepository.create(data);
    return user;
  }

  async findById(id: string): Promise<User | null> {
    const user = await this.usersRepository.findById(id);
    return user;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.usersRepository.findByEmail(email);
    return user;
  }

  async findByEmailOrUsername(email: string, username: string): Promise<User | null> {
    const user = await this.usersRepository.findByEmailOrUsername(email, username);
    return user;
  }

  async findAllBySource(source: string): Promise<User[]> {
    const users = await this.usersRepository.findAllBySource(source);
    return users;
  }

  async deleteById(id: string): Promise<number> {
    const result = await this.usersRepository.deleteById(id);
    return result;
  }
}
