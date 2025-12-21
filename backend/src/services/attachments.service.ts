import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import path from 'path';
import fs from 'fs';

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

// Allowed file types for attachments (Requirements 6.4)
export const ALLOWED_ATTACHMENT_EXTENSIONS = ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg'];
export const ALLOWED_ATTACHMENT_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
];
export const MAX_ATTACHMENT_SIZE = 10 * 1024 * 1024; // 10MB (Requirements 6.4)

/**
 * Validate attachment file format and size
 * Requirements: 6.4
 */
export const validateAttachment = (file: {
  mimetype: string;
  size: number;
  originalname: string;
}): { valid: boolean; error?: string } => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_ATTACHMENT_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${ALLOWED_ATTACHMENT_EXTENSIONS.join(', ')}`,
    };
  }

  if (!ALLOWED_ATTACHMENT_MIME_TYPES.includes(file.mimetype)) {
    return {
      valid: false,
      error: 'Invalid file type. Allowed: PDF, DOC, DOCX, PNG, JPG, JPEG',
    };
  }

  if (file.size > MAX_ATTACHMENT_SIZE) {
    return {
      valid: false,
      error: 'File size exceeds maximum limit of 10MB',
    };
  }

  return { valid: true };
};

export const attachmentsService = {
  /**
   * Upload an attachment for a candidate
   * Requirements: 6.4, 6.5
   */
  async uploadAttachment(data: UploadAttachmentData): Promise<CandidateAttachment> {
    // Validate required fields
    if (!data.fileName || data.fileName.trim() === '') {
      throw new ValidationError({ fileName: ['File name is required'] });
    }

    // Verify candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: data.candidateId },
    });

    if (!candidate) {
      throw new NotFoundError('Candidate');
    }

    // Verify uploader exists
    const uploader = await prisma.user.findUnique({
      where: { id: data.uploadedBy },
    });

    if (!uploader) {
      throw new NotFoundError('User');
    }

    // Create the attachment record
    const attachment = await prisma.candidateAttachment.create({
      data: {
        candidateId: data.candidateId,
        fileName: data.fileName,
        fileUrl: data.fileUrl,
        fileType: data.fileType,
        fileSize: data.fileSize,
        uploadedBy: data.uploadedBy,
      },
      include: {
        uploader: {
          select: { name: true },
        },
      },
    });

    return {
      id: attachment.id,
      candidateId: attachment.candidateId,
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      uploadedBy: attachment.uploadedBy,
      uploaderName: attachment.uploader.name,
      createdAt: attachment.createdAt,
    };
  },

  /**
   * Get all attachments for a candidate
   * Requirements: 6.5
   */
  async getAttachments(candidateId: string): Promise<CandidateAttachment[]> {
    // Verify candidate exists
    const candidate = await prisma.candidate.findUnique({
      where: { id: candidateId },
    });

    if (!candidate) {
      throw new NotFoundError('Candidate');
    }

    // Get attachments ordered by creation date (newest first)
    const attachments = await prisma.candidateAttachment.findMany({
      where: { candidateId },
      orderBy: { createdAt: 'desc' },
      include: {
        uploader: {
          select: { name: true },
        },
      },
    });

    return attachments.map((attachment: {
      id: string;
      candidateId: string;
      fileName: string;
      fileUrl: string;
      fileType: string;
      fileSize: number;
      uploadedBy: string;
      createdAt: Date;
      uploader: { name: string };
    }) => ({
      id: attachment.id,
      candidateId: attachment.candidateId,
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      uploadedBy: attachment.uploadedBy,
      uploaderName: attachment.uploader.name,
      createdAt: attachment.createdAt,
    }));
  },

  /**
   * Get a single attachment by ID
   */
  async getAttachmentById(attachmentId: string): Promise<CandidateAttachment> {
    const attachment = await prisma.candidateAttachment.findUnique({
      where: { id: attachmentId },
      include: {
        uploader: {
          select: { name: true },
        },
      },
    });

    if (!attachment) {
      throw new NotFoundError('Attachment');
    }

    return {
      id: attachment.id,
      candidateId: attachment.candidateId,
      fileName: attachment.fileName,
      fileUrl: attachment.fileUrl,
      fileType: attachment.fileType,
      fileSize: attachment.fileSize,
      uploadedBy: attachment.uploadedBy,
      uploaderName: attachment.uploader.name,
      createdAt: attachment.createdAt,
    };
  },

  /**
   * Delete an attachment
   * Requirements: 6.4
   */
  async deleteAttachment(attachmentId: string, userId: string): Promise<void> {
    const attachment = await prisma.candidateAttachment.findUnique({
      where: { id: attachmentId },
    });

    if (!attachment) {
      throw new NotFoundError('Attachment');
    }

    // Delete the physical file if it exists
    const filePath = path.join(process.cwd(), attachment.fileUrl.replace(/^\//, ''));
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }

    // Delete the attachment record
    await prisma.candidateAttachment.delete({
      where: { id: attachmentId },
    });
  },
};

export default attachmentsService;
