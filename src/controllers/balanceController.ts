
import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AuthRequest } from '../middleware/auth';

export const getUserBalance = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const userId = req.user!.id;

        // Fetch all balances where user is borrower (owes) or lender (owed)
        const balances = await prisma.balance.findMany({
            where: {
                OR: [
                    { borrowerId: userId },
                    { lenderId: userId }
                ]
            }
        });

        let totalOwed = 0; // User is lender
        let totalDebt = 0; // User is borrower

        balances.forEach(b => {
            if (b.lenderId === userId) {
                totalOwed += Number(b.amount);
            } else if (b.borrowerId === userId) {
                totalDebt += Number(b.amount);
            }
        });

        res.status(200).json({
            status: 'success',
            data: {
                totalOwed,
                totalDebt
            }
        });

    } catch (error) {
        next(error);
    }
};
