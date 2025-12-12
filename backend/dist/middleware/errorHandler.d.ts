import { Request, Response, NextFunction } from 'express';
export declare class AppError extends Error {
    statusCode: number;
    code: string;
    details?: Record<string, string[]> | undefined;
    constructor(statusCode: number, code: string, message: string, details?: Record<string, string[]> | undefined);
}
export declare class ValidationError extends AppError {
    constructor(details: Record<string, string[]>);
}
export declare class AuthenticationError extends AppError {
    constructor();
}
export declare class AuthorizationError extends AppError {
    constructor();
}
export declare class NotFoundError extends AppError {
    constructor(resource: string);
}
export declare class ConflictError extends AppError {
    data?: Record<string, unknown>;
    constructor(message: string, data?: Record<string, unknown>);
}
export declare const errorHandler: (err: Error, _req: Request, res: Response, _next: NextFunction) => Response<any, Record<string, any>>;
//# sourceMappingURL=errorHandler.d.ts.map