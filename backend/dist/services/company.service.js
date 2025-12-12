import prisma from '../lib/prisma.js';
import { NotFoundError } from '../middleware/errorHandler.js';
export const companyService = {
    /**
     * Create a new company
     * Requirements: 2.1, 2.3, 7.1, 7.2
     */
    async create(data) {
        const company = await prisma.company.create({
            data: {
                name: data.name,
                logoUrl: data.logoUrl,
                contactEmail: data.contactEmail,
                address: data.address,
                website: data.website,
                companySize: data.companySize,
                industry: data.industry,
                description: data.description,
                phone: data.phone,
                city: data.city,
                state: data.state,
                country: data.country,
                postalCode: data.postalCode,
                linkedinUrl: data.linkedinUrl,
                twitterUrl: data.twitterUrl,
                facebookUrl: data.facebookUrl,
                careersPageUrl: data.careersPageUrl,
                brandColor: data.brandColor,
            },
        });
        return transformCompany(company);
    },
    /**
     * Get a company by ID
     * Requirements: 2.4, 7.3, 7.4
     */
    async getById(id) {
        const company = await prisma.company.findUnique({
            where: { id },
        });
        if (!company) {
            throw new NotFoundError('Company');
        }
        return transformCompany(company);
    },
    /**
     * Update a company
     * Requirements: 2.2, 2.7, 7.1, 7.2
     */
    async update(id, data) {
        // Check if company exists
        const existing = await prisma.company.findUnique({
            where: { id },
        });
        if (!existing) {
            throw new NotFoundError('Company');
        }
        const company = await prisma.company.update({
            where: { id },
            data: {
                name: data.name,
                logoUrl: data.logoUrl,
                contactEmail: data.contactEmail,
                address: data.address,
                website: data.website,
                companySize: data.companySize,
                industry: data.industry,
                description: data.description,
                phone: data.phone,
                city: data.city,
                state: data.state,
                country: data.country,
                postalCode: data.postalCode,
                linkedinUrl: data.linkedinUrl,
                twitterUrl: data.twitterUrl,
                facebookUrl: data.facebookUrl,
                careersPageUrl: data.careersPageUrl,
                brandColor: data.brandColor,
            },
        });
        return transformCompany(company);
    },
    /**
     * Get all companies
     */
    async getAll() {
        const companies = await prisma.company.findMany({
            orderBy: { createdAt: 'desc' },
        });
        return companies.map((c) => transformCompany(c));
    },
};
/**
 * Transform Prisma company result to Company type
 * Converts null values to undefined for optional fields
 */
function transformCompany(company) {
    return {
        id: company.id,
        name: company.name,
        logoUrl: company.logoUrl ?? undefined,
        contactEmail: company.contactEmail,
        address: company.address ?? undefined,
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
        // Enhanced company profile fields
        website: company.website ?? undefined,
        companySize: company.companySize ?? undefined,
        industry: company.industry ?? undefined,
        description: company.description ?? undefined,
        phone: company.phone ?? undefined,
        city: company.city ?? undefined,
        state: company.state ?? undefined,
        country: company.country ?? undefined,
        postalCode: company.postalCode ?? undefined,
        linkedinUrl: company.linkedinUrl ?? undefined,
        twitterUrl: company.twitterUrl ?? undefined,
        facebookUrl: company.facebookUrl ?? undefined,
        careersPageUrl: company.careersPageUrl ?? undefined,
        brandColor: company.brandColor ?? undefined,
    };
}
export default companyService;
//# sourceMappingURL=company.service.js.map