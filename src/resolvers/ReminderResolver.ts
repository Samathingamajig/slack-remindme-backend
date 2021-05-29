import { Resolver, Query, Arg, Mutation, InputType, Field, Int, UseMiddleware, Ctx } from 'type-graphql';
import { LessThan } from 'typeorm';
import { Reminder } from './../entity/Reminder';
import { ReminderResponse } from '../graphql-types/ReminderResponse';
import { getBoltApp } from '../boltApp';
import { BooleanResponse } from '../graphql-types/BooleanResponse';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../graphql-types/MyContext';

@InputType()
class ReminderUpdateInput {
    @Field()
    id: string;

    @Field(() => Int)
    postAt: number;
}

@InputType()
class ReminderDeletionInput {
    @Field()
    id: string;
}

@Resolver()
export class ReminderResolver {
    @Query(() => [Reminder])
    @UseMiddleware(isAuth)
    myReminders(@Ctx() ctx: MyContext) {
        return Reminder.find({ where: { creatorId: ctx.req.session.slackId } });
    }

    @Mutation(() => Number)
    async removeFinished() {
        return (await Reminder.delete({ postAt: LessThan(Math.floor(Date.now() / 1000)) })).affected;
    }

    @Mutation(() => ReminderResponse)
    @UseMiddleware(isAuth)
    async updateReminder(
        @Arg('reminder', () => ReminderUpdateInput) { id, postAt }: ReminderUpdateInput,
        @Ctx() ctx: MyContext,
    ): Promise<ReminderResponse> {
        const creatorId = ctx.req.session.slackId;
        const boltApp = getBoltApp();
        if (!boltApp) {
            return {
                errors: [
                    {
                        path: '_',
                        message: 'Server side error, Slack bot has not been initialized',
                    },
                ],
            };
        }
        const _120days = 60 * 60 * 24 * 120;
        if (postAt < Math.floor(Date.now() / 1000 + 30) || postAt > Math.floor(Date.now() / 1000 + _120days)) {
            return {
                errors: [
                    {
                        path: 'postAt',
                        message: 'postAt must be a time in the future within 120 days',
                    },
                ],
            };
        }
        const oldReminder = (await Reminder.findOne({ id }))!;
        if (!oldReminder) {
            return {
                errors: [
                    {
                        path: 'id',
                        message: `Could not find a reminder with id ${id}`,
                    },
                ],
            };
        }
        if (oldReminder.creatorId !== creatorId) {
            return {
                errors: [
                    {
                        path: 'creatorId',
                        message: 'creatorId is not the same as the reminder',
                    },
                ],
            };
        }
        const { permalink, scheduledMessageId: oldScheduledMessageId } = oldReminder;
        try {
            const res = await boltApp.client.chat.scheduleMessage({
                channel: creatorId,
                post_at: String(postAt),
                text: `Here's your reminder: ${permalink}`,
            });

            const scheduledMessageId = res['scheduled_message_id'] as string;
            await Reminder.update({ id }, { postAt, scheduledMessageId });
        } catch (err) {
            console.log('CAUGHT SCHEDULE');
            console.error(err);
            return {
                errors: [
                    {
                        path: '_',
                        message: `Error creating scheduled message: ${err.data.error}`,
                    },
                ],
            };
        }
        try {
            // const deleteResponse =
            await boltApp.client.chat.deleteScheduledMessage({
                channel: creatorId,
                scheduled_message_id: oldScheduledMessageId,
            });
            // console.log(JSON.stringify(deleteResponse, null, 2));
        } catch (err) {
            console.log('CAUGHT DELETE SCHEDULED');
            console.error(err);
            return {
                errors: [
                    {
                        path: '_',
                        message: `Error deleting previously scheduled message: ${err.data.error}${err.data.error}`,
                    },
                ],
            };
        }

        const reminder = (await Reminder.findOne({ id }))!;
        return { reminder };
    }

    @Mutation(() => BooleanResponse)
    @UseMiddleware(isAuth)
    async removeReminder(
        @Arg('reminder', () => ReminderDeletionInput) { id }: ReminderDeletionInput,
        @Ctx() ctx: MyContext,
    ): Promise<BooleanResponse> {
        const boltApp = getBoltApp();
        if (!boltApp) {
            return {
                success: false,
                errors: [
                    {
                        path: '_',
                        message: 'Server side error, Slack bot has not been initialized',
                    },
                ],
            };
        }
        const reminder = (await Reminder.findOne({ id }))!;
        if (!reminder) {
            return {
                success: false,
                errors: [
                    {
                        path: 'id',
                        message: `Could not find a reminder with id ${id}`,
                    },
                ],
            };
        }
        const { scheduledMessageId } = reminder;
        try {
            // const deleteResponse =
            await boltApp.client.chat.deleteScheduledMessage({
                channel: ctx.req.session.slackId!,
                scheduled_message_id: scheduledMessageId,
            });
            // console.log(JSON.stringify(deleteResponse, null, 2));
        } catch (err) {
            console.log('CAUGHT DELETE SCHEDULED');
            console.error(err);
            return {
                success: false,
                errors: [
                    {
                        path: '_',
                        message: `Error deleting previously scheduled message: ${err.data.error}${err.data.error}`,
                    },
                ],
            };
        }
        try {
            const result = await Reminder.delete({ id });
            // console.log(JSON.stringify(result, null, 2));

            if (result.affected! > 0) {
                // console.log('success');
                return {
                    success: true,
                };
            } else {
                throw Error();
            }
        } catch (err) {
            console.log('fail');
            console.log(JSON.stringify(err, null, 2));
            return {
                success: false,
                errors: [
                    {
                        path: '_',
                        message: `Error deleting previously scheduled message from database`,
                    },
                ],
            };
        }
    }
}
