import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UsersModule } from './users/users.module';
import { ItemsModule } from './items/items.module';
import { AuthModule } from './auth/auth.module';
import { dataSourceOptions } from '../data-source';
import { validate } from './common/config/validation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      validate,
    }),
    TypeOrmModule.forRoot(dataSourceOptions),
    UsersModule,
    ItemsModule,
    AuthModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
