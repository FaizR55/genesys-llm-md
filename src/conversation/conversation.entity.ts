import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  Index,
} from 'typeorm';

export enum MessageRole {
  USER = 'user',
  BOT = 'bot',
}

@Entity('conversations')
export class Conversation {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Index()
  @Column({ name: 'conversation_id' })
  conversationId!: string;

  @Column({ name: 'user_id' })
  userId!: string;

  @Column('text')
  message!: string;

  @Column({ type: 'enum', enum: MessageRole })
  role!: MessageRole;

  @CreateDateColumn({ name: 'created_at' })
  createdAt!: Date;
}
