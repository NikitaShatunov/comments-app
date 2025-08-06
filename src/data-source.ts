import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as dotenv from 'dotenv';
import { User } from './users/entities/user.entity';
import { Portfolio } from './portfolios/entities/portfolio.entity';
import { Media } from './media/entities/media.entity';
import { Comment } from './comments/entities/comment.entity';
import { LogsRecord } from './logs-records/entities/logs-record.entity';

dotenv.config(); // Load environment variables from .env

export const AppDataSource = new DataSource({
  type: 'mysql',
  host: process.env.MYSQL_HOST,
  port: Number(process.env.MYSQL_PORT),
  username: process.env.MYSQL_USERNAME,
  password: process.env.MYSQL_PASSWORD,
  database: process.env.MYSQL_DATABASE,
  synchronize: false,
  logging: false,
  entities: [User, Portfolio, Media, Comment, LogsRecord],
  migrations: ['src/migrations/*.ts'],
  migrationsTableName: 'migrations',
});
