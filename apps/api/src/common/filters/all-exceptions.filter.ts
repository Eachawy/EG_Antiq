import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';
import { Request, Response } from 'express';
import { logger } from '../../logger';
import { AppError } from '../errors/base.error';
import { getCorrelationId } from '../middleware/correlation-id.middleware';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();
    const correlationId = getCorrelationId();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let errorCode = 'INTERNAL_ERROR';
    let message = 'Internal server error';
    let details: any = undefined;

    // Handle different error types
    if (exception instanceof AppError) {
      // Custom application errors
      status = exception.statusCode;
      errorCode = exception.code;
      message = exception.message;
      details = exception.metadata;

      logger.warn('Application error', {
        correlationId,
        code: errorCode,
        message,
        details,
        path: request.url,
        method: request.method,
      });
    } else if (exception instanceof HttpException) {
      // NestJS HTTP exceptions
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'object') {
        errorCode = (exceptionResponse as any).error || 'HTTP_ERROR';
        message = (exceptionResponse as any).message || exception.message;
        details = (exceptionResponse as any).details;
      } else {
        message = exceptionResponse as string;
      }

      logger.warn('HTTP exception', {
        correlationId,
        statusCode: status,
        message,
        path: request.url,
        method: request.method,
      });
    } else if (exception instanceof Error) {
      // Generic errors
      message = exception.message;

      logger.error('Unhandled error', {
        correlationId,
        error: exception.message,
        stack: exception.stack,
        path: request.url,
        method: request.method,
      });
    } else {
      // Unknown errors
      logger.error('Unknown error', {
        correlationId,
        exception,
        path: request.url,
        method: request.method,
      });
    }

    // Build error response
    const errorResponse = {
      error: {
        code: errorCode,
        message,
        ...(details && { details }),
      },
      meta: {
        timestamp: new Date().toISOString(),
        correlationId,
        path: request.url,
      },
    };

    // Send response
    response.status(status).json(errorResponse);
  }
}
