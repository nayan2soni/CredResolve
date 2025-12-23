import prisma from '../config/prisma';

export const logAction = async (
    action: string,
    entityId: string,
    entityType: string,
    actorId: string,
    metadata?: any
) => {
    try {
        await prisma.auditLog.create({
            data: {
                action,
                entityId,
                entityType,
                actorId,
                metadata: metadata ? metadata : Prisma.JsonNull
            }
        });
    } catch (error) {
        console.error('Failed to create audit log:', error);
        // We do not throw here to avoid failing the main transaction if logging fails
    }
};

import { Prisma } from '@prisma/client';
