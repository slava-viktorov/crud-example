import { NestFactory, Reflector } from '@nestjs/core';
import { AppModule } from './app.module';
import {
  ValidationPipe,
  ClassSerializerInterceptor,
  VersioningType,
  Logger,
} from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { HttpExceptionFilter } from './common/filters/http-exception.filter';
import { ConfigService } from '@nestjs/config';
import * as cookieParser from 'cookie-parser';
import helmet from 'helmet';

const API_VERSION = '1';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('HTTP');

  const NODE_ENV = configService.get<string>('NODE_ENV', 'development');
  const FRONTEND_URL = configService.get<string>('FRONTEND_URL');
  const PORT = configService.get<number>('PORT', 3000);

  app.use(helmet());

  app.enableCors({
    origin: NODE_ENV === 'development' ? true : [FRONTEND_URL],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization', 'Cache-Control', 'Pragma'],
    credentials: true,
    optionsSuccessStatus: 200,
  });

  app.setGlobalPrefix('api');

  app.enableVersioning({
    type: VersioningType.URI,
    prefix: 'v',
    defaultVersion: API_VERSION,
  });

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));
  app.useGlobalFilters(new HttpExceptionFilter());
  
  app.use(cookieParser());

  // Логирование всех HTTP-запросов
  app.use((req, res, next) => {
    const { method, originalUrl } = req;
    const start = Date.now();
    res.on('finish', () => {
      const ms = Date.now() - start;
      logger.log(`${method} ${originalUrl} ${res.statusCode} +${ms}ms`);
    });
    next();
  });

  const config = new DocumentBuilder()
    .setTitle('CRUD Platform API')
    .setDescription('API for managing users and contents in a CRUD platform.')
    .setVersion(API_VERSION)
    .addBearerAuth()
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  try {
    await app.listen(PORT);
    logger.log(`Application is running on: http://localhost:${PORT}`);
    logger.log(`Swagger documentation: http://localhost:${PORT}/docs`);
  } catch (error) {
    logger.error('Failed to start application', error);
    process.exit(1);
  }
}

void bootstrap();
