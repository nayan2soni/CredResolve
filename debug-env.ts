
import dotenv from 'dotenv';
dotenv.config();

console.log('--- Environment Check ---');
const dbUrl = process.env.DATABASE_URL;
const sbUrl = process.env.SUPABASE_URL;
const sbKey = process.env.SUPABASE_ANON_KEY;

console.log(`DATABASE_URL Present: ${!!dbUrl}`);
if (dbUrl) {
    console.log(`DATABASE_URL Protocol: ${dbUrl.split(':')[0]}`);
    console.log(`DATABASE_URL Params: ${dbUrl.split('?')[1] || '(none)'}`);
}

console.log(`SUPABASE_URL Present: ${!!sbUrl}`);
if (sbUrl) {
    console.log(`SUPABASE_URL Value (First 10 chars): ${sbUrl.substring(0, 10)}...`);
    // Validation check from Supabase Client
    try {
        new URL(sbUrl);
        console.log('SUPABASE_URL Format: Valid URL');
    } catch {
        console.error('SUPABASE_URL Format: INVALID URL');
    }
}

console.log(`SUPABASE_ANON_KEY Present: ${!!sbKey}`);
if (sbKey) {
    console.log(`SUPABASE_ANON_KEY Length: ${sbKey.length}`);
}
