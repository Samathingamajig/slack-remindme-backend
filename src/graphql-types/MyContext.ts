import { Request, Response } from 'express';

export interface MyContext {
    req: Request & {
        session?: {
            slackId: string | null;
        };
    };
    res: Response;
}
