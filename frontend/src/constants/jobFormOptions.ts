/**
 * Constants for job form dropdown options
 * Used in JobCreationPage and related components
 */

import type { WorkMode, JobPriority } from '../types';

// Work mode options (Requirement 1.5)
export const WORK_MODES: { value: WorkMode; label: string }[] = [
  { value: 'Onsite', label: 'Onsite' },
  { value: 'WFH', label: 'Work From Home' },
  { value: 'Hybrid', label: 'Hybrid' },
  { value: 'C2C', label: 'Contract to Contract (C2C)' },
  { value: 'C2H', label: 'Contract to Hire (C2H)' },
];

// Job priority options (Requirement 1.6)
export const JOB_PRIORITIES: { value: JobPriority; label: string }[] = [
  { value: 'Low', label: 'Low' },
  { value: 'Medium', label: 'Medium' },
  { value: 'High', label: 'High' },
];

// Education qualification options
export const EDUCATION_QUALIFICATIONS: { value: string; label: string }[] = [
  { value: 'high_school', label: 'High School' },
  { value: 'diploma', label: 'Diploma' },
  { value: 'bachelors', label: "Bachelor's Degree" },
  { value: 'masters', label: "Master's Degree" },
  { value: 'mba', label: 'MBA' },
  { value: 'phd', label: 'PhD' },
  { value: 'ca', label: 'Chartered Accountant (CA)' },
  { value: 'cfa', label: 'CFA' },
  { value: 'any', label: 'Any' },
];

// Industry options
export const INDUSTRIES: { value: string; label: string }[] = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance & Banking' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'retail', label: 'Retail & E-commerce' },
  { value: 'consulting', label: 'Consulting' },
  { value: 'education', label: 'Education' },
  { value: 'media', label: 'Media & Entertainment' },
  { value: 'telecom', label: 'Telecommunications' },
  { value: 'real_estate', label: 'Real Estate' },
  { value: 'hospitality', label: 'Hospitality' },
  { value: 'logistics', label: 'Logistics & Supply Chain' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'pharma', label: 'Pharmaceutical' },
  { value: 'energy', label: 'Energy & Utilities' },
  { value: 'startup', label: 'Startup' },
  { value: 'other', label: 'Other' },
];

// Job domain options
export const JOB_DOMAINS: { value: string; label: string }[] = [
  { value: 'engineering', label: 'Engineering' },
  { value: 'product', label: 'Product Management' },
  { value: 'design', label: 'Design' },
  { value: 'marketing', label: 'Marketing' },
  { value: 'sales', label: 'Sales' },
  { value: 'finance', label: 'Finance & Accounting' },
  { value: 'hr', label: 'Human Resources' },
  { value: 'operations', label: 'Operations' },
  { value: 'customer_success', label: 'Customer Success' },
  { value: 'data', label: 'Data & Analytics' },
  { value: 'legal', label: 'Legal' },
  { value: 'admin', label: 'Administration' },
  { value: 'it', label: 'IT & Infrastructure' },
  { value: 'qa', label: 'Quality Assurance' },
  { value: 'research', label: 'Research & Development' },
  { value: 'other', label: 'Other' },
];

// Cities for location multi-select (Indian cities)
export const CITIES: { value: string; label: string }[] = [
  { value: 'mumbai', label: 'Mumbai' },
  { value: 'delhi', label: 'Delhi' },
  { value: 'bangalore', label: 'Bangalore' },
  { value: 'hyderabad', label: 'Hyderabad' },
  { value: 'chennai', label: 'Chennai' },
  { value: 'kolkata', label: 'Kolkata' },
  { value: 'pune', label: 'Pune' },
  { value: 'ahmedabad', label: 'Ahmedabad' },
  { value: 'jaipur', label: 'Jaipur' },
  { value: 'lucknow', label: 'Lucknow' },
  { value: 'kanpur', label: 'Kanpur' },
  { value: 'nagpur', label: 'Nagpur' },
  { value: 'indore', label: 'Indore' },
  { value: 'thane', label: 'Thane' },
  { value: 'bhopal', label: 'Bhopal' },
  { value: 'visakhapatnam', label: 'Visakhapatnam' },
  { value: 'vadodara', label: 'Vadodara' },
  { value: 'ghaziabad', label: 'Ghaziabad' },
  { value: 'ludhiana', label: 'Ludhiana' },
  { value: 'agra', label: 'Agra' },
  { value: 'nashik', label: 'Nashik' },
  { value: 'faridabad', label: 'Faridabad' },
  { value: 'meerut', label: 'Meerut' },
  { value: 'rajkot', label: 'Rajkot' },
  { value: 'varanasi', label: 'Varanasi' },
  { value: 'srinagar', label: 'Srinagar' },
  { value: 'aurangabad', label: 'Aurangabad' },
  { value: 'dhanbad', label: 'Dhanbad' },
  { value: 'amritsar', label: 'Amritsar' },
  { value: 'noida', label: 'Noida' },
  { value: 'gurgaon', label: 'Gurgaon' },
  { value: 'chandigarh', label: 'Chandigarh' },
  { value: 'coimbatore', label: 'Coimbatore' },
  { value: 'kochi', label: 'Kochi' },
  { value: 'thiruvananthapuram', label: 'Thiruvananthapuram' },
  { value: 'remote', label: 'Remote' },
];

// Skills for multi-select
export const SKILLS: { value: string; label: string }[] = [
  // Programming Languages
  { value: 'javascript', label: 'JavaScript' },
  { value: 'typescript', label: 'TypeScript' },
  { value: 'python', label: 'Python' },
  { value: 'java', label: 'Java' },
  { value: 'csharp', label: 'C#' },
  { value: 'cpp', label: 'C++' },
  { value: 'go', label: 'Go' },
  { value: 'rust', label: 'Rust' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'php', label: 'PHP' },
  { value: 'swift', label: 'Swift' },
  { value: 'kotlin', label: 'Kotlin' },
  
  // Frontend
  { value: 'react', label: 'React' },
  { value: 'angular', label: 'Angular' },
  { value: 'vue', label: 'Vue.js' },
  { value: 'nextjs', label: 'Next.js' },
  { value: 'html', label: 'HTML' },
  { value: 'css', label: 'CSS' },
  { value: 'tailwind', label: 'Tailwind CSS' },
  
  // Backend
  { value: 'nodejs', label: 'Node.js' },
  { value: 'express', label: 'Express.js' },
  { value: 'django', label: 'Django' },
  { value: 'flask', label: 'Flask' },
  { value: 'spring', label: 'Spring Boot' },
  { value: 'dotnet', label: '.NET' },
  
  // Databases
  { value: 'sql', label: 'SQL' },
  { value: 'postgresql', label: 'PostgreSQL' },
  { value: 'mysql', label: 'MySQL' },
  { value: 'mongodb', label: 'MongoDB' },
  { value: 'redis', label: 'Redis' },
  
  // Cloud & DevOps
  { value: 'aws', label: 'AWS' },
  { value: 'azure', label: 'Azure' },
  { value: 'gcp', label: 'Google Cloud' },
  { value: 'docker', label: 'Docker' },
  { value: 'kubernetes', label: 'Kubernetes' },
  { value: 'terraform', label: 'Terraform' },
  { value: 'cicd', label: 'CI/CD' },
  
  // Data & Analytics
  { value: 'data_analysis', label: 'Data Analysis' },
  { value: 'machine_learning', label: 'Machine Learning' },
  { value: 'deep_learning', label: 'Deep Learning' },
  { value: 'tableau', label: 'Tableau' },
  { value: 'power_bi', label: 'Power BI' },
  { value: 'excel', label: 'Advanced Excel' },
  
  // Finance & Accounting
  { value: 'financial_modeling', label: 'Financial Modeling' },
  { value: 'fpa', label: 'FP&A' },
  { value: 'budgeting', label: 'Budgeting' },
  { value: 'forecasting', label: 'Forecasting' },
  { value: 'variance_analysis', label: 'Variance Analysis' },
  { value: 'cost_management', label: 'Cost Management' },
  { value: 'financial_reporting', label: 'Financial Reporting' },
  { value: 'tally', label: 'Tally' },
  { value: 'sap', label: 'SAP' },
  
  // Soft Skills
  { value: 'communication', label: 'Communication' },
  { value: 'leadership', label: 'Leadership' },
  { value: 'problem_solving', label: 'Problem Solving' },
  { value: 'teamwork', label: 'Teamwork' },
  { value: 'project_management', label: 'Project Management' },
  { value: 'agile', label: 'Agile/Scrum' },
  
  // Other
  { value: 'git', label: 'Git' },
  { value: 'api_design', label: 'API Design' },
  { value: 'testing', label: 'Testing' },
  { value: 'security', label: 'Security' },
];
