import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export const getBalances = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { groupId } = req.params;

        const balances = await prisma.balance.findMany({
            where: { groupId },
            include: {
                lender: { select: { id: true, username: true, email: true } },
                borrower: { select: { id: true, username: true, email: true } }
            }
        });

        res.status(200).json({
            status: 'success',
            results: balances.length,
            data: { balances }
        });
    } catch (error) {
        next(error);
    }
};
