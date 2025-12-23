import { PrismaClient, SplitType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
    console.log('Start seeding ...');

    // clean up
    await prisma.auditLog.deleteMany();
    await prisma.settlement.deleteMany();
    await prisma.balance.deleteMany();
    await prisma.split.deleteMany();
    await prisma.expense.deleteMany();
    await prisma.groupMember.deleteMany();
    await prisma.group.deleteMany();
    await prisma.user.deleteMany();

    // Create Users
    const alice = await prisma.user.create({
        data: {
            username: 'alice',
            email: 'alice@example.com',
        },
    });

    const bob = await prisma.user.create({
        data: {
            username: 'bob',
            email: 'bob@example.com',
        },
    });

    const charlie = await prisma.user.create({
        data: {
            username: 'charlie',
            email: 'charlie@example.com',
        },
    });

    console.log(`Created users: ${alice.username}, ${bob.username}, ${charlie.username}`);

    // Create Group
    const tripGroup = await prisma.group.create({
        data: {
            name: 'Goa Trip 2025',
            createdBy: alice.id,
            members: {
                create: [
                    { userId: alice.id },
                    { userId: bob.id },
                    { userId: charlie.id },
                ],
            },
        },
    });

    console.log(`Created group: ${tripGroup.name}`);

    // Create Expenses
    // 1. Alice pays 3000 for Flight, split equally
    const flightExpense = await prisma.expense.create({
        data: {
            description: 'Flight Tickets',
            amount: 3000,
            payerId: alice.id,
            groupId: tripGroup.id,
            splitType: SplitType.EQUAL,
            splits: {
                create: [
                    { userId: alice.id, amount: 1000 },
                    { userId: bob.id, amount: 1000 },
                    { userId: charlie.id, amount: 1000 },
                ],
            },
        },
    });

    // 2. Bob pays 1500 for Hotel, split equally
    const hotelExpense = await prisma.expense.create({
        data: {
            description: 'Hotel Stay',
            amount: 1500,
            payerId: bob.id,
            groupId: tripGroup.id,
            splitType: SplitType.EQUAL,
            splits: {
                create: [
                    { userId: alice.id, amount: 500 },
                    { userId: bob.id, amount: 500 },
                    { userId: charlie.id, amount: 500 },
                ],
            },
        },
    });

    // 3. Charlie pays 600 for Dinner, Alice didn't eat (Split between Bob and Charlie)
    const dinnerExpense = await prisma.expense.create({
        data: {
            description: 'Dinner at Beach',
            amount: 600,
            payerId: charlie.id,
            groupId: tripGroup.id,
            splitType: SplitType.EXACT,
            splits: {
                create: [
                    // Alice 0
                    { userId: bob.id, amount: 300 },
                    { userId: charlie.id, amount: 300 },
                ],
            },
        },
    });

    console.log('Created expenses');

    // Note: We are NOT calculating balances here effectively because that requires running the balance service.
    // The seed script just inserts raw data. 
    // However, we can manually insert some expected balances if we want, OR we can rely on the app to calc them.
    // For now, I'll validly calculate the balances for these transactions and insert them so the dashboard looks good immediately.

    /*
      Net Flows:
      Alice:
        Pays: 3000
        Consumes: 1000 (Flight) + 500 (Hotel) = 1500
        Net: +1500 (Owed 1500)
      
      Bob:
        Pays: 1500
        Consumes: 1000 (Flight) + 500 (Hotel) + 300 (Dinner) = 1800
        Net: -300 (Owes 300)
        
      Charlie: 
        Pays: 600
        Consumes: 1000 (Flight) + 500 (Hotel) + 300 (Dinner) = 1800
        Net: -1200 (Owes 1200)
        
      Simplification:
      Bob owes Alice 300.
      Charlie owes Alice 1200.
    */

    await prisma.balance.createMany({
        data: [
            { groupId: tripGroup.id, lenderId: alice.id, borrowerId: bob.id, amount: 300 },
            { groupId: tripGroup.id, lenderId: alice.id, borrowerId: charlie.id, amount: 1200 },
        ]
    });

    console.log('Seeding finished.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
