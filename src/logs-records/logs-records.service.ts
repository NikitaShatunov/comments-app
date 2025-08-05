import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import { InjectRepository } from '@nestjs/typeorm';
import { CommentCreatedEvent } from 'src/comments/events/comment-created.event';
import { LogResource, LogsRecord } from './entities/logs-record.entity';
import { Repository } from 'typeorm';
import { UserCreatedEvent } from 'src/users/events/user-created.events';
import { CommentDeletedEvent } from 'src/comments/events/comment-deleted.event';

@Injectable()
export class LogsRecordsService {
  constructor(
    @InjectRepository(LogsRecord)
    private logsRecordRepository: Repository<LogsRecord>,
  ) {}
  @OnEvent('comment.created')
  handleCommentCreatedEvent(event: CommentCreatedEvent) {
    const { id, userId, parentCommentId } = event;
    const message =
      `Comment with ID ${id} created by user with ID ${userId}` +
      (parentCommentId
        ? ` as a reply to comment with ID ${parentCommentId}`
        : '');
    const logsRecord = this.logsRecordRepository.create({
      message,
      resourceName: LogResource.COMMENT,
      resourceId: id,
    });
    this.logsRecordRepository.save(logsRecord);
  }

  @OnEvent('user.created')
  handleUserCreatedEvent(event: UserCreatedEvent) {
    const { id, name, email } = event;
    const message = `User with ID ${id} created. Name: ${name}, Email: ${email}`;
    const logsRecord = this.logsRecordRepository.create({
      message,
      resourceName: LogResource.USER,
      resourceId: id,
    });
    this.logsRecordRepository.save(logsRecord);
  }

  @OnEvent('comment.deleted')
  handleCommentDeletedEvent(event: CommentDeletedEvent) {
    const { id } = event;
    const message = `Comment with ID ${id} deleted by user`;
    const logsRecord = this.logsRecordRepository.create({
      message,
      resourceName: LogResource.COMMENT,
      resourceId: id,
    });
    this.logsRecordRepository.save(logsRecord);
  }
}
