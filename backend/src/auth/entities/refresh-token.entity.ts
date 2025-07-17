import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
} from 'typeorm';

import { User } from '../../users/entities/user.entity';

@Entity('refresh_tokens')
export class RefreshToken {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 36, unique: true, nullable: false })
  jti: string;

  @Column({ type: 'varchar', length: 64, unique: true, nullable: false })
  token: string;

  @Column({ type: 'boolean', default: false, nullable: false })
  isRevoked: boolean;

  @Column({ type: 'timestamp', nullable: true })
  revokedAt: Date | null;

  @ManyToOne(() => User, (user) => user.refreshTokens, { onDelete: 'CASCADE', nullable: false })
  user: User;

  @Column({ type: 'uuid', nullable: false })
  userId: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
