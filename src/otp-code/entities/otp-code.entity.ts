import { Entity, Column, ManyToOne, OneToOne, JoinColumn } from 'typeorm';
import { AbstractEntityClass } from 'src/database/AbstractEntityClass';
import { User } from 'src/users/entities/user.entity';

@Entity()
export class OtpCode extends AbstractEntityClass<OtpCode> {
  @Column()
  value: string;

  @Column()
  expirationTime: Date;

  @Column({
    type: 'enum',
    enum: ['verify account', 'reset email', 'reset password'],
  })
  type: 'verify account' | 'reset email' | 'reset password';

  @Column({
    type: 'enum',
    enum: ['unused', 'used', 'invalid'],
    default: 'unused',
  })
  status: 'unused' | 'used' | 'invalid';

  @OneToOne(() => User, (user) => user.otp, { onDelete: 'SET NULL' })
  @JoinColumn()
  user: User;
}
