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
app.use(cors());
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

// Error Handling
app.use(errorHandler);

export default app;
