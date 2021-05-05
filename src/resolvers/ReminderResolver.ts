import { Resolver, Query, Arg, Mutation } from 'type-graphql';
import { LessThan } from 'typeorm';

import { Reminder } from './../entity/Reminder';

@Resolver()
export class ReminderResolver {
    @Query(() => [Reminder])
    allReminders() {
        return Reminder.find();
    }

    @Query(() => [Reminder])
    myReminders(@Arg('creatorId', () => String) creatorId: string) {
        return Reminder.find({ where: { creatorId } });
    }

    @Mutation(() => Number)
    async removeFinished() {
        return (await Reminder.delete({ postAt: LessThan(Math.floor(Date.now() / 1000)) })).affected;
    }
}
