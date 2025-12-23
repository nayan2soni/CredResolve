import { updateBalances } from '../../src/services/balanceService';
// import { PrismaClient } from '@prisma/client';

// Mock Prisma
// const prisma = new PrismaClient(); // Removed unused instantiation

// We will mock the transaction client
const mockTx = {
    expense: {
        findMany: jest.fn()
    },
    settlement: {
        findMany: jest.fn()
    },
    balance: {
        deleteMany: jest.fn(),
        createMany: jest.fn()
    }
} as any;

describe('Balance Service - Simplification Algorithm', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    it('should simplify a simple A->B debt', async () => {
        // A pays 100, split equally between A and B.
        // A pays 100. A's share 50. B's share 50.
        // Net: A pays 100, consumes 50. Net +50.
        //      B pays 0, consumes 50. Net -50.
        // Balance: B owes A 50.

        mockTx.expense.findMany.mockResolvedValue([
            {
                payerId: 'userA',
                amount: 100,
                splits: [
                    { userId: 'userA', amount: 50 },
                    { userId: 'userB', amount: 50 }
                ]
            }
        ]);
        mockTx.settlement.findMany.mockResolvedValue([]);

        await updateBalances(mockTx, 'group1');

        expect(mockTx.balance.createMany).toHaveBeenCalledWith({
            data: [
                {
                    groupId: 'group1',
                    lenderId: 'userA',
                    borrowerId: 'userB',
                    amount: 50
                }
            ]
        });
    });

    it('should eliminate cycles (A->B->C->A)', async () => {
        // A pays for B (100) -> B owes A 100
        // B pays for C (100) -> C owes B 100
        // C pays for A (100) -> A owes C 100
        // Net Flows:
        // A: Paid 100 (for B). Consumed 100 (from C). Net: 0? 
        // Let's trace carefully:
        // Expense 1: Payer A, Amount 100. Split: B consumes 100. (Simplification: B owes A 100)
        // Expense 2: Payer B, Amount 100. Split: C consumes 100. (Simplification: C owes B 100)
        // Expense 3: Payer C, Amount 100. Split: A consumes 100. (Simplification: A owes C 100)

        // Net Calculation:
        // A: Pays 100. Consumes 100. Net 0.
        // B: Pays 100. Consumes 100. Net 0.
        // C: Pays 100. Consumes 100. Net 0.

        // Result: No balances should be created.

        mockTx.expense.findMany.mockResolvedValue([
            {
                payerId: 'userA',
                amount: 100,
                splits: [{ userId: 'userB', amount: 100 }]
            },
            {
                payerId: 'userB',
                amount: 100,
                splits: [{ userId: 'userC', amount: 100 }]
            },
            {
                payerId: 'userC',
                amount: 100,
                splits: [{ userId: 'userA', amount: 100 }]
            }
        ]);
        mockTx.settlement.findMany.mockResolvedValue([]);

        await updateBalances(mockTx, 'group1');

        // Expect NO balances to be created
        // check if createMany was called with empty array or not called (logic handles checking length > 0)
        // If length was 0, our code doesn't call createMany.
        expect(mockTx.balance.createMany).not.toHaveBeenCalled();
    });

    it('should simplify A owes B, B owes C -> A owes C', async () => {
        // A owes B 50. (B paid 50 for A)
        // B owes C 50. (C paid 50 for B)
        // Net:
        // A: Pays 0. Consumes 50. Net -50.
        // B: Pays 50. Consumes 50. Net 0.
        // C: Pays 50. Consumes 0. Net +50.
        // Result: A owes C 50.

        mockTx.expense.findMany.mockResolvedValue([
            {
                payerId: 'userB',
                amount: 50,
                splits: [{ userId: 'userA', amount: 50 }]
            },
            {
                payerId: 'userC',
                amount: 50,
                splits: [{ userId: 'userB', amount: 50 }]
            }
        ]);
        mockTx.settlement.findMany.mockResolvedValue([]);

        await updateBalances(mockTx, 'group1');

        expect(mockTx.balance.createMany).toHaveBeenCalledWith({
            data: [
                {
                    groupId: 'group1',
                    lenderId: 'userC',
                    borrowerId: 'userA',
                    amount: 50
                }
            ]
        });
    });
});
