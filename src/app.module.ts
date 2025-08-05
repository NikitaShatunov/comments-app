import { Module } from '@nestjs/common';
import { DatabaseModule } from './database/database.module';
import { ConfigModule } from '@nestjs/config';
import { PortfoliosModule } from './portfolios/portfolios.module';
import { CacheModule } from '@nestjs/cache-manager';
import { UsersModule } from './users/users.module';
import { LocalAuthModule } from './local-auth/local-auth.module';
import { CommentsModule } from './comments/comments.module';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { LogsRecordsModule } from './logs-records/logs-records.module';

@Module({
  imports: [
    DatabaseModule,
    ConfigModule.forRoot({ isGlobal: true }),
    PortfoliosModule,
    UsersModule,
    LocalAuthModule,
    // Configure cache manager with memory store
    CacheModule.register({
      ttl: 5000, // 5 seconds
      max: 100,
      isGlobal: true,
      store: 'memory',
    }),
    CommentsModule,
    EventEmitterModule.forRoot({}),
    LogsRecordsModule,
  ],
})
export class AppModule {}
