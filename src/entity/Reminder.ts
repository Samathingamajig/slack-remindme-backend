import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';
import { Field, Int, ObjectType } from 'type-graphql';

@ObjectType()
@Entity()
export class Reminder extends BaseEntity {
    @Field(() => String)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    creatorId: string;

    @Field(() => String)
    @Column()
    permalink: string;

    @Field(() => Int)
    @Column('int')
    postAt: number;

    @Column()
    scheduledMessageId: string;

    @Column()
    authorId: string;

    @Field(() => String)
    @Column()
    authorName: string;

    @Column()
    channelId: string;

    @Field(() => String)
    @Column()
    channelName: string;

    @Column()
    messageTs: string;
}
