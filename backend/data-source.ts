import 'reflect-metadata';
import { DataSource, DataSourceOptions } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './src/users/entities/user.entity';
import { Item } from './src/items/entities/item.entity';
import { RefreshToken } from './src/auth/entities/refresh-token.entity';

dotenv.config();

const database = (process.env.NODE_ENV === 'test' && process.env.DB_DATABASE_TEST) || process.env.DB_DATABASE;
const port = (process.env.NODE_ENV === 'test' && process.env.DB_PORT_TEST) || process.env.DB_PORT || '5432';
const host = (process.env.NODE_ENV === 'test' && process.env.DB_HOST_TEST) || process.env.DB_HOST || 'localhost';

export const dataSourceOptions: DataSourceOptions = {
    type: 'postgres',
    host,
    port: parseInt(port, 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database,
    entities: [User, Item, RefreshToken],
    migrations: [__dirname + '/src/migrations/*{.ts,.js}'],
    synchronize: false,
    logging: ['error'],
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource; 