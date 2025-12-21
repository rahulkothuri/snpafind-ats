/**
 * Job Details Page - Requirements 5.4, 5.5
 * 
 * Displays detailed information about a specific job with role-based access control.
 * 
 * Features:
 * - Job information display
 * - Role-based action buttons
 * - Pipeline stages visualization
 * - Candidate management (if permitted)
 */

import { useParams, useNavigate } from 'react-router-dom';
import { Layout, Button, Badge, LoadingSpinner, ErrorMessage } from '../components';
import { useAuth } from '../hooks/useAuth';
import { useJob } from '../hooks/useJobs';

export function JobDetailsPage() {
  const { user, logout } = useAuth();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  const { data: job, isLoading, error, refetch } = useJob(id!);

  // Determine user permissions for this job
  const canEdit = user?.role === 'admin' || 
                  user?.role === 'hiring_manager' || 
                  (user?.role === 'recruiter' && (job as any)?.assignedRecruiterId === user.id);

  const canManageCandidates = canEdit;

  if (isLoading) {
    return (
      <Layout
        pageTitle="Job Details"
        user={user}
        companyName="Acme Technologies"
        footerLeftText="SnapFind Client ATS · Job Management"
        onLogout={logout}
      >
        <div className="flex justify-center py-12">
          <LoadingSpinner size="lg" />
        </div>
      </Layout>
    );
  }

  if (error || !job) {
    return (
      <Layout
        pageTitle="Job Details"
        user={user}
        companyName="Acme Technologies"
        footerLeftText="SnapFind Client ATS · Job Management"
        onLogout={logout}
      >
        <ErrorMessage
          message="Failed to load job details"
          onRetry={() => refetch()}
        />
      </Layout>
    );
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      <Button variant="outline" size="sm" onClick={() => navigate(-1)}>
        ← Back
      </Button>
      {canEdit && (
        <>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => navigate(`/jobs/${job.id}/edit`)}
          >
            Edit Job
          </Button>
          <Button variant="primary" size="sm">
            Share Job
          </Button>
        </>
      )}
    </div>
  );

  return (
    <Layout
      pageTitle={job.title}
      pageSubtitle={`${job.department} • ${job.location}`}
      headerActions={headerActions}
      user={user}
      companyName="Acme Technologies"
      footerLeftText="SnapFind Client ATS · Job Management"
      onLogout={logout}
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Job Overview Card */}
        <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-xl font-semibold text-[#111827] mb-2">{job.title}</h2>
              <div className="flex items-center gap-4 text-sm text-[#64748b]">
                <span>{job.department}</span>
                <span>•</span>
                <span>{job.location}</span>
                <span>•</span>
                <span>{job.openings} opening{job.openings !== 1 ? 's' : ''}</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                text={job.status} 
                variant={job.status === 'active' ? 'green' : job.status === 'paused' ? 'orange' : 'gray'} 
              />
              {(job as any).priority && (
                <Badge 
                  text={(job as any).priority} 
                  variant={(job as any).priority === 'High' ? 'priority' : 'gray'} 
                />
              )}
            </div>
          </div>

          {/* Job Details Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {(job as any).experienceMin !== undefined && (job as any).experienceMax !== undefined && (
              <div>
                <h4 className="text-sm font-medium text-[#111827] mb-1">Experience</h4>
                <p className="text-sm text-[#64748b]">
                  {(job as any).experienceMin} - {(job as any).experienceMax} years
                </p>
              </div>
            )}

            {(job as any).salaryMin !== undefined && (job as any).salaryMax !== undefined && (
              <div>
                <h4 className="text-sm font-medium text-[#111827] mb-1">Salary Range</h4>
                <p className="text-sm text-[#64748b]">
                  ₹{(job as any).salaryMin?.toLocaleString()} - ₹{(job as any).salaryMax?.toLocaleString()}
                </p>
              </div>
            )}

            {(job as any).workMode && (
              <div>
                <h4 className="text-sm font-medium text-[#111827] mb-1">Work Mode</h4>
                <p className="text-sm text-[#64748b]">{(job as any).workMode}</p>
              </div>
            )}

            {(job as any).educationQualification && (
              <div>
                <h4 className="text-sm font-medium text-[#111827] mb-1">Education</h4>
                <p className="text-sm text-[#64748b]">{(job as any).educationQualification}</p>
              </div>
            )}

            {(job as any).preferredIndustry && (
              <div>
                <h4 className="text-sm font-medium text-[#111827] mb-1">Preferred Industry</h4>
                <p className="text-sm text-[#64748b]">{(job as any).preferredIndustry}</p>
              </div>
            )}

            {(job as any).jobDomain && (
              <div>
                <h4 className="text-sm font-medium text-[#111827] mb-1">Job Domain</h4>
                <p className="text-sm text-[#64748b]">{(job as any).jobDomain}</p>
              </div>
            )}
          </div>

          {/* Skills */}
          {(job as any).skills && (job as any).skills.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-[#111827] mb-2">Required Skills</h4>
              <div className="flex flex-wrap gap-2">
                {(job as any).skills.map((skill: string) => (
                  <Badge key={skill} text={skill} variant="blue" />
                ))}
              </div>
            </div>
          )}

          {/* Locations */}
          {(job as any).locations && (job as any).locations.length > 0 && (
            <div className="mt-6">
              <h4 className="text-sm font-medium text-[#111827] mb-2">Job Locations</h4>
              <div className="flex flex-wrap gap-2">
                {(job as any).locations.map((location: string) => (
                  <Badge key={location} text={location} variant="gray" />
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Job Description */}
        {job.description && (
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Job Description</h3>
            <div className="prose prose-sm max-w-none text-[#64748b]">
              <pre className="whitespace-pre-wrap font-sans">{job.description}</pre>
            </div>
          </div>
        )}

        {/* Pipeline Stages */}
        {(job as any).stages && (job as any).stages.length > 0 && (
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Pipeline Stages</h3>
            <div className="space-y-3">
              {(job as any).stages
                .filter((stage: any) => !stage.parentId)
                .sort((a: any, b: any) => a.position - b.position)
                .map((stage: any) => (
                  <div key={stage.id} className="flex items-center justify-between p-3 bg-[#f8fafc] rounded-lg border border-[#e2e8f0]">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#0b6cf0] text-white text-sm font-medium flex items-center justify-center">
                        {stage.position + 1}
                      </div>
                      <div>
                        <div className="font-medium text-[#111827]">{stage.name}</div>
                        {stage.subStages && stage.subStages.length > 0 && (
                          <div className="text-xs text-[#64748b] mt-1">
                            {stage.subStages.length} sub-stage{stage.subStages.length !== 1 ? 's' : ''}
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {stage.isMandatory && (
                        <Badge text="Required" variant="red" />
                      )}
                      <span className="text-sm text-[#64748b]">
                        {stage.candidateCount || 0} candidates
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        {canManageCandidates && (
          <div className="bg-white rounded-xl border border-[#e2e8f0] p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-[#111827] mb-4">Candidate Management</h3>
            <div className="flex items-center gap-3">
              <Button variant="primary">
                View Candidates ({job.candidateCount || 0})
              </Button>
              <Button variant="outline">
                Add Candidate
              </Button>
              <Button variant="outline">
                Bulk Import
              </Button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

export default JobDetailsPage;