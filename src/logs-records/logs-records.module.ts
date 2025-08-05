import { Module } from '@nestjs/common';
import { LogsRecordsService } from './logs-records.service';
import { TypeOrmModule } from '@nestjs/typeorm';
import { LogsRecord } from './entities/logs-record.entity';

@Module({
  imports: [TypeOrmModule.forFeature([LogsRecord])],
  providers: [LogsRecordsService],
})
export class LogsRecordsModule {}
