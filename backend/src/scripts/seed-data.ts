import { NestFactory } from '@nestjs/core';
import { Logger } from '@nestjs/common';
import { AppModule } from '../app.module';
import { AuthService } from '../auth/auth.service';
import { ItemsService } from '../items/items.service';
import { generateTestData } from './fake-data-generator';
import { INestApplicationContext } from '@nestjs/common';

interface AppServices {
  app: INestApplicationContext;
  authService: AuthService;
  itemsService: ItemsService;
}

async function getAppAndServices(): Promise<AppServices> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const authService = app.get(AuthService);
  const itemsService = app.get(ItemsService);
  return { app, authService, itemsService };
}

async function seedData(): Promise<void> {
  const logger = new Logger('SeedData');
  let app: INestApplicationContext | undefined;
  
  try {
    const services = await getAppAndServices();
    app = services.app;
    const { authService, itemsService } = services;

    logger.log('Добавляем тестовые данные...');

    const testData = generateTestData();

    logger.log('Создаем пользователей...');
    const users = await Promise.all(
      testData.users.map(async (userData) => {
        const { user } = await authService.register(
          {
            email: userData.email,
            username: userData.username,
            password: userData.password,
          },
          'seed',
        );
        return user;
      })
    );
    logger.log(`Создано ${users.length} пользователей`);

    logger.log('Создаем элементы...');
    const allItems = [
      ...testData.items,
    ];
    
    const items = await Promise.all(
      allItems.map(async (itemData) => {
        const randomUser = users[Math.floor(Math.random() * users.length)];
        return itemsService.create({
          title: itemData.title,
          content: itemData.content,
        }, randomUser);
      })
    );
    logger.log(`Создано ${items.length} элементов`);

    logger.log('Тестовые данные успешно добавлены!');
    logger.log(`Итого: ${users.length} пользователей, ${items.length} элементов`);
    logger.log(`   - Случайных элементов: ${testData.items.length}`);
  } catch (err) {
    console.error('Ошибка при добавлении тестовых данных:', err);
    process.exit(1);
  } finally {
    if (app) await app.close();
  }
}

// CLI запуск
if (require.main === module) {
  void seedData();
}

export { seedData }; 