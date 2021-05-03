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

    boltApp.message('hello', async ({ message, say }) => {
        console.log('message');
        if (!isGenericMessageEvent(message)) return;
        console.log(message);
        message;
        await say(`Hey there, <@${message.user}>`);
    });

    boltApp.event('app_mention', async ({ context, event }) => {
        try {
            await boltApp.client.chat.postMessage({
                token: context.botToken,
                channel: event.channel,
                text: `Hey yoo <@${event.user}> you mentioned me`,
            });
        } catch (e) {
            console.log(`error responding ${e}`);
        }
    });

    boltApp.shortcut('remind_me_callback', async ({ shortcut, ack, client }) => {
        try {
            // Acknowledge shortcut request
            await ack();

            // Call the views.open method using one of the built-in WebClients
            const result = await client.views.open({
                trigger_id: shortcut.trigger_id,
                view: {
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
                                text: 'Hours',
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
                                text: 'Days',
                                emoji: true,
                            },
                        },
                        {
                            type: 'actions',
                            elements: [
                                {
                                    type: 'button',
                                    text: {
                                        type: 'plain_text',
                                        text: 'Submit Relative Time',
                                        emoji: true,
                                    },
                                    value: 'submit-button-action',
                                    action_id: 'actionId-0',
                                },
                            ],
                        },
                        // {
                        //     type: 'divider',
                        // },
                        // {
                        //     type: 'header',
                        //     text: {
                        //         type: 'plain_text',
                        //         text: 'Set Time',
                        //         emoji: true,
                        //     },
                        // },
                        // {
                        //     type: 'section',
                        //     text: {
                        //         type: 'mrkdwn',
                        //         text: 'What time do you want the reminder? (CT)',
                        //     },
                        //     accessory: {
                        //         type: 'timepicker',
                        //         initial_time: '13:37',
                        //         placeholder: {
                        //             type: 'plain_text',
                        //             text: 'Select time',
                        //             emoji: true,
                        //         },
                        //         action_id: 'timepicker-action',
                        //     },
                        // },
                        // {
                        //     type: 'section',
                        //     text: {
                        //         type: 'mrkdwn',
                        //         text: 'What date do you want the reminder? (CT)',
                        //     },
                        //     accessory: {
                        //         type: 'datepicker',
                        //         initial_date: '1990-04-28',
                        //         placeholder: {
                        //             type: 'plain_text',
                        //             text: 'Select a date',
                        //             emoji: true,
                        //         },
                        //         action_id: 'datepicker-action',
                        //     },
                        // },
                        // {
                        //     type: 'actions',
                        //     elements: [
                        //         {
                        //             type: 'button',
                        //             text: {
                        //                 type: 'plain_text',
                        //                 text: 'Submit Set Time',
                        //                 emoji: true,
                        //             },
                        //             value: 'click_me_123',
                        //             action_id: 'actionId-0',
                        //         },
                        //     ],
                        // },
                    ],
                },
            });
            console.log('result');

            console.log(result);
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

    boltApp.view('relative_time_submission', (oof: Object): any => {
        // @ts-ignore
        oof.ack();
        console.log(JSON.stringify(oof, null, 2));
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
