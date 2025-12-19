import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';
import { AsyncLocalStorage } from 'async_hooks';

export interface RequestContext {
  correlationId: string;
  userId?: string;
  tenantId?: string;
  ipAddress?: string;
  userAgent?: string;
}

// Global async context storage
export const asyncLocalStorage = new AsyncLocalStorage<Map<string, any>>();

@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    // Get correlation ID from header or generate new one
    const correlationId = (req.headers['x-correlation-id'] as string) || randomUUID();

    // Set response header
    res.setHeader('X-Correlation-ID', correlationId);

    // Create context store
    const store = new Map<string, any>();
    store.set('correlationId', correlationId);
    store.set('userId', null);
    store.set('tenantId', null);
    store.set('ipAddress', req.ip);
    store.set('userAgent', req.headers['user-agent']);

    // Run rest of request in this context
    asyncLocalStorage.run(store, () => {
      next();
    });
  }
}

/**
 * Helper functions to access context from anywhere
 */
export function getCorrelationId(): string | undefined {
  const store = asyncLocalStorage.getStore();
  return store?.get('correlationId');
}

export function getCurrentUserId(): string | undefined {
  const store = asyncLocalStorage.getStore();
  return store?.get('userId');
}

export function getCurrentTenantId(): string | undefined {
  const store = asyncLocalStorage.getStore();
  return store?.get('tenantId');
}

export function setCurrentUser(userId: string, tenantId: string): void {
  const store = asyncLocalStorage.getStore();
  if (store) {
    store.set('userId', userId);
    store.set('tenantId', tenantId);
  }
}

export function getRequestContext(): RequestContext | null {
  const store = asyncLocalStorage.getStore();
  if (!store) return null;

  return {
    correlationId: store.get('correlationId'),
    userId: store.get('userId'),
    tenantId: store.get('tenantId'),
    ipAddress: store.get('ipAddress'),
    userAgent: store.get('userAgent'),
  };
}
