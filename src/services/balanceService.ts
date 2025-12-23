import { Prisma, PrismaClient } from '@prisma/client';

export const updateBalances = async (tx: Prisma.TransactionClient, groupId: string) => {
    // 1. Fetch all expenses for the group (Simplified approach: Re-calculate from scratch for correctness)
    // Optimization: In a real large-scale system, we would calculate changes incrementally. 
    // For this design, we will recalculate net flows to guarantee eventual consistency and handle edits easily.

    const expenses = await tx.expense.findMany({
        where: { groupId, isArchived: false },
        include: { splits: true }
    });

    const settlements = await tx.settlement.findMany({
        where: { groupId }
    });

    // 2. Calculate Net Flow for each user
    // Map<userId, netAmount> (Positive = Receives, Negative = Owes)
    const netFlow = new Map<string, number>();

    const addToFlow = (userId: string, amount: number) => {
        const current = netFlow.get(userId) || 0;
        netFlow.set(userId, current + amount);
    };

    // Process Expenses
    for (const expense of expenses) {
        // Payer 'receives' the total amount (conceptually, they lend it out)
        addToFlow(expense.payerId, Number(expense.amount));

        // Splitters 'owe' their share
        for (const split of expense.splits) {
            addToFlow(split.userId, -Number(split.amount));
        }
    }

    // Process Settlements
    for (const settlement of settlements) {
        // Payer 'paid', so their debt decreases (net flow increases)
        addToFlow(settlement.payerId, Number(settlement.amount));
        // Payee 'received', so their credit decreases (net flow decreases)
        addToFlow(settlement.payeeId, -Number(settlement.amount));
    }

    // 3. Simplify Balances (Greedy Algorithm)
    // Separate into debtors and creditors
    const debtors: { id: string; amount: number }[] = [];
    const creditors: { id: string; amount: number }[] = [];

    for (const [userId, amount] of netFlow.entries()) {
        if (Math.abs(amount) < 0.01) continue; // Ignore dust
        if (amount > 0) {
            creditors.push({ id: userId, amount });
        } else {
            debtors.push({ id: userId, amount: -amount }); // Store debt as positive magnitude
        }
    }

    // Clear existing balances for the group before inserting new simplified ones
    await tx.balance.deleteMany({
        where: { groupId }
    });

    // Match debtors to creditors
    // Optimization: Sort might help reduce number of edges, but greedy works for correctness.
    // Sorting by magnitude descending often simplifies nicely.
    debtors.sort((a, b) => b.amount - a.amount);
    creditors.sort((a, b) => b.amount - a.amount);

    let i = 0; // debtor index
    let j = 0; // creditor index

    const newBalances = [];

    while (i < debtors.length && j < creditors.length) {
        const debtor = debtors[i];
        const creditor = creditors[j];

        const amount = Math.min(debtor.amount, creditor.amount);

        if (amount > 0) {
            newBalances.push({
                groupId,
                lenderId: creditor.id,
                borrowerId: debtor.id,
                amount
            });
        }

        // Update remaining amounts
        debtor.amount -= amount;
        creditor.amount -= amount;

        // Move pointers if settled
        if (debtor.amount < 0.01) i++;
        if (creditor.amount < 0.01) j++;
    }

    // Bulk Insert New Balances
    if (newBalances.length > 0) {
        await tx.balance.createMany({
            data: newBalances
        });
    }
};
