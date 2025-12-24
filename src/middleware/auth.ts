import { Request, Response, NextFunction } from 'express';
import { supabase } from '../config/supabase';

export interface AuthRequest extends Request {
    user?: {
        id: string;
        email?: string;
    };
}

export const requireAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
        return res.status(401).json({ error: 'Missing authorization header' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const { data: { user }, error } = await supabase.auth.getUser(token);

        if (error || !user) {
            return res.status(401).json({ error: 'Invalid token' });
        }

        // Lazy Sync: Ensure user exists in local DB
        // We use upsert to handle race conditions or existing users
        const prisma = require('../config/prisma').default;

        // Use user_metadata for username if available, fallback to email prefix
        const username = user.user_metadata?.username || user.email?.split('@')[0] || 'user_' + user.id.substring(0, 8);

        await prisma.user.upsert({
            where: { id: user.id },
            update: {
                email: user.email!,
                // Don't overwrite username if already set, unless you want to sync it from Supabase always
            },
            create: {
                id: user.id,
                email: user.email!,
                username: username
            }
        });

        req.user = {
            id: user.id,
            email: user.email
        };

        next();
    } catch (err: any) {
        console.error('Auth Middleware Error:', err);
        return res.status(500).json({ error: 'Internal server error during auth', details: err.message });
    }
};
