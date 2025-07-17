import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { ValidationPipe } from '@nestjs/common';
import { DataSource as TypeOrmDataSource } from 'typeorm';
import * as cookieParser from 'cookie-parser';

const REFRESH_TOKEN_NAME = process.env.JWT_REFRESH_TOKEN_NAME || 'refreshToken';
const ACCESS_TOKEN_NAME = process.env.JWT_ACCESS_TOKEN_NAME || 'accessToken';

function extractTokensFromCookies(setCookieHeader: string[] | undefined) {
  let accessToken = '';
  let refreshToken = '';
  if (Array.isArray(setCookieHeader)) {
    for (const cookieStr of setCookieHeader) {
      const matchAccess = cookieStr.match(new RegExp(`${ACCESS_TOKEN_NAME}=([^;]+)`));
      if (matchAccess) accessToken = matchAccess[1];
      const matchRefresh = cookieStr.match(new RegExp(`${REFRESH_TOKEN_NAME}=([^;]+)`));
      if (matchRefresh) refreshToken = matchRefresh[1];
    }
  }
  return { accessToken, refreshToken };
}

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let db: TypeOrmDataSource;

  beforeAll(async () => {
    // Подключение к тестовой БД
    const { dataSourceOptions } = await import('../data-source');
    db = new TypeOrmDataSource(dataSourceOptions);
    await db.initialize();

    // Применение миграций в тестовой БД
    await db.runMigrations();
  });

  afterAll(async () => {
    await db.destroy();
  });

  beforeEach(async () => {
    // Очистка таблиц в тестовой БД
    await db.query('DELETE FROM "items"');
    await db.query('DELETE FROM "users"');

    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());
    app.use(cookieParser());
    await app.init();
  });

  afterEach(async () => {
    await app.close();
  });

  describe('Items', () => {
    it('GET /items should return items list', () => {
      return request(app.getHttpServer())
        .get('/items')
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('data');
          expect(res.body).toHaveProperty('count');
          expect(Array.isArray(res.body.data)).toBe(true);
        });
    });

    describe('Pagination', () => {
      let accessToken: string;

      beforeEach(async () => {
        const email = `pagination-test-${Date.now()}@example.com`;
        const registerRes = await request(app.getHttpServer())
          .post('/auth/register')
          .send({ 
            email, 
            username: `pagination_user-${Date.now()}`,
            password: 'password123' 
          })
          .expect(201);
        const cookies = registerRes.headers['set-cookie'];

        const loginRes = await request(app.getHttpServer())
          .post('/auth/login')
          .send({ email, password: 'password123' })
          .expect(200);

        globalThis.__testCookies = loginRes.headers['set-cookie'];

        // Создаем 25 items для тестирования пагинации
        for (let i = 1; i <= 25; i++) {
          await request(app.getHttpServer())
            .post('/items')
            .set('Cookie', globalThis.__testCookies)
            .send({
              title: `Item ${i}`,
              content: `Content for item ${i}`,
            })
            .expect(201);
        }
      });

      it('should return default pagination (page=1, limit=10)', async () => {
        const response = await request(app.getHttpServer())
          .get('/items')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(10);
        expect(response.body.data[0].title).toBe('Item 25'); // Сортировка по createdAt DESC
        expect(response.body.data[9].title).toBe('Item 16');
      });

      it('should return second page with 10 items', async () => {
        const response = await request(app.getHttpServer())
          .get('/items?page=2&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(10);
        expect(response.body.data[0].title).toBe('Item 15');
        expect(response.body.data[9].title).toBe('Item 6');
      });

      it('should return third page with remaining 5 items', async () => {
        const response = await request(app.getHttpServer())
          .get('/items?page=3&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(5);
        expect(response.body.data[0].title).toBe('Item 5');
        expect(response.body.data[4].title).toBe('Item 1');
      });

      it('should limit maximum items per page to 100', async () => {
        const response = await request(app.getHttpServer())
          .get('/items?page=1&limit=100')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(25); // Все items, но не больше 100
      });

      it('should handle invalid page number', async () => {
        const response = await request(app.getHttpServer())
          .get('/items?page=0&limit=10')
          .expect(400); // ValidationPipe должен отклонить page < 1

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
      });

      it('should handle invalid limit', async () => {
        const response = await request(app.getHttpServer())
          .get('/items?page=1&limit=0')
          .expect(400); // ValidationPipe должен отклонить limit < 1

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
      });

      it('should handle limit greater than maximum', async () => {
        const response = await request(app.getHttpServer())
          .get('/items?page=1&limit=150')
          .expect(400); // ValidationPipe должен отклонить limit > 100

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
      });

      it('should return empty array for page beyond data', async () => {
        const response = await request(app.getHttpServer())
          .get('/items?page=10&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(0);
      });

      it('should return items using skip parameter', async () => {
        const response = await request(app.getHttpServer())
          .get('/items?skip=10&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(10);
        expect(response.body.data[0].title).toBe('Item 15');
        expect(response.body.data[9].title).toBe('Item 6');
      });

      it('should return items using skip parameter for second page', async () => {
        const response = await request(app.getHttpServer())
          .get('/items?skip=20&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(5);
        expect(response.body.data[0].title).toBe('Item 5');
        expect(response.body.data[4].title).toBe('Item 1');
      });

      it('should prioritize skip over page when both are provided', async () => {
        const response = await request(app.getHttpServer())
          .get('/items?page=2&skip=10&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(10);
        // Должен использовать skip=10, а не page=2
        expect(response.body.data[0].title).toBe('Item 15');
        expect(response.body.data[9].title).toBe('Item 6');
      });

      it('should handle negative skip value', async () => {
        const response = await request(app.getHttpServer())
          .get('/items?skip=-1&limit=10')
          .expect(400); // ValidationPipe должен отклонить skip < 0

        expect(response.body).toHaveProperty('message');
        expect(Array.isArray(response.body.message)).toBe(true);
      });

      it('should handle skip with zero value', async () => {
        const response = await request(app.getHttpServer())
          .get('/items?skip=0&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(10);
        expect(response.body.data[0].title).toBe('Item 25');
        expect(response.body.data[9].title).toBe('Item 16');
      });

      it('should handle skip beyond data range', async () => {
        const response = await request(app.getHttpServer())
          .get('/items?skip=100&limit=10')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(0);
      });

      it('should work with skip and custom limit', async () => {
        const response = await request(app.getHttpServer())
          .get('/items?skip=5&limit=5')
          .expect(200);

        expect(response.body).toHaveProperty('data');
        expect(response.body).toHaveProperty('count');
        expect(response.body.count).toBe(25);
        expect(response.body.data).toHaveLength(5);
        expect(response.body.data[0].title).toBe('Item 20');
        expect(response.body.data[4].title).toBe('Item 16');
      });
  });

  describe('User search methods', () => {
    it('should find user by email for login', async () => {
      const email = `search-${Date.now()}@example.com`;
      const username = `search_user-${Date.now()}`;

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ 
          email, 
          username,
          password: 'password123' 
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'password123' })
        .expect(200);
      expect(loginRes.body).toEqual({
        id: expect.any(String),
        email,
        username,
      });
      expect(loginRes.headers['set-cookie']).toBeDefined();
    });

    it('should handle login with non-existent email', async () => {
      const email = `nonexistent-${Date.now()}@example.com`;

      // Попытка логина с несуществующим email
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'password123' })
        .expect(401);
    });
  });

  describe('Error handling', () => {
    it('should handle duplicate email registration', async () => {
      const email = `duplicate-${Date.now()}@example.com`;
      const username = `user-${Date.now()}`;

      // Первая регистрация
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ 
          email, 
          username,
          password: 'password123' 
        })
        .expect(201);

      // Попытка регистрации с тем же email
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ 
          email, 
          username: `user2_${Date.now()}`,
          password: 'password123' 
        })
        .expect(409)
        .expect((res) => {
          expect(res.body.message).toContain('Email already exists');
        });
    });

    it('should handle duplicate username registration', async () => {
      const email = `user-${Date.now()}@example.com`;
      const username = `dup_${Date.now()}`; // Короткий username

      // Первая регистрация
      const firstResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ 
          email, 
          username,
          password: 'password123' 
        });

      expect(firstResponse.status).toBe(201);

      // Попытка регистрации с тем же username
      const secondResponse = await request(app.getHttpServer())
        .post('/auth/register')
        .send({ 
          email: `user2_${Date.now()}@example.com`, 
          username,
          password: 'password123' 
        });

      expect(secondResponse.status).toBe(409);
      expect(secondResponse.body.message).toContain('Username already exists');
    });

    it('should handle invalid refresh token', async () => {
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .expect(401);
    });

    it('should handle expired refresh token', async () => {
      const email = `expired-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ 
          email, 
          username: `expired_user-${Date.now()}`,
          password: 'password123' 
        })
        .expect(201);
      
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'password123' })
        .expect(200);

      const setCookieHeader = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie']
        : [loginRes.headers['set-cookie']].filter(Boolean);
      const { accessToken: accessTokenValue, refreshToken: refreshTokenValue } = extractTokensFromCookies(setCookieHeader);

      const logoutRes = await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', `${REFRESH_TOKEN_NAME}=${refreshTokenValue}`)
        .expect(204);

      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `${REFRESH_TOKEN_NAME}=${refreshTokenValue}`)
        .expect(401);
    });

    it('should handle invalid login credentials', async () => {
      const email = `invalid-${Date.now()}@example.com`;
      
      // Попытка логина с несуществующим пользователем
      await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'wrongpassword' })
        .expect(401);
    });

    it('should handle invalid item data', async () => {
      const email = `validation-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ 
          email, 
          username: `validation_user-${Date.now()}`,
          password: 'password123' 
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'password123' })
        .expect(200);

      const setCookieHeader = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie']
        : [loginRes.headers['set-cookie']].filter(Boolean);
      const { accessToken: accessTokenValue } = extractTokensFromCookies(setCookieHeader);

      // Попытка создать item с пустым title
      await request(app.getHttpServer())
        .post('/items')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
        .send({ title: '', content: 'Test Content' })
        .expect(400);

      // Попытка создать item с пустым content
      await request(app.getHttpServer())
        .post('/items')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
        .send({ title: 'Test Title', content: '' })
        .expect(400);
    });
  });
});

  describe('Auth & JWT', () => {
    const uniqueEmail = `test-${Date.now()}@example.com`;
    let itemId: string;

    it('POST /auth/register -> POST /auth/login -> CRUD /items', async () => {
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ 
          email: uniqueEmail, 
          username: `user-${Date.now()}`,
          password: 'password123' 
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: uniqueEmail, password: 'password123' })
        .expect(200);

      const setCookieHeader = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie']
        : [loginRes.headers['set-cookie']].filter(Boolean);
      const { accessToken: accessTokenValue, refreshToken: refreshTokenValue } = extractTokensFromCookies(setCookieHeader);

      // Создание item (только с accessToken в cookie)
      const createRes = await request(app.getHttpServer())
        .post('/items')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
        .send({ title: 'Test Item', content: 'Test Content' })
        .expect(201);
      expect(createRes.body).toHaveProperty('id');
      itemId = createRes.body.id;

      // Попытка создать item без токена
      await request(app.getHttpServer())
        .post('/items')
        .send({ title: 'No Auth', content: 'No Auth Content' })
        .expect(401);

      // Получение списка items
      const listRes = await request(app.getHttpServer())
        .get('/items')
        .expect(200);
      expect(listRes.body.data.length).toBe(1);

      // Получение одного item
      await request(app.getHttpServer())
        .get(`/items/${itemId}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('id', itemId);
        });

      // Обновление item (только с accessToken)
      await request(app.getHttpServer())
        .patch(`/items/${itemId}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
        .send({ title: 'Updated Title' })
        .expect(200)
        .expect((res) => {
          expect(res.body).toHaveProperty('title', 'Updated Title');
        });

      // Попытка обновить без токена
      await request(app.getHttpServer())
        .patch(`/items/${itemId}`)
        .send({ title: 'No Auth' })
        .expect(401);

      // Удаление item (только с accessToken)
      await request(app.getHttpServer())
        .delete(`/items/${itemId}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
        .expect(200);

      // Попытка удалить без токена
      await request(app.getHttpServer()).delete(`/items/${itemId}`).expect(401);
    });

    it('should support skip parameter for authenticated users', async () => {
      const skipEmail = `skip-auth-${Date.now()}@example.com`;
      
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ 
          email: skipEmail, 
          username: `skip_auth_user-${Date.now()}`,
          password: 'password123' 
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: skipEmail, password: 'password123' })
        .expect(200);

      const setCookieHeader = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie']
        : [loginRes.headers['set-cookie']].filter(Boolean);
      const { accessToken: accessTokenValue } = extractTokensFromCookies(setCookieHeader);

      // Создаем 15 items для тестирования skip
      for (let i = 1; i <= 15; i++) {
        await request(app.getHttpServer())
          .post('/items')
          .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
          .send({
            title: `Auth Item ${i}`,
            content: `Content for auth item ${i}`,
          })
          .expect(201);
      }

      // Тестируем skip с аутентификацией
      const response = await request(app.getHttpServer())
        .get('/items?skip=5&limit=5')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBe(15);
      expect(response.body.data).toHaveLength(5);
      expect(response.body.data[0].title).toBe('Auth Item 10');
      expect(response.body.data[4].title).toBe('Auth Item 6');
    });

    it('should prioritize skip over page for authenticated users', async () => {
      const priorityEmail = `priority-${Date.now()}@example.com`;

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ 
          email: priorityEmail, 
          username: `priority_user-${Date.now()}`,
          password: 'password123' 
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: priorityEmail, password: 'password123' })
        .expect(200);

      const setCookieHeader = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie']
        : [loginRes.headers['set-cookie']].filter(Boolean);
      const { accessToken: accessTokenValue } = extractTokensFromCookies(setCookieHeader);

      // Создаем 10 items
      for (let i = 1; i <= 10; i++) {
        await request(app.getHttpServer())
          .post('/items')
          .set('Cookie', `${ACCESS_TOKEN_NAME}=${accessTokenValue}`)
          .send({
            title: `Priority Item ${i}`,
            content: `Content for priority item ${i}`,
          })
          .expect(201);
      }

      // Тестируем приоритет skip над page
      const response = await request(app.getHttpServer())
        .get('/items?page=2&skip=3&limit=3')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('count');
      expect(response.body.count).toBe(10);
      expect(response.body.data).toHaveLength(3);
      // Должен использовать skip=3, а не page=2
      expect(response.body.data[0].title).toBe('Priority Item 7');
      expect(response.body.data[2].title).toBe('Priority Item 5');
    });

    it('POST /auth/refresh - get new accessToken', async () => {
      const refreshEmail = `refresh-${Date.now()}@example.com`;
      const refreshUsername = `refresh_user_${Date.now()}`;

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ 
          email: refreshEmail, 
          username: refreshUsername,
          password: 'password123' 
        })
        .expect(201);
      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: refreshEmail, password: 'password123' })
        .expect(200);

      const setCookieHeader = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie']
        : [loginRes.headers['set-cookie']].filter(Boolean);
      const { accessToken: accessTokenValue, refreshToken: refreshTokenValue } = extractTokensFromCookies(setCookieHeader);
      
      const refreshRes = await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `${REFRESH_TOKEN_NAME}=${refreshTokenValue}`)
        .expect(200);

      expect(refreshRes.headers['set-cookie']).toBeDefined();
    });

    it('POST /auth/logout - invalidates refreshToken', async () => {
      const logoutEmail = `logout-${Date.now()}@example.com`;

      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ 
          email: logoutEmail, 
          username: `logout_user-${Date.now()}`,
          password: 'password123' 
        })
        .expect(201);

      const loginRes = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: logoutEmail, password: 'password123' })
        .expect(200);

      const setCookieHeader = Array.isArray(loginRes.headers['set-cookie'])
        ? loginRes.headers['set-cookie']
        : [loginRes.headers['set-cookie']].filter(Boolean);
      const { accessToken: accessTokenValue, refreshToken: refreshTokenValue } = extractTokensFromCookies(setCookieHeader);

      // Logout
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', `${REFRESH_TOKEN_NAME}=${refreshTokenValue}`)
        .expect(204);

      // Попытка обновить токен после logout
      await request(app.getHttpServer())
        .post('/auth/refresh')
        .set('Cookie', `${REFRESH_TOKEN_NAME}=${refreshTokenValue}`)
        .expect(401);
    });

    it('POST /auth/logout - should throw 401 when no refresh token', async () => {
      // Попытка logout без refresh token
      await request(app.getHttpServer())
        .post('/auth/logout')
        .expect(401);
    });

    it('POST /auth/logout - should throw 401 when refresh token is invalid', async () => {
      // Попытка logout с невалидным refresh token
      await request(app.getHttpServer())
        .post('/auth/logout')
        .set('Cookie', `${REFRESH_TOKEN_NAME}=invalid-token`)
        .expect(401);
    });
  });

  describe('Forbidden (403)', () => {
    let userA: { email: string; accessToken: string };
    let userB: { email: string; accessToken: string };
    let itemId: string;

    beforeEach(async () => {
      // Регистрация и логин UserA
      const emailA = `userA-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ 
          email: emailA, 
          username: `userA_${Date.now()}`,
          password: 'password123' 
        })
        .expect(201);

      const loginA = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: emailA, password: 'password123' })
        .expect(200);

      const setCookieHeaderA = Array.isArray(loginA.headers['set-cookie'])
        ? loginA.headers['set-cookie']
        : [loginA.headers['set-cookie']].filter(Boolean);
      
      const { accessToken: accessTokenValueA } = extractTokensFromCookies(setCookieHeaderA);
      userA = { email: emailA, accessToken: accessTokenValueA };

      // Регистрация и логин UserB
      const emailB = `userB-${Date.now()}@example.com`;
      await request(app.getHttpServer())
        .post('/auth/register')
        .send({ 
          email: emailB, 
          username: `userB_${Date.now()}`,
          password: 'password123' 
        })
        .expect(201);

      const loginB = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email: emailB, password: 'password123' })
        .expect(200);

      const setCookieHeaderB = Array.isArray(loginB.headers['set-cookie'])
        ? loginB.headers['set-cookie']
        : [loginB.headers['set-cookie']].filter(Boolean);
        
      const { accessToken: accessTokenValueB } = extractTokensFromCookies(setCookieHeaderB);
      userB = { email: emailB, accessToken: accessTokenValueB };

      // UserA создаёт item
      const createRes = await request(app.getHttpServer())
        .post('/items')
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${userA.accessToken}`)
        .send({ title: 'UserA Item', content: 'Owned by A' })
        .expect(201);
      itemId = createRes.body.id;
    });

    it('UserB cannot update another user item', async () => {
      await request(app.getHttpServer())
        .patch(`/items/${itemId}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${userB.accessToken}`)
        .send({ title: 'Hacked' })
        .expect(403);
    });

    it('UserB cannot delete another user item', async () => {
      await request(app.getHttpServer())
        .delete(`/items/${itemId}`)
        .set('Cookie', `${ACCESS_TOKEN_NAME}=${userB.accessToken}`)
        .expect(403);
    });
  });
});
