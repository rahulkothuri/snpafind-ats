/**
 * Candidate Attachment interface
 * Requirements: 6.4, 6.5
 */
export interface CandidateAttachment {
    id: string;
    candidateId: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
    uploaderName: string;
    createdAt: Date;
}
export interface UploadAttachmentData {
    candidateId: string;
    fileName: string;
    fileUrl: string;
    fileType: string;
    fileSize: number;
    uploadedBy: string;
}
export declare const ALLOWED_ATTACHMENT_EXTENSIONS: string[];
export declare const ALLOWED_ATTACHMENT_MIME_TYPES: string[];
export declare const MAX_ATTACHMENT_SIZE: number;
/**
 * Validate attachment file format and size
 * Requirements: 6.4
 */
export declare const validateAttachment: (file: {
    mimetype: string;
    size: number;
    originalname: string;
}) => {
    valid: boolean;
    error?: string;
};
export declare const attachmentsService: {
    /**
     * Upload an attachment for a candidate
     * Requirements: 6.4, 6.5
     */
    uploadAttachment(data: UploadAttachmentData): Promise<CandidateAttachment>;
    /**
     * Get all attachments for a candidate
     * Requirements: 6.5
     */
    getAttachments(candidateId: string): Promise<CandidateAttachment[]>;
    /**
     * Get a single attachment by ID
     */
    getAttachmentById(attachmentId: string): Promise<CandidateAttachment>;
    /**
     * Delete an attachment
     * Requirements: 6.4
     */
    deleteAttachment(attachmentId: string, userId: string): Promise<void>;
};
export default attachmentsService;
//# sourceMappingURL=attachments.service.d.ts.map