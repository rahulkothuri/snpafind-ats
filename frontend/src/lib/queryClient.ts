/**
 * Query Client Configuration
 * 
 * Centralized React Query client configuration.
 * Exported separately to avoid circular dependencies.
 */

import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
    defaultOptions: {
        queries: {
            staleTime: 5 * 60 * 1000, // 5 minutes
            retry: 1,
        },
    },
});
