import crypto from 'crypto';
import prisma from '../lib/prisma.js';
/**
 * OAuth Token Management Service
 * Handles secure storage, retrieval, and refresh of OAuth tokens
 * Requirements: 4.1, 5.1
 */
// Encryption configuration
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 16;
const AUTH_TAG_LENGTH = 16;
// Get encryption key from environment or generate a default for development
function getEncryptionKey() {
    const key = process.env.OAUTH_ENCRYPTION_KEY;
    if (key) {
        // Key should be 32 bytes (256 bits) for AES-256
        return Buffer.from(key, 'hex');
    }
    // Default key for development - MUST be overridden in production
    console.warn('WARNING: Using default OAuth encryption key. Set OAUTH_ENCRYPTION_KEY in production!');
    return crypto.scryptSync('default-dev-key-change-in-production', 'salt', 32);
}
/**
 * Encrypt a token string for secure storage
 */
export function encryptToken(token) {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(token, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();
    // Format: iv:authTag:encryptedData
    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
}
/**
 * Decrypt a stored token string
 */
export function decryptToken(encryptedToken) {
    const key = getEncryptionKey();
    const parts = encryptedToken.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted token format');
    }
    const iv = Buffer.from(parts[0], 'hex');
    const authTag = Buffer.from(parts[1], 'hex');
    const encrypted = parts[2];
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
}
/**
 * OAuth Token Service
 */
export const oauthService = {
    /**
     * Store OAuth tokens securely
     * Encrypts tokens before storing in database
     */
    async storeToken(userId, provider, tokenData) {
        // Encrypt tokens before storage
        const encryptedAccessToken = encryptToken(tokenData.accessToken);
        const encryptedRefreshToken = tokenData.refreshToken
            ? encryptToken(tokenData.refreshToken)
            : null;
        // Upsert token (update if exists, create if not)
        const token = await prisma.oAuthToken.upsert({
            where: {
                userId_provider: {
                    userId,
                    provider,
                },
            },
            update: {
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                expiresAt: tokenData.expiresAt,
                scope: tokenData.scope,
            },
            create: {
                userId,
                provider,
                accessToken: encryptedAccessToken,
                refreshToken: encryptedRefreshToken,
                expiresAt: tokenData.expiresAt,
                scope: tokenData.scope,
            },
        });
        return this.mapToStoredToken(token);
    },
    /**
     * Retrieve OAuth token for a user and provider
     * Decrypts tokens before returning
     */
    async getToken(userId, provider) {
        const token = await prisma.oAuthToken.findUnique({
            where: {
                userId_provider: {
                    userId,
                    provider,
                },
            },
        });
        if (!token) {
            return null;
        }
        return this.mapToStoredToken(token);
    },
    /**
     * Get decrypted access token, refreshing if necessary
     * Returns null if no token exists or refresh fails
     */
    async getValidAccessToken(userId, provider, refreshCallback) {
        const token = await this.getToken(userId, provider);
        if (!token) {
            return null;
        }
        // Check if token is expired or about to expire (within 5 minutes)
        const expiryBuffer = 5 * 60 * 1000; // 5 minutes in milliseconds
        const isExpired = token.expiresAt.getTime() < Date.now() + expiryBuffer;
        if (isExpired && token.refreshToken && refreshCallback) {
            try {
                // Attempt to refresh the token
                const newTokenData = await refreshCallback(token.refreshToken);
                const updatedToken = await this.storeToken(userId, provider, newTokenData);
                return updatedToken.accessToken;
            }
            catch (error) {
                console.error(`Failed to refresh ${provider} token for user ${userId}:`, error);
                // Delete invalid token
                await this.deleteToken(userId, provider);
                return null;
            }
        }
        if (isExpired && !token.refreshToken) {
            // Token expired and no refresh token available
            return null;
        }
        return token.accessToken;
    },
    /**
     * Delete OAuth token for a user and provider
     */
    async deleteToken(userId, provider) {
        await prisma.oAuthToken.deleteMany({
            where: {
                userId,
                provider,
            },
        });
    },
    /**
     * Check if user has a valid token for a provider
     */
    async hasValidToken(userId, provider) {
        const token = await this.getToken(userId, provider);
        if (!token) {
            return false;
        }
        // Check if token is expired
        return token.expiresAt.getTime() > Date.now();
    },
    /**
     * Get all connected providers for a user
     */
    async getConnectedProviders(userId) {
        const tokens = await prisma.oAuthToken.findMany({
            where: { userId },
            select: { provider: true },
        });
        return tokens.map(t => t.provider);
    },
    /**
     * Map Prisma token to StoredOAuthToken with decrypted values
     */
    mapToStoredToken(token) {
        return {
            id: token.id,
            userId: token.userId,
            provider: token.provider,
            accessToken: decryptToken(token.accessToken),
            refreshToken: token.refreshToken ? decryptToken(token.refreshToken) : undefined,
            expiresAt: token.expiresAt,
            scope: token.scope ?? undefined,
            createdAt: token.createdAt,
            updatedAt: token.updatedAt,
        };
    },
};
export default oauthService;
//# sourceMappingURL=oauth.service.js.map