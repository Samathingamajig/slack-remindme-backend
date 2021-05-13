import { Field, ObjectType } from 'type-graphql';
import { FieldError } from './FieldError';

@ObjectType()
export class BooleanResponse {
    @Field(() => Boolean, { nullable: true })
    success: Boolean;

    @Field(() => [FieldError], { nullable: true })
    errors?: FieldError[];
}
