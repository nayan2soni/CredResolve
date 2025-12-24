import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';
import { AppError } from '../utils/AppError';
import { AuthRequest } from '../middleware/auth';
import { Prisma } from '@prisma/client';
import { logAction } from '../services/auditService';

export const addExpense = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { groupId, amount, description, splitType, splits, payerId } = req.body;
        const userId = req.user!.id; // The user creating the expense

        // Validate inputs
        if (!groupId || !amount || !description || !splitType || !payerId) {
            return next(new AppError('Missing required fields', 400));
        }

        if (amount <= 0) {
            return next(new AppError('Amount must be positive', 400));
        }

        // Validate Splits Logic
        let calculatedSplits = [];

        if (splitType === 'EQUAL') {
            // Expect splits to be just a list of userIds or we fetch all group members
            // For MVP simplify: expect 'splits' to be array of userIds involved
            if (!splits || !Array.isArray(splits) || splits.length === 0) {
                return next(new AppError('Splits must be an array of user IDs for EQUAL split', 400));
            }
            const count = splits.length;
            const share = amount / count;
            calculatedSplits = splits.map(uid => ({
                userId: uid,
                amount: share
            }));
        } else if (splitType === 'EXACT') {
            if (!splits || !Array.isArray(splits)) {
                return next(new AppError('Splits must be provided for EXACT split', 400));
            }
            // splits: [{ userId: '...', amount: 100 }]
            const totalSplit = splits.reduce((sum: number, s: any) => sum + Number(s.amount), 0);
            if (Math.abs(totalSplit - amount) > 0.01) { // Floating point tolerance
                return next(new AppError(`Split amounts sum (${totalSplit}) does not match total (${amount})`, 400));
            }
            calculatedSplits = splits;
        } else if (splitType === 'PERCENT') {
            if (!splits || !Array.isArray(splits)) {
                return next(new AppError('Splits must be provided for PERCENT split', 400));
            }
            // splits: [{ userId: '...', percent: 50 }]
            const totalPercent = splits.reduce((sum: number, s: any) => sum + Number(s.percent || 0), 0);
            if (Math.abs(totalPercent - 100) > 0.1) {
                return next(new AppError('Percentages must sum to 100', 400));
            }
            calculatedSplits = splits.map((s: any) => ({
                userId: s.userId,
                amount: (amount * (s.percent / 100))
            }));
        } else {
            return next(new AppError('Invalid split type', 400));
        }

        // Transaction to create expense and splits
        const expense = await prisma.$transaction(async (tx) => {
            // Create Expense
            const newExpense = await tx.expense.create({
                data: {
                    groupId,
                    payerId,
                    amount,
                    description,
                    splitType,
                    splits: {
                        create: calculatedSplits.map((s: any) => ({
                            userId: s.userId,
                            amount: s.amount
                        }))
                    }
                },
                include: {
                    splits: true,
                    payer: {
                        select: { id: true, username: true }
                    }
                }
            });

            // Update Balances (Simplified for MVP Step 1: Just logging, will implement full algo next)
            // Note: Actual balance update logic will be complex. 
            // For now we just record the expense. The balance calculation endpoint will likely derive balances 
            // or we update a running balance here.
            // Let's call a helper to update balances.
            await updateBalances(tx, groupId);

            return newExpense;
        });

        // Logging after transaction to not block/fail essential flow
        logAction('EXPENSE_CREATED', expense.id, 'EXPENSE', userId, { amount, description, splitType });

        res.status(201).json({
            status: 'success',
            data: { expense }
        });

    } catch (error) {
        next(error);
    }
};

// Helper to update balances
async function updateBalances(tx: Prisma.TransactionClient, groupId: string) {
    // Use the service
    const { updateBalances: serviceUpdate } = await import('../services/balanceService');
    await serviceUpdate(tx, groupId);
}

export const getGroupExpenses = async (req: AuthRequest, res: Response, next: NextFunction) => {
    try {
        const { groupId } = req.params;
        const expenses = await prisma.expense.findMany({
            where: { groupId },
            include: {
                splits: true,
                payer: { select: { id: true, username: true } }
            },
            orderBy: { createdAt: 'desc' }
        });

        res.status(200).json({
            status: 'success',
            results: expenses.length,
            data: { expenses }
        });
    } catch (error) {
        next(error);
    }
};
