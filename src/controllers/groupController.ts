import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';

export const createGroup = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { name, members } = req.body; // members = array of userIds
        const userId = req.user!.id;

        if (!name) {
            return next(new AppError('Group name is required', 400));
        }

        const group = await prisma.group.create({
            data: {
                name,
                createdBy: userId,
                members: {
                    create: [
                        { userId: userId }, // Add creator
                        ...([...new Set(members || [])] // Deduplicate
                            .filter((id: string) => id !== userId) // Remove creator if present
                            .map((id: string) => ({ userId: id })))
                    ]
                }
            },
            include: {
                members: {
                    include: {
                        user: {
                            select: { id: true, username: true }
                        }
                    }
                }
            }
        });

        res.status(201).json({
            status: 'success',
            data: { group }
        });
    } catch (error) {
        next(error);
    }
};

export const getGroups = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;

        const groups = await prisma.group.findMany({
            where: {
                members: {
                    some: {
                        userId
                    }
                }
            },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, username: true } }
                    }
                },
                _count: {
                    select: { expenses: true }
                }
            }
        });

        res.status(200).json({
            status: 'success',
            results: groups.length,
            data: { groups }
        });
    } catch (error) {
        next(error);
    }
};

export const getGroupById = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const userId = req.user!.id;

        const group = await prisma.group.findUnique({
            where: { id },
            include: {
                members: {
                    include: {
                        user: { select: { id: true, username: true, email: true } }
                    }
                },
                expenses: {
                    take: 5,
                    orderBy: { createdAt: 'desc' },
                    include: {
                        payer: { select: { username: true } }
                    }
                }
            }
        });

        if (!group) {
            return next(new AppError('Group not found', 404));
        }

        // Check if user is member
        const isMember = group.members.some(m => m.userId === userId);
        if (!isMember) {
            return next(new AppError('Not authorized to view this group', 403));
        }

        res.status(200).json({
            status: 'success',
            data: { group }
        });
    } catch (error) {
        next(error);
    }
};
