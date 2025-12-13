export { default as api, getResumeUrl } from './api';
export { default as authService } from './auth.service';
export { default as jobsService } from './jobs.service';
export { default as candidatesService } from './candidates.service';
export { default as usersService } from './users.service';
export { default as companyService } from './company.service';
export { default as dashboardService } from './dashboard.service';

export type { Job, PipelineStage, CreateJobData } from './jobs.service';
export type { Candidate, JobCandidate, CandidateActivity, CreateCandidateData, CandidateSearchParams } from './candidates.service';
export type { User, UserRole, CreateUserData, UpdateUserData } from './users.service';
export type { Company, UpdateCompanyData } from './company.service';
export type { DashboardMetrics, RolePipeline, FunnelStage, SourcePerformance, RecruiterLoad, DashboardData } from './dashboard.service';
