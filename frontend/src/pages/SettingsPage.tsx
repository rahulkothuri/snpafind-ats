import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Layout, Button, Badge, Table, LoadingSpinner, ErrorMessage, SLAConfigSection, CalendarConnectionSettings } from '../components';
import type { Column } from '../components';
import { useAuth } from '../hooks/useAuth';
import { useUsers, useCreateUser, useToggleUserStatus } from '../hooks/useUsers';
import { useCompany, useUpdateCompany } from '../hooks/useCompany';
import type { User } from '../services';

/**
 * Settings Page - Requirements 19.1-19.6
 * 
 * Features:
 * - Tabbed layout for Company Profile, User Management, Role Configuration
 * - Company profile form with name, logo, contact email, address
 * - Users table with management actions
 * - Role configuration display with permissions
 */

type TabId = 'company' | 'users' | 'roles' | 'sla' | 'calendar';

interface Tab {
  id: TabId;
  label: string;
}

const tabs: Tab[] = [
  { id: 'company', label: 'Company Profile' },
  { id: 'users', label: 'User Management' },
  { id: 'roles', label: 'Role Configuration' },
  { id: 'sla', label: 'SLA Settings' },
  { id: 'calendar', label: 'Calendar Integration' },
];

// Company size options - Requirement 2.2
const companySizes = [
  '1-10 employees',
  '11-50 employees',
  '51-200 employees',
  '201-500 employees',
  '501-1000 employees',
  '1000+ employees',
];

// Industry options - Requirement 2.2
const industries = [
  'Technology',
  'Healthcare',
  'Finance',
  'Education',
  'Manufacturing',
  'Retail',
  'Consulting',
  'Media',
  'Real Estate',
  'Other',
];

// Types for settings data - Enhanced for Requirements 2.1-2.8
interface CompanyProfile {
  // Basic Details
  name: string;
  website: string;
  companySize: string;
  industry: string;
  description: string;
  // Branding
  logoUrl: string;
  brandColor: string;
  // Contact & Location
  contactEmail: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  // Social Media
  linkedinUrl: string;
  twitterUrl: string;
  facebookUrl: string;
  careersPageUrl: string;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'hiring_manager' | 'recruiter';
  isActive: boolean;
}

interface RoleConfig {
  id: string;
  name: string;
  displayName: string;
  description: string;
  permissions: string[];
}

// Sample data - Enhanced for Requirements 2.1-2.8
const sampleCompany: CompanyProfile = {
  name: 'Acme Technologies',
  website: '',
  companySize: '',
  industry: '',
  description: '',
  logoUrl: '',
  brandColor: '#0b6cf0',
  contactEmail: 'hr@acmetech.com',
  phone: '',
  address: '123 Tech Park, Bangalore, Karnataka 560001',
  city: '',
  state: '',
  country: '',
  postalCode: '',
  linkedinUrl: '',
  twitterUrl: '',
  facebookUrl: '',
  careersPageUrl: '',
};


const sampleUsers: UserData[] = [
  { id: '1', name: 'Priya Sharma', email: 'priya.sharma@acmetech.com', role: 'admin', isActive: true },
  { id: '2', name: 'Rahul Verma', email: 'rahul.verma@acmetech.com', role: 'hiring_manager', isActive: true },
  { id: '3', name: 'Aarti Singh', email: 'aarti.singh@acmetech.com', role: 'recruiter', isActive: true },
  { id: '4', name: 'Vikram Patel', email: 'vikram.patel@acmetech.com', role: 'recruiter', isActive: true },
  { id: '5', name: 'Sneha Reddy', email: 'sneha.reddy@acmetech.com', role: 'hiring_manager', isActive: false },
];

const roleConfigs: RoleConfig[] = [
  {
    id: 'admin',
    name: 'admin',
    displayName: 'Admin',
    description: 'Full system access with complete control over all features',
    permissions: [
      'Manage company settings and profile',
      'Create, edit, and delete users',
      'Assign roles to users',
      'Access all job requisitions',
      'View all candidates and pipelines',
      'Access analytics and reports',
      'Configure system settings',
    ],
  },
  {
    id: 'hiring_manager',
    name: 'hiring_manager',
    displayName: 'Hiring Manager',
    description: 'Manages hiring decisions for assigned roles',
    permissions: [
      'View and edit assigned job requisitions',
      'Review candidates in assigned pipelines',
      'Provide interview feedback',
      'Make hiring decisions',
      'View team analytics',
      'Cannot manage users or company settings',
    ],
  },
  {
    id: 'recruiter',
    name: 'recruiter',
    displayName: 'Recruiter',
    description: 'Sources and manages candidates through the pipeline',
    permissions: [
      'Create and manage candidates',
      'Move candidates through pipeline stages',
      'Schedule interviews',
      'Upload resumes and documents',
      'Add notes and activities',
      'Cannot make final hiring decisions',
      'Cannot access company settings',
    ],
  },
];


// Company Profile Tab Component - Requirements 2.1-2.8
function CompanyProfileTab() {
  const { data: companyData, isLoading, error } = useCompany();
  const updateCompany = useUpdateCompany();
  const [company, setCompany] = useState<CompanyProfile>(sampleCompany);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // Update local state when API data loads
  useEffect(() => {
    if (companyData) {
      setCompany({
        name: companyData.name,
        website: companyData.website || '',
        companySize: companyData.companySize || '',
        industry: companyData.industry || '',
        description: companyData.description || '',
        logoUrl: companyData.logoUrl || '',
        brandColor: companyData.brandColor || '#0b6cf0',
        contactEmail: companyData.contactEmail,
        phone: companyData.phone || '',
        address: companyData.address || '',
        city: companyData.city || '',
        state: companyData.state || '',
        country: companyData.country || '',
        postalCode: companyData.postalCode || '',
        linkedinUrl: companyData.linkedinUrl || '',
        twitterUrl: companyData.twitterUrl || '',
        facebookUrl: companyData.facebookUrl || '',
        careersPageUrl: companyData.careersPageUrl || '',
      });
    }
  }, [companyData]);

  const handleChange = (field: keyof CompanyProfile, value: string) => {
    setCompany((prev) => ({ ...prev, [field]: value }));
    setSaveSuccess(false);
    setSaveError(null);
  };

  const handleSave = async () => {
    try {
      setSaveError(null);
      await updateCompany.mutateAsync({
        name: company.name,
        website: company.website || null,
        companySize: company.companySize || null,
        industry: company.industry || null,
        description: company.description || null,
        logoUrl: company.logoUrl || null,
        brandColor: company.brandColor || null,
        contactEmail: company.contactEmail,
        phone: company.phone || null,
        address: company.address || null,
        city: company.city || null,
        state: company.state || null,
        country: company.country || null,
        postalCode: company.postalCode || null,
        linkedinUrl: company.linkedinUrl || null,
        twitterUrl: company.twitterUrl || null,
        facebookUrl: company.facebookUrl || null,
        careersPageUrl: company.careersPageUrl || null,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Failed to save company:', err);
      setSaveError('Failed to save changes. Please try again.');
    }
  };

  const handleReset = () => {
    if (companyData) {
      setCompany({
        name: companyData.name,
        website: companyData.website || '',
        companySize: companyData.companySize || '',
        industry: companyData.industry || '',
        description: companyData.description || '',
        logoUrl: companyData.logoUrl || '',
        brandColor: companyData.brandColor || '#0b6cf0',
        contactEmail: companyData.contactEmail,
        phone: companyData.phone || '',
        address: companyData.address || '',
        city: companyData.city || '',
        state: companyData.state || '',
        country: companyData.country || '',
        postalCode: companyData.postalCode || '',
        linkedinUrl: companyData.linkedinUrl || '',
        twitterUrl: companyData.twitterUrl || '',
        facebookUrl: companyData.facebookUrl || '',
        careersPageUrl: companyData.careersPageUrl || '',
      });
    } else {
      setCompany(sampleCompany);
    }
    setSaveSuccess(false);
    setSaveError(null);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load company data" />;
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Company Details</h3>
            <p className="text-xs text-gray-500">Basic information about your organization</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Company Name */}
          <div className="form-group col-span-2 md:col-span-1">
            <label htmlFor="companyName" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Company Name
            </label>
            <input
              id="companyName"
              type="text"
              value={company.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
              placeholder="Enter company name"
            />
          </div>

          {/* Website URL */}
          <div className="form-group col-span-2 md:col-span-1">
            <label htmlFor="website" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Website URL
            </label>
            <input
              id="website"
              type="url"
              value={company.website}
              onChange={(e) => handleChange('website', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all"
              placeholder="https://www.yourcompany.com"
            />
          </div>

          {/* Company Size */}
          <div className="form-group">
            <label htmlFor="companySize" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Company Size
            </label>
            <div className="relative">
              <select
                id="companySize"
                value={company.companySize}
                onChange={(e) => handleChange('companySize', e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all appearance-none"
              >
                <option value="">Select company size</option>
                {companySizes.map((size) => (
                  <option key={size} value={size}>{size}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Industry */}
          <div className="form-group">
            <label htmlFor="industry" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Industry
            </label>
            <div className="relative">
              <select
                id="industry"
                value={company.industry}
                onChange={(e) => handleChange('industry', e.target.value)}
                className="w-full pl-3 pr-10 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all appearance-none"
              >
                <option value="">Select industry</option>
                {industries.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center px-2 pointer-events-none">
                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
              </div>
            </div>
          </div>

          {/* Company Description - Full Width */}
          <div className="form-group col-span-2">
            <label htmlFor="description" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Company Description
            </label>
            <textarea
              id="description"
              value={company.description}
              onChange={(e) => handleChange('description', e.target.value)}
              rows={4}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all resize-none"
              placeholder="Tell candidates about your company, culture, and mission..."
            />
            <p className="mt-1.5 text-xs text-gray-400 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              This description will be shown to candidates on job application pages.
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-purple-50 flex items-center justify-center text-purple-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Branding</h3>
            <p className="text-xs text-gray-500">Manage your company's visual identity</p>
          </div>
        </div>

        <div className="space-y-6 w-full">
          {/* Logo Upload Area */}
          <div className="form-group">
            <label className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Company Logo</label>
            <div className="flex items-start gap-6">
              {/* Logo Preview */}
              <div className="flex-shrink-0">
                <div className="w-24 h-24 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex items-center justify-center overflow-hidden hover:border-blue-300 transition-colors group relative">
                  {company.logoUrl ? (
                    <img
                      src={company.logoUrl}
                      alt="Company logo"
                      className="w-full h-full object-contain p-2"
                    />
                  ) : (
                    <div className="text-center p-2">
                      <svg className="w-8 h-8 mx-auto text-gray-300 mb-1 group-hover:text-blue-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      <span className="text-[10px] text-gray-400 font-medium group-hover:text-blue-500">Upload</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Logo URL Input */}
              <div className="flex-1 max-w-lg">
                <input
                  id="logoUrl"
                  type="url"
                  value={company.logoUrl}
                  onChange={(e) => handleChange('logoUrl', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 transition-all"
                  placeholder="https://example.com/logo.png"
                />
                <p className="mt-2 text-xs text-gray-400">
                  Enter a URL for your company logo. Start with https://. Recommended size: 200x200px.
                </p>
              </div>
            </div>
          </div>

          {/* Brand Color Picker */}
          <div className="form-group">
            <label htmlFor="brandColor" className="block text-xs font-semibold text-gray-700 mb-2 uppercase tracking-wide">Brand Color</label>
            <div className="flex items-center gap-3">
              <div className="relative group">
                <input
                  type="color"
                  id="brandColorPicker"
                  value={company.brandColor}
                  onChange={(e) => handleChange('brandColor', e.target.value)}
                  className="w-10 h-10 rounded-lg border border-gray-200 cursor-pointer p-0.5 bg-white shadow-sm"
                />
                <div className="absolute inset-0 rounded-lg ring-1 ring-inset ring-black/5 pointer-events-none"></div>
              </div>
              <input
                type="text"
                id="brandColor"
                value={company.brandColor}
                onChange={(e) => handleChange('brandColor', e.target.value)}
                className="w-32 px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 transition-all uppercase"
                placeholder="#0b6cf0"
              />
              <span className="text-xs text-gray-500">Primary brand color used for buttons and highlights</span>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center text-green-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Contact & Location</h3>
            <p className="text-xs text-gray-500">Address and contact details for your office</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* Contact Email */}
          <div className="form-group">
            <label htmlFor="contactEmail" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Contact Email
            </label>
            <input
              id="contactEmail"
              type="email"
              value={company.contactEmail}
              onChange={(e) => handleChange('contactEmail', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
              placeholder="contact@company.com"
            />
          </div>

          {/* Phone Number */}
          <div className="form-group">
            <label htmlFor="phone" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Phone Number
            </label>
            <input
              id="phone"
              type="tel"
              value={company.phone}
              onChange={(e) => handleChange('phone', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
              placeholder="+1 (555) 123-4567"
            />
          </div>

          {/* Address */}
          <div className="form-group col-span-2">
            <label htmlFor="address" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Street Address
            </label>
            <input
              id="address"
              type="text"
              value={company.address}
              onChange={(e) => handleChange('address', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
              placeholder="123 Main Street, Suite 100"
            />
          </div>

          {/* City and State */}
          {/* City */}
          <div className="form-group">
            <label htmlFor="city" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              City
            </label>
            <input
              id="city"
              type="text"
              value={company.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
              placeholder="San Francisco"
            />
          </div>

          {/* State */}
          <div className="form-group">
            <label htmlFor="state" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              State / Province
            </label>
            <input
              id="state"
              type="text"
              value={company.state}
              onChange={(e) => handleChange('state', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
              placeholder="California"
            />
          </div>

          {/* Country and Postal Code */}
          <div className="form-group">
            <label htmlFor="country" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Country
            </label>
            <input
              id="country"
              type="text"
              value={company.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
              placeholder="United States"
            />
          </div>

          <div className="form-group">
            <label htmlFor="postalCode" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Postal Code
            </label>
            <input
              id="postalCode"
              type="text"
              value={company.postalCode}
              onChange={(e) => handleChange('postalCode', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-green-100 focus:border-green-400 transition-all"
              placeholder="94102"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
          <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
            </svg>
          </div>
          <div>
            <h3 className="text-base font-semibold text-gray-900">Social Media Links</h3>
            <p className="text-xs text-gray-500">Connect your profiles for better reach</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
          {/* LinkedIn URL */}
          <div className="form-group">
            <label htmlFor="linkedinUrl" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              LinkedIn
            </label>
            <input
              id="linkedinUrl"
              type="url"
              value={company.linkedinUrl}
              onChange={(e) => handleChange('linkedinUrl', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
              placeholder="https://linkedin.com/company/yourcompany"
            />
          </div>

          {/* Twitter URL */}
          <div className="form-group">
            <label htmlFor="twitterUrl" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Twitter / X
            </label>
            <input
              id="twitterUrl"
              type="url"
              value={company.twitterUrl}
              onChange={(e) => handleChange('twitterUrl', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
              placeholder="https://twitter.com/yourcompany"
            />
          </div>

          {/* Facebook URL */}
          <div className="form-group">
            <label htmlFor="facebookUrl" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Facebook
            </label>
            <input
              id="facebookUrl"
              type="url"
              value={company.facebookUrl}
              onChange={(e) => handleChange('facebookUrl', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
              placeholder="https://facebook.com/yourcompany"
            />
          </div>

          {/* Careers Page URL */}
          <div className="form-group">
            <label htmlFor="careersPageUrl" className="block text-xs font-semibold text-gray-700 mb-1.5 uppercase tracking-wide">
              Careers Page
            </label>
            <input
              id="careersPageUrl"
              type="url"
              value={company.careersPageUrl}
              onChange={(e) => handleChange('careersPageUrl', e.target.value)}
              className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-400 transition-all"
              placeholder="https://yourcompany.com/careers"
            />
          </div>
        </div>
      </div>

      {/* Save Actions - Requirements 2.7, 2.8 */}
      <div className="flex items-center justify-end gap-4 pt-6 border-t border-gray-100 mt-8">
        {saveSuccess && (
          <span className="text-sm text-green-600 flex items-center gap-1 animate-in fade-in">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Changes saved successfully
          </span>
        )}
        {saveError && (
          <span className="text-sm text-red-600 flex items-center gap-1 animate-in fade-in">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            {saveError}
          </span>
        )}
        <Button variant="secondary" onClick={handleReset}>
          Reset
        </Button>
        <Button variant="primary" onClick={handleSave} disabled={updateCompany.isPending} className="px-8">
          {updateCompany.isPending ? 'Saving...' : 'Save Changes'}
        </Button>
      </div>
    </div>
  );
}


// Add User Modal Component - Requirement 19.4
interface AddUserModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (user: Omit<UserData, 'id'>) => void;
}

function AddUserModal({ isOpen, onClose, onSave }: AddUserModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'recruiter' as UserData['role'],
    password: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (!isOpen) return null;

  const handleChange = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validate = () => {
    const newErrors: Record<string, string> = {};
    if (!formData.name.trim()) newErrors.name = 'Name is required';
    if (!formData.email.trim()) newErrors.email = 'Email is required';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }
    if (!formData.password.trim()) newErrors.password = 'Password is required';
    else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      onSave({
        name: formData.name,
        email: formData.email,
        role: formData.role,
        isActive: true,
      });
      setFormData({ name: '', email: '', role: 'recruiter', password: '' });
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div className="relative bg-white rounded-xl shadow-xl w-full max-w-md mx-4 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-[#111827]">Add New User</h3>
          <button
            onClick={onClose}
            className="text-[#64748b] hover:text-[#111827] transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name */}
          <div className="form-group">
            <label htmlFor="userName" className="form-label">
              Name
            </label>
            <input
              id="userName"
              type="text"
              value={formData.name}
              onChange={(e) => handleChange('name', e.target.value)}
              className={`form-input ${errors.name ? 'error' : ''}`}
              placeholder="Enter user name"
            />
            {errors.name && <p className="form-error">{errors.name}</p>}
          </div>

          {/* Email */}
          <div className="form-group">
            <label htmlFor="userEmail" className="form-label">
              Email
            </label>
            <input
              id="userEmail"
              type="email"
              value={formData.email}
              onChange={(e) => handleChange('email', e.target.value)}
              className={`form-input ${errors.email ? 'error' : ''}`}
              placeholder="user@company.com"
            />
            {errors.email && <p className="form-error">{errors.email}</p>}
          </div>

          {/* Role */}
          <div className="form-group">
            <label htmlFor="userRole" className="form-label">
              Role
            </label>
            <select
              id="userRole"
              value={formData.role}
              onChange={(e) => handleChange('role', e.target.value)}
              className="form-select"
            >
              <option value="admin">Admin</option>
              <option value="hiring_manager">Hiring Manager</option>
              <option value="recruiter">Recruiter</option>
            </select>
          </div>

          {/* Temporary Password */}
          <div className="form-group">
            <label htmlFor="userPassword" className="form-label">
              Temporary Password
            </label>
            <input
              id="userPassword"
              type="password"
              value={formData.password}
              onChange={(e) => handleChange('password', e.target.value)}
              className={`form-input ${errors.password ? 'error' : ''}`}
              placeholder="Minimum 8 characters"
            />
            {errors.password && <p className="form-error">{errors.password}</p>}
          </div>

          {/* Actions */}
          <div className="form-actions">
            <Button variant="secondary" onClick={onClose} type="button">
              Cancel
            </Button>
            <Button variant="primary" type="submit">
              Add User
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}


// User Management Tab Component - Requirement 8.3
function UserManagementTab() {
  const { data: apiUsers, isLoading, error, refetch } = useUsers();
  const createUser = useCreateUser();
  const toggleStatus = useToggleUserStatus();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Map API users to local format, fall back to sample data
  const users: UserData[] = apiUsers?.map((u: User) => ({
    id: u.id,
    name: u.name,
    email: u.email,
    role: u.role,
    isActive: u.isActive,
  })) || sampleUsers;

  const handleAddUser = async (newUser: Omit<UserData, 'id'>) => {
    try {
      await createUser.mutateAsync({
        name: newUser.name,
        email: newUser.email,
        password: 'tempPassword123', // In real app, this would come from the form
        role: newUser.role,
      });
    } catch (err) {
      console.error('Failed to create user:', err);
    }
  };

  const handleToggleStatus = async (userId: string) => {
    try {
      await toggleStatus.mutateAsync(userId);
    } catch (err) {
      console.error('Failed to toggle user status:', err);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return <ErrorMessage message="Failed to load users" onRetry={() => refetch()} />;
  }

  const getRoleDisplayName = (role: UserData['role']) => {
    switch (role) {
      case 'admin': return 'Admin';
      case 'hiring_manager': return 'Hiring Manager';
      case 'recruiter': return 'Recruiter';
      default: return role;
    }
  };

  const getRoleBadgeVariant = (role: UserData['role']) => {
    switch (role) {
      case 'admin': return 'blue';
      case 'hiring_manager': return 'green';
      case 'recruiter': return 'gray';
      default: return 'gray';
    }
  };

  // Generate avatar background color based on name
  const getAvatarColor = (name: string) => {
    const colors = ['#0b6cf0', '#16a34a', '#ea580c', '#7c3aed', '#db2777'];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const userColumns: Column<UserData>[] = [
    {
      key: 'name',
      header: 'User',
      render: (row) => (
        <div className="flex items-center gap-3">
          <div
            className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-medium flex-shrink-0"
            style={{ backgroundColor: getAvatarColor(row.name) }}
          >
            {row.name.split(' ').map(n => n[0]).join('').toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="font-medium text-[#111827] truncate">{row.name}</div>
            <div className="text-xs text-[#64748b] truncate">{row.email}</div>
          </div>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) => (
        <Badge text={getRoleDisplayName(row.role)} variant={getRoleBadgeVariant(row.role) as 'blue' | 'green' | 'gray'} />
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => (
        <Badge
          text={row.isActive ? 'Active' : 'Inactive'}
          variant={row.isActive ? 'green' : 'red'}
        />
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (row) => (
        <div className="flex items-center gap-3">
          <button className="text-sm text-[#0b6cf0] hover:text-[#0958c7] font-medium transition-colors">
            Edit
          </button>
          <span className="text-[#e2e8f0]">|</span>
          <button
            className={`text-sm font-medium transition-colors ${row.isActive
              ? 'text-[#dc2626] hover:text-[#b91c1c]'
              : 'text-[#16a34a] hover:text-[#15803d]'
              }`}
            onClick={() => handleToggleStatus(row.id)}
          >
            {row.isActive ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-[#111827]">User Management</h3>
          <p className="text-sm text-[#64748b] mt-1">Manage team members and their access levels</p>
        </div>
        <Button variant="primary" onClick={() => setIsModalOpen(true)}>
          <span className="flex items-center gap-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </span>
        </Button>
      </div>

      <div className="bg-white rounded-xl border border-[#e2e8f0] shadow-sm overflow-hidden">
        <Table
          columns={userColumns}
          data={users}
          keyExtractor={(row) => row.id}
        />
      </div>

      <AddUserModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleAddUser}
      />
    </div>
  );
}


// Role Configuration Tab Component - Requirement 19.6
function RoleConfigurationTab() {
  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-[#111827]">Role Configuration</h3>
      <p className="text-sm text-[#64748b]">
        View the permissions and access levels for each role in the system.
      </p>

      <div className="grid gap-6">
        {roleConfigs.map((role) => (
          <div
            key={role.id}
            className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm"
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h4 className="text-base font-semibold text-[#111827]">{role.displayName}</h4>
                <p className="text-sm text-[#64748b] mt-1">{role.description}</p>
              </div>
              <Badge
                text={role.displayName}
                variant={
                  role.name === 'admin' ? 'blue' :
                    role.name === 'hiring_manager' ? 'green' : 'gray'
                }
              />
            </div>

            <div className="border-t border-[#e2e8f0] pt-4">
              <h5 className="text-sm font-medium text-[#374151] mb-3">Permissions</h5>
              <ul className="space-y-2">
                {role.permissions.map((permission, index) => (
                  <li key={index} className="flex items-start gap-2 text-sm text-[#64748b]">
                    <svg
                      className={`w-4 h-4 mt-0.5 flex-shrink-0 ${permission.startsWith('Cannot') ? 'text-red-500' : 'text-green-500'
                        }`}
                      fill="currentColor"
                      viewBox="0 0 20 20"
                    >
                      {permission.startsWith('Cannot') ? (
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      ) : (
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      )}
                    </svg>
                    {permission}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}


// SLA Configuration Tab Component - Requirement 10.5
function SLAConfigTab() {
  return (
    <div className="space-y-6">
      <SLAConfigSection />
    </div>
  );
}


// Calendar Integration Tab Component - Requirements 4.1, 5.1
function CalendarIntegrationTab() {
  return (
    <div className="space-y-6">
      <CalendarConnectionSettings />
    </div>
  );
}


// Main Settings Page Component - Requirement 19.1
export function SettingsPage() {
  const { user, logout } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();

  // Get active tab from URL or default to 'company'
  const activeTab = (searchParams.get('tab') as TabId) || 'company';

  const handleTabChange = (tabId: TabId) => {
    setSearchParams({ tab: tabId });
  };

  const renderTabContent = () => {
    switch (activeTab) {
      case 'company':
        return <CompanyProfileTab />;
      case 'users':
        return <UserManagementTab />;
      case 'roles':
        return <RoleConfigurationTab />;
      case 'sla':
        return <SLAConfigTab />;
      case 'calendar':
        return <CalendarIntegrationTab />;
      default:
        return <CompanyProfileTab />;
    }
  };

  return (
    <Layout
      pageTitle="Settings"
      pageSubtitle="Manage company profile, users, and system configuration"
      user={user}
      companyName="Acme Technologies"
      footerLeftText="SnapFind Client ATS · Settings"
      footerRightText=""
      onLogout={logout}
    >
      <div className="max-w-7xl mx-auto space-y-6 pb-20 px-4 sm:px-6 lg:px-8">
        {/* Tab Navigation - Requirement 8.1 */}
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm sticky top-0 z-10 w-full mb-6">
          <div className="flex border-b border-gray-200 overflow-x-auto custom-scrollbar">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex-shrink-0 px-8 py-4 text-sm font-medium transition-all duration-200 relative whitespace-nowrap ${activeTab === tab.id
                  ? 'text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                  }`}
              >
                {tab.label}
                {activeTab === tab.id && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600 rounded-t-full" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="min-h-[500px] animate-in fade-in duration-300 w-full">
          {renderTabContent()}
        </div>
      </div>
    </Layout>
  );
}

export default SettingsPage;
