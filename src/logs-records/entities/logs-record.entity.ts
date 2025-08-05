import { AbstractEntityClass } from 'src/database/AbstractEntityClass';
import { Column, Entity } from 'typeorm';

export enum LogResource {
  USER = 'user',
  COMMENT = 'comment',
}

@Entity()
export class LogsRecord extends AbstractEntityClass<LogsRecord> {
  @Column({
    type: 'enum',
    enum: LogResource,
  })
  resourceName: string;

  @Column({ nullable: false })
  resourceId: number;

  @Column({ nullable: false })
  message: string;
}
