import { Field, ObjectType } from 'type-graphql';
import { Reminder } from '../entity/Reminder';
import { FieldError } from './FieldError';

@ObjectType()
export class ReminderResponse {
    @Field(() => Reminder, { nullable: true })
    reminder?: Reminder;

    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];
}
