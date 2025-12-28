declare const router: import("express-serve-static-core").Router;
declare const MAX_FILE_SIZE: number;
declare const ALLOWED_MIME_TYPES: string[];
declare const ALLOWED_EXTENSIONS: string[];
/**
 * Validate resume file format and size for public applications
 * Requirements: 5.5
 */
export declare const validatePublicResumeFile: (file: {
    mimetype: string;
    size: number;
    originalname: string;
}) => {
    valid: boolean;
    error?: string;
};
export { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE };
export default router;
//# sourceMappingURL=public.routes.d.ts.map