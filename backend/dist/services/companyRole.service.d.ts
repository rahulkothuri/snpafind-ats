/**
 * Company Role Service
 *
 * Handles CRUD operations for custom company roles
 */
export interface CompanyRole {
    id: string;
    companyId: string;
    name: string;
    description: string | null;
    permissions: string[];
    isDefault: boolean;
    createdAt: Date;
    updatedAt: Date;
}
interface CreateRoleData {
    companyId: string;
    name: string;
    description?: string;
    permissions?: string[];
}
interface UpdateRoleData {
    name?: string;
    description?: string;
    permissions?: string[];
}
export declare const companyRoleService: {
    /**
     * Get all roles for a company
     */
    getAll(companyId: string): Promise<CompanyRole[]>;
    /**
     * Get a role by ID
     */
    getById(id: string): Promise<CompanyRole>;
    /**
     * Create a new custom role
     */
    create(data: CreateRoleData): Promise<CompanyRole>;
    /**
     * Update a role
     */
    update(id: string, data: UpdateRoleData): Promise<CompanyRole>;
    /**
     * Delete a role
     */
    delete(id: string): Promise<void>;
    /**
     * Initialize default roles for a new company
     */
    initializeDefaultRoles(companyId: string): Promise<CompanyRole[]>;
};
export default companyRoleService;
//# sourceMappingURL=companyRole.service.d.ts.map