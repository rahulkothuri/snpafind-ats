/**
 * AWS S3 Client for File Uploads
 * ============================================================================
 * Provides utilities for uploading, downloading, and managing files in S3.
 * Used in production instead of local disk storage.
 * ============================================================================
 */

import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand,
    DeleteObjectCommand,
    HeadObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { Readable } from 'stream';

// Initialize S3 client
const s3Client = new S3Client({
    region: process.env.AWS_REGION || 'ap-south-1',
});

// S3 bucket name from environment
const BUCKET_NAME = process.env.AWS_S3_BUCKET || '';

/**
 * Check if S3 is configured (for conditional local/S3 storage)
 */
export function isS3Configured(): boolean {
    return Boolean(BUCKET_NAME && process.env.AWS_S3_BUCKET);
}

/**
 * Upload a file to S3
 */
export async function uploadToS3(params: {
    key: string;
    body: Buffer | Readable;
    contentType: string;
    metadata?: Record<string, string>;
}): Promise<{ url: string; key: string }> {
    const { key, body, contentType, metadata } = params;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        Body: body,
        ContentType: contentType,
        Metadata: metadata,
    });

    await s3Client.send(command);

    return {
        key,
        url: `s3://${BUCKET_NAME}/${key}`,
    };
}

/**
 * Generate a presigned URL for uploading (client-side upload)
 */
export async function getUploadPresignedUrl(params: {
    key: string;
    contentType: string;
    expiresIn?: number;
}): Promise<string> {
    const { key, contentType, expiresIn = 3600 } = params;

    const command = new PutObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ContentType: contentType,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Generate a presigned URL for downloading/viewing
 */
export async function getDownloadPresignedUrl(params: {
    key: string;
    expiresIn?: number;
    responseContentDisposition?: string;
}): Promise<string> {
    const { key, expiresIn = 3600, responseContentDisposition } = params;

    const command = new GetObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
        ResponseContentDisposition: responseContentDisposition,
    });

    return getSignedUrl(s3Client, command, { expiresIn });
}

/**
 * Delete a file from S3
 */
export async function deleteFromS3(key: string): Promise<void> {
    const command = new DeleteObjectCommand({
        Bucket: BUCKET_NAME,
        Key: key,
    });

    await s3Client.send(command);
}

/**
 * Check if a file exists in S3
 */
export async function fileExistsInS3(key: string): Promise<boolean> {
    try {
        const command = new HeadObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
        });
        await s3Client.send(command);
        return true;
    } catch (error) {
        return false;
    }
}

/**
 * Generate an S3 key for a file
 */
export function generateS3Key(params: {
    folder: string;
    filename: string;
    companyId?: string;
}): string {
    const { folder, filename, companyId } = params;
    const timestamp = Date.now();
    const randomSuffix = Math.round(Math.random() * 1e9);
    const safeFilename = filename.replace(/[^a-zA-Z0-9.-]/g, '_');

    if (companyId) {
        return `${folder}/${companyId}/${timestamp}-${randomSuffix}-${safeFilename}`;
    }
    return `${folder}/${timestamp}-${randomSuffix}-${safeFilename}`;
}

/**
 * Extract S3 key from URL or path
 */
export function extractS3Key(url: string): string | null {
    // Handle s3:// URLs
    if (url.startsWith('s3://')) {
        const parts = url.replace('s3://', '').split('/');
        parts.shift(); // Remove bucket name
        return parts.join('/');
    }

    // Handle https:// S3 URLs
    const s3UrlMatch = url.match(/s3\.[\w-]+\.amazonaws\.com\/([^?]+)/);
    if (s3UrlMatch) {
        return s3UrlMatch[1];
    }

    // Handle key-only format (e.g., "resumes/company-id/file.pdf")
    if (!url.startsWith('http') && !url.startsWith('/')) {
        return url;
    }

    return null;
}

export { s3Client, BUCKET_NAME };
