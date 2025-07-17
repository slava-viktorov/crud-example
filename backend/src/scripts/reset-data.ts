import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { UsersService } from '../users/users.service';
import { ItemsService } from '../items/items.service';
import { AuthService } from '../auth/auth.service';
import { ItemResponseDto } from '../items/dto/item-response.dto';
import { PaginatedResponseDto } from '../common/dto/paginated-response.dto';
import { INestApplicationContext } from '@nestjs/common';

interface AppServices {
  app: INestApplicationContext;
  usersService: UsersService;
  itemsService: ItemsService;
  authService: AuthService;
}

// Хелпер для загрузки всех данных с пагинацией
async function loadAllPaginatedData<T>(
  fetchFunction: (page: number, limit: number) => Promise<PaginatedResponseDto<T>>,
  limit: number = 1000
): Promise<T[]> {
  const allData: T[] = [];
  let page = 1;
  let hasMoreData = true;
  
  while (hasMoreData) {
    const response = await fetchFunction(page, limit);
    
    if (response.data.length === 0) {
      hasMoreData = false;
      break;
    }
    
    allData.push(...response.data);
    page += 1;
  }
  
  return allData;
}

async function getAppAndServices(): Promise<AppServices> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const usersService = app.get(UsersService);
  const itemsService = app.get(ItemsService);
  const authService = app.get(AuthService);
  return { app, usersService, itemsService, authService };
}

export async function resetData(): Promise<void> {
  const logger = new Logger('ResetData');
  let app: INestApplicationContext | undefined;

  try {
    const services = await getAppAndServices();
    app = services.app;
    const { usersService, itemsService } = services;

    logger.log('Удаляем все тестовые данные...');

    // Получаем пользователей с source = 'seed'
    const seedUsers = await usersService.findAllBySource('seed');
    logger.log(`Найдено ${seedUsers.length} пользователей с source = 'seed'`);

    let deletedItems = 0;

    const itemsToDelete: ItemResponseDto[] = [];
    
    for (const user of seedUsers) {
      const userItems = await loadAllPaginatedData<ItemResponseDto>(
        (page, limit) => itemsService.findAllByAuthorId(user.id, { page, limit })
      );
      itemsToDelete.push(...userItems);
    }

    for (const item of itemsToDelete) {
      await itemsService.remove(item.id);
      deletedItems += 1;
    }

    logger.log(`Удалено ${deletedItems} элементов`);

    let deletedUsers = 0;
    for (const user of seedUsers) {
      const deleted = await usersService.deleteById(user.id);
      if (deleted > 0) {
        deletedUsers += 1;
      }
    }
    logger.log(`Удалено ${deletedUsers} пользователей`);

    logger.log('Все тестовые данные успешно удалены!');
  } catch (error) {
    logger.error('Ошибка при удалении тестовых данных:', error);
    throw error;
  } finally {
    if (app) await app.close();
  }
}

// CLI запуск
if (require.main === module) {
  void resetData();
} 