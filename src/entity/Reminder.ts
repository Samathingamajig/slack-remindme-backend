import { Entity, PrimaryGeneratedColumn, Column, BaseEntity } from 'typeorm';
import { Field, Int, ObjectType } from 'type-graphql';

@ObjectType()
@Entity()
export class Reminder extends BaseEntity {
    @Field(() => String)
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Field(() => String)
    @Column()
    creatorId: string;

    @Field(() => String)
    @Column()
    permalink: string;

    @Field(() => Int)
    @Column('int')
    postAt: number;
}
