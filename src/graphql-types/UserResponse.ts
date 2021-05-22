import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class UserResponse {
    @Field(() => String, { nullable: true })
    slackId: string | null;
}
