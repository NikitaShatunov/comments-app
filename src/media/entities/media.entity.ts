import { AbstractEntityClass } from 'src/database/AbstractEntityClass';
import { Portfolio } from 'src/portfolios/entities/portfolio.entity';
import { Column, Entity, ManyToOne, OneToOne } from 'typeorm';

@Entity()
export class Media extends AbstractEntityClass<Media> {
  @Column({ nullable: false })
  name: string;

  @Column({ nullable: true })
  description: string;

  @Column({ nullable: false, default: true })
  isPublic: boolean;

  @ManyToOne(() => Portfolio, (portfolio) => portfolio.images, {
    onDelete: 'CASCADE',
  })
  portfolio: Portfolio;

  @Column({ nullable: false })
  path: string;
}
