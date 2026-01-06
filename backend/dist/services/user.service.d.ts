import type { User, UserRole } from '../types/index.js';
export interface CreateUserData {
    companyId: string;
    name: string;
    email: string;
    password: string;
    role: UserRole;
    companyRoleId?: string;
}
export interface UpdateUserData {
    name?: string;
    email?: string;
    role?: UserRole;
    isActive?: boolean;
    password?: string;
    companyRoleId?: string | null;
}
export declare const userService: {
    /**
     * Create a new user with hashed password
     * Requirements: 4.1
     */
    create(data: CreateUserData): Promise<User>;
    /**
     * Get a user by ID
     */
    getById(id: string): Promise<User>;
    /**
     * Get a user by email
     */
    getByEmail(email: string): Promise<User | null>;
    /**
     * Update a user
     * Requirements: 4.2
     */
    update(id: string, data: UpdateUserData): Promise<User>;
    /**
     * Deactivate a user (soft delete)
     * Requirements: 4.3
     */
    deactivate(id: string): Promise<User>;
    /**
     * Delete a user (hard delete)
     */
    delete(id: string): Promise<void>;
    /**
     * Get all users for a company
     * Requirements: 4.4
     */
    getAllByCompany(companyId: string): Promise<User[]>;
    /**
     * Get all users (admin only)
     */
    getAll(): Promise<User[]>;
    /**
     * Check if user is active
     */
    isActive(id: string): Promise<boolean>;
};
export default userService;
//# sourceMappingURL=user.service.d.ts.map