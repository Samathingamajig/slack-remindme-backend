import { Arg, Ctx, Mutation, Resolver, Query } from 'type-graphql';
import { getBoltApp } from '../boltApp';
import { MyContext } from '../graphql-types/MyContext';
import { UserResponse } from '../graphql-types/UserResponse';

@Resolver()
export class AuthResolver {
    @Mutation(() => Boolean)
    async login(@Arg('slackCode', () => String) slackCode: string, @Ctx() ctx: MyContext): Promise<Boolean> {
        const boltApp = getBoltApp();
        try {
            const authRes = await boltApp.client.oauth.v2.access({
                client_id: process.env['SLACK_CLIENT_ID'] as string,
                client_secret: process.env['SLACK_CLIENT_SECRET'] as string,
                code: slackCode,
            });
            if (!authRes.ok) return false;
            ctx.req.session.slackId = (authRes as any).authed_user.id;
        } catch (err) {
            console.log(err);
            return false;
        }

        return true;
    }

    @Mutation(() => Boolean)
    async logout(@Ctx() ctx: MyContext): Promise<Boolean> {
        ctx.req.session.slackId = null;

        return true;
    }

    @Query(() => UserResponse)
    async me(@Ctx() ctx: MyContext): Promise<UserResponse> {
        return ctx.req.session;
    }
}
