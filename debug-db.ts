
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient({
    datasources: {
        db: {
            url: process.env.DATABASE_URL
        }
    },
    log: ['info', 'query', 'warn', 'error']
});

async function main() {
    console.log('--- Database Connection Diagnostic ---');

    const url = process.env.DATABASE_URL || '';
    if (!url) {
        console.error('ERROR: DATABASE_URL is not set in environment.');
        process.exit(1);
    }

    // Safe print of URL structure
    try {
        // Manual parsing to avoid URL object throwing on bad protocols if any
        const parts = url.split('@');
        if (parts.length > 1) {
            const tail = parts[1];
            const [hostPort, params] = tail.split('?');
            console.log(`Target Host:Port : ${hostPort}`);
            console.log(`Params           : ${params || '(none)'}`);

            if (hostPort.includes(':6543') && (!params || !params.includes('pgbouncer=true'))) {
                console.warn('\nWARNING: You are using port 6543 (Supabase Transaction Pooler) but "pgbouncer=true" seems missing from the connection string parameters.');
                console.warn('Recommendation: Append "?pgbouncer=true&connection_limit=1" to your DATABASE_URL.\n');
            }
        } else {
            console.log('URL format seems irregular, could not parse host/params safely.');
        }
    } catch (e) {
        console.log('Could not parse URL for diagnostics.');
    }

    console.log('Attempting to connect with 10s timeout...');

    // Race promise to enforce timeout if network hangs
    const connectPromise = prisma.$connect();
    const timeoutPromise = new Promise((_, reject) => setTimeout(() => reject(new Error('Connection Timed Out (10s)')), 10000));

    try {
        await Promise.race([connectPromise, timeoutPromise]);
        console.log('SUCCESS: Connected to database!');

        // Try a simple query
        const result = await prisma.$queryRaw`SELECT 1 as connected`;
        console.log('Query Result:', result);

    } catch (e: any) {
        console.error('\nCONNECTION FAILED:');
        console.error(e.message);
        if (e.code) console.error('Error Code:', e.code);
    } finally {
        await prisma.$disconnect();
    }
}

main();
