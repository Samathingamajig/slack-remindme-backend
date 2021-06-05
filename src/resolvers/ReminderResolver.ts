import { Resolver, Query, Arg, Mutation, InputType, Field, Int, UseMiddleware, Ctx } from 'type-graphql';
import { getConnection, LessThan } from 'typeorm';
import { Reminder } from './../entity/Reminder';
import { ReminderResponse } from '../graphql-types/ReminderResponse';
import { getBoltApp } from '../boltApp';
import { BooleanResponse } from '../graphql-types/BooleanResponse';
import { isAuth } from '../middleware/isAuth';
import { MyContext } from '../graphql-types/MyContext';
import { ReminderIdsResponse } from './../graphql-types/ReminderIdsResponse';

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
        return Reminder.find({ where: { creatorId: ctx.req.session.slackId }, order: { postAt: 'ASC' } });
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
        let newReminder: Reminder = new Reminder();
        Object.assign(newReminder, oldReminder);
        newReminder.postAt = postAt;
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
        if (oldReminder.postAt > Math.floor(Date.now() / 1000)) {
            try {
                await boltApp.client.chat.deleteScheduledMessage({
                    channel: creatorId,
                    scheduled_message_id: oldScheduledMessageId,
                });
            } catch (err) {
                console.log('CAUGHT DELETE SCHEDULED');
                console.error(err);
                return {
                    reminder: newReminder,
                    errors: [
                        {
                            path: '_',
                            message: `Reminder was successfully updated, by an error occurred while deleting previously scheduled message. This most likely means you'll get an extra reminder ping.\n${err.data.error}`,
                        },
                    ],
                };
            }
        }

        return { reminder: newReminder };
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
        const { scheduledMessageId, postAt } = reminder;
        if (postAt * 1000 > Date.now()) {
            try {
                await boltApp.client.chat.deleteScheduledMessage({
                    channel: ctx.req.session.slackId!,
                    scheduled_message_id: scheduledMessageId,
                });
            } catch (err) {
                console.log('CAUGHT DELETE SCHEDULED');
                console.error(err);
                return {
                    success: false,
                    errors: [
                        {
                            path: '_',
                            message: `Error deleting previously scheduled message: ${err.data.error}`,
                        },
                    ],
                };
            }
        }
        try {
            const result = await Reminder.delete({ id });
            if (result.affected! > 0) {
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

    @Mutation(() => ReminderIdsResponse)
    @UseMiddleware(isAuth)
    async removeMyExpiredReminders(@Ctx() ctx: MyContext): Promise<ReminderIdsResponse> {
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
        const deletionQueryResponse = await getConnection()
            .createQueryBuilder()
            .delete()
            .from(Reminder)
            .where('creatorId = :creatorId AND postAt < :postAt', {
                creatorId: ctx.req.session.slackId,
                postAt: Math.floor(Date.now() / 1000),
            })
            .returning('id')
            .execute();
        return { reminderIds: (deletionQueryResponse.raw as { id: string }[]).map(({ id }) => id) };
    }
}
