import { AbstractEntityClass } from 'src/database/AbstractEntityClass';
import { Portfolio } from 'src/portfolios/entities/portfolio.entity';
import { Column, Entity, OneToMany, OneToOne } from 'typeorm';

@Entity()
export class User extends AbstractEntityClass<User> {
  @Column()
  name: string;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

  @Column({ default: true })
  isVerified: boolean;

  @OneToMany(() => Portfolio, (portfolio) => portfolio.user)
  portfolios: Portfolio[];
}
