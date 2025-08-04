import { User } from 'src/users/entities/user.entity';

export class CommentDto {
  id: number;
  text: string;
  parent?: CommentDto;
  children?: CommentDto[];
  user: User;
  childrenCount: number;
  createdAt: Date;
  updatedAt: Date;
}
