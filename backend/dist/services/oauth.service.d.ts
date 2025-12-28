/**
 * Encrypt a token string for secure storage
 */
export declare function encryptToken(token: string): string;
/**
 * Decrypt a stored token string
 */
export declare function decryptToken(encryptedToken: string): string;
export type OAuthProvider = 'google' | 'microsoft';
export interface OAuthTokenData {
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
    scope?: string;
}
export interface StoredOAuthToken {
    id: string;
    userId: string;
    provider: OAuthProvider;
    accessToken: string;
    refreshToken?: string;
    expiresAt: Date;
    scope?: string;
    createdAt: Date;
    updatedAt: Date;
}
/**
 * OAuth Token Service
 */
export declare const oauthService: {
    /**
     * Store OAuth tokens securely
     * Encrypts tokens before storing in database
     */
    storeToken(userId: string, provider: OAuthProvider, tokenData: OAuthTokenData): Promise<StoredOAuthToken>;
    /**
     * Retrieve OAuth token for a user and provider
     * Decrypts tokens before returning
     */
    getToken(userId: string, provider: OAuthProvider): Promise<StoredOAuthToken | null>;
    /**
     * Get decrypted access token, refreshing if necessary
     * Returns null if no token exists or refresh fails
     */
    getValidAccessToken(userId: string, provider: OAuthProvider, refreshCallback?: (refreshToken: string) => Promise<OAuthTokenData>): Promise<string | null>;
    /**
     * Delete OAuth token for a user and provider
     */
    deleteToken(userId: string, provider: OAuthProvider): Promise<void>;
    /**
     * Check if user has a valid token for a provider
     */
    hasValidToken(userId: string, provider: OAuthProvider): Promise<boolean>;
    /**
     * Get all connected providers for a user
     */
    getConnectedProviders(userId: string): Promise<OAuthProvider[]>;
    /**
     * Map Prisma token to StoredOAuthToken with decrypted values
     */
    mapToStoredToken(token: {
        id: string;
        userId: string;
        provider: string;
        accessToken: string;
        refreshToken: string | null;
        expiresAt: Date;
        scope: string | null;
        createdAt: Date;
        updatedAt: Date;
    }): StoredOAuthToken;
};
export default oauthService;
//# sourceMappingURL=oauth.service.d.ts.map