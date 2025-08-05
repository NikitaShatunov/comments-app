export class CommentCreatedEvent {
  id: number;
  userId: number;
  parentCommentId?: number;
}
