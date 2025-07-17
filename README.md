# CRUD Example

Базовое CRUD приложение

## Технологии

### Backend
- **NestJS** - фреймворк для создания серверных приложений
- **TypeORM** - ORM для работы с базой данных
- **PostgreSQL** - база данных
- **JWT** - аутентификация
- **Passport** - стратегии аутентификации
- **Swagger** - документация API

### Frontend
- **Next.js 15** - React фреймворк
- **TypeScript** - типизация
- **Tailwind CSS** - стилизация
- **React Query** - управление состоянием
- **Radix UI** - компоненты интерфейса
- **React Hook Form** - формы

## Структура проекта

```
/
├── backend/          # NestJS API
├── frontend/         # Next.js приложение
├── docker-compose.yml
├── Makefile
└── README.md
```

## Как запустить

### Предварительные требования

- Docker и Docker Compose
- Node.js 18+
- Опционально Make (для использования Makefile команд)

### Переменные окружения

Создайте файл `.env` в корневой директории или используйте `.env.local`(используется по умолчанию) для теста:

### Процесс запуска
```bash
# Запуск в режиме разработки(.env.local)
make up
# Инициализация базы
make migration-run
# Загрузка тестовых данных в базу (fakerjs)
make seed
# Остановка
make down
```
Приложение доступно по адресу http://localhost:3001/items
Документация Swagger по адресу http://localhost:3000/docs
### Остановка
```bash
# Удаление тестовых данных из базы (если нужно)
make reset
# Остановка
make down
```
### Запуск
Если в вашей системе не установлен make, то используйте docker compose напрямую
```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml --env-file .env.local up --build
docker compose exec backend npm run migration:run
docker compose exec backend npm run seed
```
### Остановка
Если в вашей системе не установлен make, то используйте docker compose напрямую
```bash
docker compose down
```

### Запуск в Linux
Для запуска нужен make

#### Разработка
```bash
# Запуск в режиме разработки
make up

# Остановка
make down
```

#### Продакшн
```bash
# Запуск в продакшн режиме
make prod ENV_FILE=.env.production

# Просмотр логов
make prod-logs
```

#### Тестирование
e2e тесты используют отдельную тестовую базу
```bash
# Запуск тестов
make test

# Unit тесты
make test-unit

# E2E тесты
make test-e2e
```

### Docker команды

#### Основные команды
```bash
# Запуск
docker compose up --build

# Остановка
docker compose down

# Просмотр логов
docker compose logs -f
```

#### База данных
```bash
# Подключение к базе данных
make db-shell

# Миграции
make migration-run
make migration-generate
make migration-revert
```

#### Разработка
```bash
# Линтинг
make lint

# Форматирование
make format

# Сборка
make build

# Запуск в режиме разработки
make start-dev
```

### Локальная разработка

#### Backend
```bash
cd backend
npm install
npm run start:dev
```

#### Frontend
```bash
cd frontend
npm install
npm run dev
```

## API Endpoints

После запуска API будет доступен по адресу: `http://localhost:3000`

### Документация API
- Swagger UI: `http://localhost:3000/api/docs`

### Основные эндпоинты
- `POST /api/v1/auth/login` - вход в систему
- `POST /api/v1/auth/register` - регистрация
- `GET /api/v1/items` - получение списка элементов
- `POST /api/v1/items` - создание элемента
- `GET /api/v1/items/:id` - получение элемента по ID
- `PUT /api/v1/items/:id` - обновление элемента
- `DELETE /api/v1/items/:id` - удаление элемента

## Фронтенд

После запуска фронтенд будет доступен по адресу: `http://localhost:3001`

### Функциональность
- Аутентификация пользователей
- CRUD операции с элементами
- Пагинация
- Адаптивный дизайн
- Обработка ошибок

## Полезные команды

```bash
# Очистка всех контейнеров и томов
make clean

# Проверка здоровья приложения
make health

# Заполнение базы тестовыми данными
make seed

# Сброс данных
make reset

# Покрытие тестами
make test-cov
```

## Структура базы данных

### Основные таблицы
- `users` - пользователи системы
- `items` - элементы блога
- `refresh_tokens` - токены обновления

## Разработка

### Добавление новых миграций
```bash
make migration-generate
```

### Запуск тестов
```bash

# Unit тесты
make backend-test-unit

# E2E тесты
make backend-test-e2e
```


## Безопасность

- JWT токены для аутентификации
- Хеширование паролей с bcrypt
- Валидация входных данных
- CORS настройки
- Helmet для безопасности заголовков

## Лицензия

UNLICENSED
