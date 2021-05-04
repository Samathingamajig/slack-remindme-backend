require('dotenv').config();
import 'reflect-metadata';
import { createConnection } from 'typeorm';
import express from 'express';
import { ApolloServer } from 'apollo-server-express';
import { buildSchema } from 'type-graphql';
import {
    App as BoltApp,
    MessageEvent,
    GenericMessageEvent,
    ReactionAddedEvent,
    ReactionMessageItem,
    ExpressReceiver,
    Option,
    KnownBlock,
} from '@slack/bolt';
import { HelloWorldResolver } from './resolvers/HelloWorldResolver';
import { MovieResolver } from './resolvers/MovieResolver';

const arrayOfNumberStrings = (limit: number): string[] =>
    Array(limit)
        .fill(0)
        .map((_, i) => `${i}`);

const toOptionsObjectArray = (options: string[]): Option[] =>
    options.map((num) => ({
        text: {
            type: 'plain_text',
            text: num,
            emoji: false,
        },
        value: num,
    }));

const simpleNumberSelectBlock = (name: string, limit: number, defaultNumber: number): KnownBlock => ({
    type: 'input',
    label: {
        type: 'plain_text',
        text: name,
    },
    element: {
        type: 'static_select',
        placeholder: {
            type: 'plain_text',
            text: name,
            emoji: false,
        },
        options: toOptionsObjectArray(arrayOfNumberStrings(limit)),
        action_id: 'static_select-action',
        initial_option: {
            text: {
                type: 'plain_text',
                text: `${defaultNumber}`,
                emoji: false,
            },
            value: `${defaultNumber}`,
        },
    },
});

export const isGenericMessageEvent = (msg: MessageEvent): msg is GenericMessageEvent => {
    return (msg as GenericMessageEvent).subtype === undefined;
};

export const isMessageItem = (item: ReactionAddedEvent['item']): item is ReactionMessageItem => {
    return (item as ReactionMessageItem).type === 'message';
};

(async () => {
    const app = express();
    console.log({
        token: process.env.SLACK_OAUTH_TOKEN,
        signingSecret: process.env.SLACK_SIGNING_SECRET,
        endpoints: '/',
    });
    const boltReceiver = new ExpressReceiver({
        signingSecret: process.env.SLACK_SIGNING_SECRET!,
        endpoints: {
            events: '/slack/events',
        },
    });
    const boltApp = new BoltApp({
        token: process.env.SLACK_OAUTH_TOKEN,
        receiver: boltReceiver,
    });
    // @ts-ignore
    // We need to set the token again so we can use
    // the client outside of a slack event context
    boltApp.client.token = process.env.SLACK_OAUTH_TOKEN;

    boltApp.shortcut('remind_me_callback', async ({ shortcut, ack, client, body }) => {
        try {
            // Acknowledge shortcut request
            await ack();

            // Call the views.open method using one of the built-in WebClients
            await client.views.open({
                trigger_id: shortcut.trigger_id,
                view: {
                    private_metadata: JSON.stringify({
                        // @ts-ignore
                        channel_id: body?.channel?.id,
                        // @ts-ignore
                        message_id: body?.message?.ts,
                    }),
                    title: {
                        type: 'plain_text',
                        text: 'My App',
                        emoji: true,
                    },
                    submit: {
                        type: 'plain_text',
                        text: 'Submit',
                        emoji: true,
                    },
                    type: 'modal',
                    close: {
                        type: 'plain_text',
                        text: 'Cancel',
                        emoji: true,
                    },
                    callback_id: 'relative_time_submission',
                    blocks: [
                        {
                            type: 'header',
                            text: {
                                type: 'plain_text',
                                text: 'Relative Time',
                                emoji: true,
                            },
                        },
                        simpleNumberSelectBlock('Minutes', 60, 0),
                        simpleNumberSelectBlock('Hours', 24, 0),
                        simpleNumberSelectBlock('Days', 15, 0),
                    ],
                },
            });
        } catch (error) {
            console.error(error);
        }
    });

    boltApp.action('timepicker-action', async ({ ack }) => {
        console.log('timepicker-action');
        console.log('============================================');
        try {
            await ack();
        } catch (err) {
            console.error(err);
        }
    });

    boltApp.action('datepicker-action', async ({ ack }) => {
        console.log('datepicker-action');
        console.log('============================================');
        try {
            await ack();
        } catch (err) {
            console.error(err);
        }
    });

    boltApp.action('static_select-action', async ({ ack }) => {
        try {
            await ack();
        } catch (err) {
            console.error(err);
        }
    });

    boltApp.action('submit-button-action', async ({ ack, body }) => {
        console.log('submit-button-action');
        console.log('============================================');
        try {
            await ack();
            // @ts-ignore
            console.log(JSON.stringify(body.view.state));
        } catch (err) {
            console.error(err);
        }
    });

    boltApp.view('relative_time_submission', async ({ ack, body, client }) => {
        client;
        try {
            const blockIds: string[] = body.view.blocks
                .filter((block: KnownBlock) => block.type === 'input' && block.element.type === 'static_select')
                .map((block: any) => block.block_id);
            const [minutesRaw, hoursRaw, daysRaw]: string[] = blockIds.map(
                (bid: string) => body.view.state.values[bid]['static_select-action']['selected_option'].value,
            );
            const [minutes, hours, days]: number[] = [minutesRaw, hoursRaw, daysRaw].map(Number);
            if (minutes === 0 && hours === 0 && days === 0) {
                return ack({
                    response_action: 'errors',
                    errors: {
                        ...blockIds.reduce((obj: any, val) => ({ ...obj, [val]: 'Not all values can be 0' }), {}),
                    },
                });
            }
            await ack();

            const userId = body.user.id;
            const domain = body.team!.domain;
            const privateMetaData = JSON.parse(body.view.private_metadata);
            const channelId = privateMetaData.channel_id;
            const messageId = privateMetaData.message_id;
            console.log({
                uid: userId,
                domain,
                channelId,
                messageId,
                blockIds,
                minutesRaw,
                hoursRaw,
                daysRaw,
                minutes,
                hours,
                days,
            });
            const getPermalink = await client.chat.getPermalink({ channel: channelId, message_ts: messageId });
            if (!getPermalink.ok) {
                await client.chat.postEphemeral({
                    channel: channelId,
                    user: userId,
                    text:
                        'An unexpected error has occurred whilst attempting to get the link of the RemindMe message. Please try again.',
                });
                return;
            }
            const permalink = getPermalink['permalink'];

            const offset = ((days * 24 + hours) * 60 + minutes) * 60;

            const res = await client.chat.scheduleMessage({
                channel: userId,
                text: `Here's your reminder: ${permalink}`,
                post_at: String(Math.floor(Date.now() / 1000) + offset),
            });
            if (!res.ok) {
                await client.chat.postEphemeral({
                    channel: channelId,
                    user: userId,
                    text:
                        'An unexpected error has occurred whilst attempting to schedule the RemindMe message. Please try again.',
                });
            }
            await client.chat.postEphemeral({
                channel: channelId,
                user: userId,
                text: `Success! ${res['scheduled_message_id']}`,
            });
        } catch (err) {
            console.error(err);
        }
    });

    app.use(boltReceiver.router);

    await createConnection();

    const apolloServer = new ApolloServer({
        schema: await buildSchema({
            resolvers: [HelloWorldResolver, MovieResolver],
        }),
        context: ({ req, res }) => ({ req, res }),
    });

    apolloServer.applyMiddleware({ app, cors: false });

    app.listen(4000, () => {
        console.log('express server started');
    });
})();
