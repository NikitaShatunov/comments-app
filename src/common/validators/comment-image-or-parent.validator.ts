import {
  ValidationArguments,
  ValidatorConstraint,
  ValidatorConstraintInterface,
} from 'class-validator';

@ValidatorConstraint({ name: 'CommentImageOrParent', async: false })
export class CommentImageOrParentConstraint
  implements ValidatorConstraintInterface
{
  validate(_: any, args: ValidationArguments) {
    const obj = args.object as any;
    // Only one must be provided, not both undefined
    return !!(
      (obj.imageId && !obj.parentCommentId) ||
      (!obj.imageId && obj.parentCommentId)
    );
  }
  defaultMessage(args: ValidationArguments) {
    return 'Exactly one of imageId or parentCommentId must be provided';
  }
}
