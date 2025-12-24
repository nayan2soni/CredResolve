import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import helmet from 'helmet';
import { errorHandler } from './middleware/errorHandler';
// Routes
import authRoutes from './routes/authRoutes';
import groupRoutes from './routes/groupRoutes';
import expenseRoutes from './routes/expenseRoutes';
import balanceRoutes from './routes/balanceRoutes';
import userRoutes from './routes/userRoutes';
import settlementRoutes from './routes/settlementRoutes';

const app = express();

// ... Middleware ... 

app.use(helmet());
app.use(cors({
    origin: '*', // Allow all origins for now (or exact frontend URL if needed)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    allowedHeaders: ['Content-Type', 'Authorization']
}));
// app.options('*', cors()); // Removed: Incompatible with Express 5 wildcard syntax. app.use(cors()) handles preflight.
app.use(morgan('dev'));
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/balances', balanceRoutes);
app.use('/api/settlements', settlementRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.get('/api/debug-db', async (req, res) => {
    try {
        const { PrismaClient } = await import('@prisma/client');
        const prisma = new PrismaClient();
        await prisma.$connect();
        const userCount = await prisma.user.count();
        res.status(200).json({ status: 'ok', message: 'Connected to DB', userCount });
    } catch (error: any) {
        console.error('DB Connection Failed:', error);
        res.status(500).json({
            status: 'error',
            message: error.message,
            stack: error.stack,
            env: {
                hasDbUrl: !!process.env.DATABASE_URL,
                nodeVersion: process.version
            }
        });
    }
});

// Error Handling
app.use(errorHandler);

export default app;
