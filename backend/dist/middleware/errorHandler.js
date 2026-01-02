export class AppError extends Error {
    statusCode;
    code;
    details;
    constructor(statusCode, code, message, details) {
        super(message);
        this.statusCode = statusCode;
        this.code = code;
        this.details = details;
        this.name = 'AppError';
    }
}
export class ValidationError extends AppError {
    constructor(details) {
        super(400, 'VALIDATION_ERROR', 'Validation failed', details);
    }
}
export class AuthenticationError extends AppError {
    constructor() {
        super(401, 'AUTHENTICATION_ERROR', 'Invalid credentials');
    }
}
export class AuthorizationError extends AppError {
    constructor() {
        super(403, 'AUTHORIZATION_ERROR', 'Access denied');
    }
}
export class NotFoundError extends AppError {
    constructor(resource) {
        super(404, 'NOT_FOUND', `${resource} not found`);
    }
}
export class ForbiddenError extends AppError {
    constructor(message = 'Access denied') {
        super(403, 'FORBIDDEN', message);
    }
}
export class ConflictError extends AppError {
    data;
    constructor(message, data) {
        super(409, 'CONFLICT', message);
        this.data = data;
    }
}
export const errorHandler = (err, _req, res, _next) => {
    if (err instanceof ConflictError) {
        return res.status(err.statusCode).json({
            code: err.code,
            message: err.message,
            data: err.data,
        });
    }
    if (err instanceof AppError) {
        return res.status(err.statusCode).json({
            code: err.code,
            message: err.message,
            details: err.details,
        });
    }
    console.error('Unexpected error:', err);
    return res.status(500).json({
        code: 'INTERNAL_ERROR',
        message: 'An unexpected error occurred',
    });
};
//# sourceMappingURL=errorHandler.js.map