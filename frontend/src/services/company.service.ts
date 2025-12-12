import api from './api';

export interface Company {
  id: string;
  name: string;
  logoUrl?: string;
  contactEmail: string;
  address?: string;
  createdAt: string;
  updatedAt: string;
  // Enhanced company profile fields
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
  // Enhanced company profile fields
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

export const companyService = {
  async get(): Promise<Company> {
    const response = await api.get('/companies/current');
    return response.data;
  },

  async update(data: UpdateCompanyData): Promise<Company> {
    const response = await api.put('/companies/current', data);
    return response.data;
  },
};

export default companyService;
