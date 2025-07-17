import { faker } from '@faker-js/faker/locale/ru';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { CreateItemDto } from '../items/dto/create-item.dto';

export type TestData = Record<'users' | 'items', CreateUserDto[] | CreateItemDto[]> & {
  users: CreateUserDto[];
  items: CreateItemDto[];
};

export function generateFakeUsers(count: number): CreateUserDto[] {
  return Array.from({ length: count }, () => ({
    email: faker.internet.email(),
    username: faker.internet.username(),
    password: faker.internet.password({ length: 8 }),
  }));
}

export function generateTypedItems(count: number): CreateItemDto[] {
  return Array.from({ length: count }, () => ({
    title: faker.lorem.sentence(),
    content: faker.lorem.paragraphs(2),
  }));
}

export function generateTestData(): TestData {
  return {
    users: generateFakeUsers(5),
    items: Array.from({ length: 15 }, () => ({
      title: faker.lorem.sentence(),
      content: faker.lorem.paragraphs(),
    })),
  };
} 