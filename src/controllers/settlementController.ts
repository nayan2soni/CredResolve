import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { updateBalances } from '../services/balanceService';
import { logAction } from '../services/auditService';

export const addSettlement = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { groupId, payeeId, amount } = req.body;
        const payerId = req.user!.id;

        if (!groupId || !payeeId || !amount) {
            return next(new AppError('Missing required fields', 400));
        }

        if (amount <= 0) {
            return next(new AppError('Amount must be positive', 400));
        }

        if (payerId === payeeId) {
            return next(new AppError('Cannot settle with yourself', 400));
        }

        const settlement = await prisma.$transaction(async (tx) => {
            // Create Settlement Record
            const newSettlement = await tx.settlement.create({
                data: {
                    groupId,
                    payerId,
                    payeeId,
                    amount
                }
            });

            // Trigger balance update
            await updateBalances(tx, groupId);

            return newSettlement;
        });

        logAction('SETTLEMENT_ADDED', settlement.id, 'SETTLEMENT', payerId, {
            amount,
            payeeId
        });

        res.status(201).json({
            status: 'success',
            data: { settlement }
        });

    } catch (error) {
        next(error);
    }
};
