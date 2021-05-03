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
} from '@slack/bolt';
import { HelloWorldResolver } from './resolvers/HelloWorldResolver';
import { MovieResolver } from './resolvers/MovieResolver';

const getMessagePermalink = (domain: string, channelId: string, messageId: string) =>
    `https://${domain}.slack.com/archives/${channelId}/p${messageId}`;

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

    boltApp.shortcut('remind_me_callback', async ({ shortcut, ack, client, body }) => {
        try {
            // Acknowledge shortcut request
            await ack();
            console.log(JSON.stringify(body, null, 2));

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
                        {
                            type: 'input',
                            element: {
                                type: 'plain_text_input',
                                action_id: 'plain_text_input-action',
                                initial_value: '0',
                            },
                            label: {
                                type: 'plain_text',
                                text: 'Minutes',
                                emoji: false,
                            },
                        },
                        {
                            type: 'input',
                            element: {
                                type: 'plain_text_input',
                                action_id: 'plain_text_input-action',
                                initial_value: '0',
                            },
                            label: {
                                type: 'plain_text',
                                text: 'Hours',
                                emoji: false,
                            },
                        },
                        {
                            type: 'input',
                            element: {
                                type: 'plain_text_input',
                                action_id: 'plain_text_input-action',
                                initial_value: '0',
                            },
                            label: {
                                type: 'plain_text',
                                text: 'Days',
                                emoji: false,
                            },
                        },
                    ],
                },
            });
            // console.log('result');

            // console.log(result);
        } catch (error) {
            console.error(error);
        }
    });

    boltApp.action('timepicker-action', async ({ ack }) => {
        console.log('timepicker-action');
        console.log('============================================');
        try {
            await ack();
            // console.log({ body });
        } catch (err) {
            console.error(err);
        }
    });

    boltApp.action('datepicker-action', async ({ ack }) => {
        console.log('datepicker-action');
        console.log('============================================');
        try {
            await ack();
            // console.log({ body });
        } catch (err) {
            console.error(err);
        }
    });

    boltApp.action('submit-button-action', async ({ ack, body }) => {
        console.log('submit-button-action');
        console.log('============================================');
        try {
            await ack();
            // console.log({ body });
            // @ts-ignore
            console.log(JSON.stringify(body.view.state));
        } catch (err) {
            console.error(err);
        }
    });

    boltApp.view('relative_time_submission', async ({ ack, body }) => {
        try {
            await ack();
            const uid = body.user.id;
            const domain = body.team!.domain;
            const privateMetaData = JSON.parse(body.view.private_metadata);
            const channelId = privateMetaData.channel_id;
            const messageId = privateMetaData.message_id
                .split('')
                .filter((char: string) => char !== '.')
                .join('');
            const blockIds = body.view.blocks
                .filter((block: any) => block?.type === 'input')
                .map((block: any) => block?.block_id);
            const [minutesRaw, hoursRaw, daysRaw]: string[] = blockIds.map(
                (bid: string) => body.view.state.values[bid]['plain_text_input-action'].value,
            );
            console.log({ uid, domain, channelId, messageId, blockIds, minutesRaw, hoursRaw, daysRaw });
            console.log(getMessagePermalink(domain, channelId, messageId));
            // console.log(JSON.stringify(all, null, 4));
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
