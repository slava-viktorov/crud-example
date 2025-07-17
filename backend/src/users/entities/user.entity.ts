import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { Exclude, Expose } from 'class-transformer';
import { Item } from '../../items/entities/item.entity';
import { RefreshToken } from '../../auth/entities/refresh-token.entity';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  @Expose()
  id: string;

  @Column({ unique: true })
  @Exclude()
  email: string;

  @Column({ unique: true })
  @Expose()
  username: string;

  @Column()
  @Exclude()
  passwordHash: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Exclude()
  source?: string | null;

  @OneToMany(() => Item, (item) => item.author)
  @Exclude()
  items: Item[];

  @CreateDateColumn()
  @Exclude()
  createdAt: Date;

  @UpdateDateColumn()
  @Exclude()
  updatedAt: Date;

  @OneToMany(() => RefreshToken, refreshToken => refreshToken.user)
  refreshTokens: RefreshToken[];
}
