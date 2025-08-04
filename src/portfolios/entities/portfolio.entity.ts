import { on } from 'events';
import { AbstractEntityClass } from 'src/database/AbstractEntityClass';
import { Media } from 'src/media/entities/media.entity';
import { User } from 'src/users/entities/user.entity';
import { Column, Entity, JoinColumn, ManyToOne, OneToMany } from 'typeorm';

@Entity()
export class Portfolio extends AbstractEntityClass<Portfolio> {
  @Column({ nullable: false })
  title: string;

  @Column({ nullable: true })
  description: string;

  @Column({ default: true })
  isPublic: boolean;

  @ManyToOne(() => User, (user) => user.portfolios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @OneToMany(() => Media, (media) => media.portfolio, { onDelete: 'SET NULL' })
  images: Media[];
}
