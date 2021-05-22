import { Arg, Ctx, Mutation, Resolver, Query } from 'type-graphql';
import { MyContext } from '../graphql-types/MyContext';
import { UserResponse } from '../graphql-types/UserResponse';

@Resolver()
export class AuthResolver {
    @Mutation(() => Boolean)
    async login(@Arg('slackId', () => String) slackId: string, @Ctx() ctx: MyContext): Promise<Boolean> {
        if (ctx.req.session.slackId) return false;

        ctx.req.session.slackId = slackId;

        return true;
    }

    @Mutation(() => Boolean)
    async logout(@Ctx() ctx: MyContext): Promise<Boolean> {
        if (!ctx.req.session.slackId) return false;

        ctx.req.session.slackId = null;

        return true;
    }

    @Query(() => UserResponse)
    async me(@Ctx() ctx: MyContext): Promise<UserResponse> {
        return ctx.req.session;
    }
}
