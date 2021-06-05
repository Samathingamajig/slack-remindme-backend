import { Field, ObjectType } from 'type-graphql';
import { FieldError } from './FieldError';

@ObjectType()
export class ReminderIdsResponse {
    @Field(() => [String], { nullable: true })
    reminderIds?: string[];

    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];
}
