import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';

export const syncUser = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id, email, username } = req.body;

        if (!id || !email || !username) {
            return next(new AppError('Missing required fields', 400));
        }

        // Check if username is taken
        const existingUsername = await prisma.user.findUnique({
            where: { username }
        });

        if (existingUsername && existingUsername.id !== id) {
            return next(new AppError('Username already taken', 400));
        }

        const user = await prisma.user.upsert({
            where: { id },
            update: { email, username },
            create: { id, email, username }
        });

        res.status(200).json({
            status: 'success',
            data: { user }
        });
    } catch (error) {
        next(error);
    }
};
