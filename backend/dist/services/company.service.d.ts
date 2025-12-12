import type { Company } from '../types/index.js';
export interface CreateCompanyData {
    name: string;
    logoUrl?: string;
    contactEmail: string;
    address?: string;
    website?: string;
    companySize?: string;
    industry?: string;
    description?: string;
    phone?: string;
    city?: string;
    state?: string;
    country?: string;
    postalCode?: string;
    linkedinUrl?: string;
    twitterUrl?: string;
    facebookUrl?: string;
    careersPageUrl?: string;
    brandColor?: string;
}
export interface UpdateCompanyData {
    name?: string;
    logoUrl?: string | null;
    contactEmail?: string;
    address?: string | null;
    website?: string | null;
    companySize?: string | null;
    industry?: string | null;
    description?: string | null;
    phone?: string | null;
    city?: string | null;
    state?: string | null;
    country?: string | null;
    postalCode?: string | null;
    linkedinUrl?: string | null;
    twitterUrl?: string | null;
    facebookUrl?: string | null;
    careersPageUrl?: string | null;
    brandColor?: string | null;
}
export declare const companyService: {
    /**
     * Create a new company
     * Requirements: 2.1, 2.3, 7.1, 7.2
     */
    create(data: CreateCompanyData): Promise<Company>;
    /**
     * Get a company by ID
     * Requirements: 2.4, 7.3, 7.4
     */
    getById(id: string): Promise<Company>;
    /**
     * Update a company
     * Requirements: 2.2, 2.7, 7.1, 7.2
     */
    update(id: string, data: UpdateCompanyData): Promise<Company>;
    /**
     * Get all companies
     */
    getAll(): Promise<Company[]>;
};
export default companyService;
//# sourceMappingURL=company.service.d.ts.map