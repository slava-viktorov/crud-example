import { User } from './entities/user.entity';

export const USERS_REPOSITORY = 'USERS_REPOSITORY';

export interface IUsersRepository {
  create(data: {
    email: string;
    username: string;
    passwordHash: string;
    source?: string;
  }): Promise<User>;
  findByEmail(email: string): Promise<User | null>;
  findByEmailOrUsername(email: string, username: string): Promise<User | null>;
  findById(id: string): Promise<User | null>;
  findAllBySource(source: string): Promise<User[]>;
  deleteById(id: string): Promise<number>;
}
