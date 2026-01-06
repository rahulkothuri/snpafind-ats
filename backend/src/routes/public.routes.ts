import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import { processAutoRejection } from '../services/autoRejection.service.js';

const router = Router();

// Configure multer for resume uploads (public applications)
const UPLOAD_DIR = 'uploads/resumes';
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB for public applications (Requirements 5.5)
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];
const ALLOWED_EXTENSIONS = ['.pdf', '.doc', '.docx'];

// Ensure upload directory exists
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `resume-${uniqueSuffix}${ext}`);
  },
});

const fileFilter = (_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    cb(new Error(`Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`));
    return;
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX'));
    return;
  }

  cb(null, true);
};

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});


// Validation schema for public application
const publicApplicationSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email format'),
  phone: z.string().min(1, 'Phone is required'),
  currentLocation: z.string().min(1, 'Current location is required'),
  linkedinProfile: z.string().optional(),
  portfolioUrl: z.string().optional(),
  coverLetter: z.string().optional(),
  currentCompany: z.string().optional(),
  currentCtc: z.string().optional(),
  expectedCtc: z.string().optional(),
  noticePeriod: z.string().optional(),
  desiredSalary: z.string().optional(),
  workAuthorization: z.enum(['yes', 'no']),
  agreedToTerms: z.boolean(),
  screeningAnswers: z.string().optional(), // JSON string of screening question answers
});

/**
 * Validate resume file format and size for public applications
 * Requirements: 5.5
 */
export const validatePublicResumeFile = (file: {
  mimetype: string;
  size: number;
  originalname: string
}): { valid: boolean; error?: string } => {
  const ext = path.extname(file.originalname).toLowerCase();

  if (!ALLOWED_EXTENSIONS.includes(ext)) {
    return {
      valid: false,
      error: `Invalid file extension. Allowed: ${ALLOWED_EXTENSIONS.join(', ')}`
    };
  }

  if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    return { valid: false, error: 'Invalid file type. Allowed: PDF, DOC, DOCX' };
  }

  if (file.size > MAX_FILE_SIZE) {
    return { valid: false, error: 'File size exceeds maximum limit of 5MB' };
  }

  return { valid: true };
};

/**
 * GET /api/public/jobs/:id
 * Get a job by ID for public application form (no auth required)
 * Returns all job details including company info for the application page
 * Requirements: 5.1, 5.2, 5.3, 5.4, 5.5
 */
router.get('/jobs/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const job = await prisma.job.findUnique({
      where: { id: req.params.id },
      include: {
        company: {
          select: {
            id: true,
            name: true,
            logoUrl: true,
            website: true,
            industry: true,
            description: true,
            city: true,
            state: true,
            country: true,
          },
        },
      },
    });

    if (!job) {
      throw new NotFoundError('Job');
    }

    // Only return active jobs for public access
    if (job.status !== 'active') {
      throw new NotFoundError('Job');
    }

    // Return all job details with company info for application page (Requirements 5.2, 5.3, 5.4, 5.5)
    res.json({
      id: job.id,
      title: job.title,
      companyId: job.companyId,
      department: job.department,

      // Company info (Requirements 5.2)
      companyName: job.company.name,
      companyLogo: job.company.logoUrl,
      companyWebsite: job.company.website,
      companyIndustry: job.company.industry,
      companyDescription: job.company.description,
      companyCity: job.company.city,
      companyState: job.company.state,
      companyCountry: job.company.country,

      // Experience range (Requirements 5.3)
      experienceMin: job.experienceMin,
      experienceMax: job.experienceMax,

      // Salary range (Requirements 5.3)
      salaryMin: job.salaryMin,
      salaryMax: job.salaryMax,
      variables: job.variables,

      // Requirements (Requirements 5.3)
      educationQualification: job.educationQualification,
      ageUpTo: job.ageUpTo,
      skills: job.skills,
      preferredIndustry: job.preferredIndustry,

      // Work details (Requirements 5.3)
      workMode: job.workMode,
      locations: job.locations,
      priority: job.priority,
      jobDomain: job.jobDomain,

      // Content (Requirements 5.4)
      description: job.description,
      openings: job.openings,

      // Screening questions for application form
      screeningQuestions: job.screeningQuestions || [],

      // Legacy fields (kept for compatibility)
      location: job.location,
      employmentType: job.employmentType,
      salaryRange: job.salaryRange,
    });
  } catch (error) {
    next(error);
  }
});


/**
 * POST /api/public/applications
 * Submit a public job application (no auth required)
 * Requirements: 5.10, 6.1, 6.2
 */
router.post('/applications', (req: Request, res: Response, next: NextFunction) => {
  upload.single('resume')(req, res, async (err) => {
    try {
      // Handle multer errors (Requirements 5.5)
      if (err instanceof multer.MulterError) {
        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            code: 'FILE_TOO_LARGE',
            message: 'File size exceeds maximum limit of 5MB',
          });
        }
        return res.status(400).json({
          code: 'UPLOAD_ERROR',
          message: err.message,
        });
      }

      if (err) {
        return res.status(400).json({
          code: 'INVALID_FILE',
          message: err.message,
        });
      }

      // Parse and validate form data
      const formData = {
        jobId: req.body.jobId,
        fullName: req.body.fullName,
        email: req.body.email,
        phone: req.body.phone,
        currentLocation: req.body.currentLocation,
        linkedinProfile: req.body.linkedinProfile,
        portfolioUrl: req.body.portfolioUrl,
        coverLetter: req.body.coverLetter,
        currentCompany: req.body.currentCompany,
        currentCtc: req.body.currentCtc,
        expectedCtc: req.body.expectedCtc,
        noticePeriod: req.body.noticePeriod,
        desiredSalary: req.body.desiredSalary,
        workAuthorization: req.body.workAuthorization,
        agreedToTerms: req.body.agreedToTerms === 'true' || req.body.agreedToTerms === true,
        screeningAnswers: req.body.screeningAnswers,
      };

      const result = publicApplicationSchema.safeParse(formData);
      if (!result.success) {
        const errors: Record<string, string[]> = {};
        result.error.issues.forEach((issue) => {
          const path = issue.path.join('.');
          if (!errors[path]) {
            errors[path] = [];
          }
          errors[path].push(issue.message);
        });
        throw new ValidationError(errors);
      }

      const data = result.data;

      // Validate terms agreement (Requirements 5.9)
      if (!data.agreedToTerms) {
        return res.status(400).json({
          code: 'TERMS_NOT_AGREED',
          message: 'You must agree to the privacy policy and terms of service',
        });
      }

      // Verify job exists and is active
      const job = await prisma.job.findUnique({
        where: { id: data.jobId },
        include: {
          pipelineStages: {
            where: { name: 'Applied' },
            take: 1,
          },
        },
      });

      if (!job || job.status !== 'active') {
        return res.status(404).json({
          code: 'JOB_NOT_FOUND',
          message: 'Job not found or no longer accepting applications',
        });
      }

      // Get the "Applied" stage for this job (Requirements 6.2)
      const appliedStage = job.pipelineStages[0];
      if (!appliedStage) {
        return res.status(500).json({
          code: 'PIPELINE_ERROR',
          message: 'Job pipeline not properly configured',
        });
      }

      // Build resume URL if file was uploaded
      const resumeUrl = req.file ? `/${UPLOAD_DIR}/${req.file.filename}` : null;

      // Check if candidate with email already exists (Requirements 5.12)
      const existingCandidate = await prisma.candidate.findUnique({
        where: { email: data.email.toLowerCase() },
      });

      let candidate;
      let isNewCandidate = false;

      if (existingCandidate) {
        // Update existing candidate record (Requirements 5.12)
        candidate = await prisma.candidate.update({
          where: { id: existingCandidate.id },
          data: {
            name: data.fullName,
            phone: data.phone,
            location: data.currentLocation,
            currentCompany: data.currentCompany,
            currentCtc: data.currentCtc,
            expectedCtc: data.expectedCtc,
            noticePeriod: data.noticePeriod,
            resumeUrl: resumeUrl || existingCandidate.resumeUrl,
            updatedAt: new Date(),
          },
        });
      } else {
        // Create new candidate record (Requirements 6.1)
        isNewCandidate = true;
        candidate = await prisma.candidate.create({
          data: {
            companyId: job.companyId,
            name: data.fullName,
            email: data.email.toLowerCase(),
            phone: data.phone,
            location: data.currentLocation,
            currentCompany: data.currentCompany,
            currentCtc: data.currentCtc,
            expectedCtc: data.expectedCtc,
            noticePeriod: data.noticePeriod,
            source: 'Public Application',
            resumeUrl: resumeUrl,
            experienceYears: 0,
            skills: [],
          },
        });
      }

      // Check if candidate already applied to this job
      const existingApplication = await prisma.jobCandidate.findUnique({
        where: {
          jobId_candidateId: {
            jobId: data.jobId,
            candidateId: candidate.id,
          },
        },
        include: {
          currentStage: true,
        },
      });

      let jobCandidate;
      let movedFromQueue = false;

      if (existingApplication) {
        // Check if candidate is in Queue stage (from bulk import)
        if (existingApplication.currentStage.name === 'Queue') {
          // Move candidate from Queue to Applied stage
          jobCandidate = await prisma.jobCandidate.update({
            where: { id: existingApplication.id },
            data: {
              currentStageId: appliedStage.id,
            },
          });
          movedFromQueue = true;

          // Create stage history entry for the move
          await prisma.stageHistory.updateMany({
            where: {
              jobCandidateId: existingApplication.id,
              exitedAt: null,
            },
            data: {
              exitedAt: new Date(),
            },
          });

          await prisma.stageHistory.create({
            data: {
              jobCandidateId: existingApplication.id,
              stageId: appliedStage.id,
              stageName: appliedStage.name,
              comment: 'Completed application form',
            },
          });
        } else {
          // Already applied (not in Queue stage)
          return res.status(409).json({
            code: 'ALREADY_APPLIED',
            message: 'You have already applied to this job',
          });
        }
      } else {
        // Create JobCandidate association with "Applied" stage (Requirements 6.2)
        jobCandidate = await prisma.jobCandidate.create({
          data: {
            jobId: data.jobId,
            candidateId: candidate.id,
            currentStageId: appliedStage.id,
          },
        });
      }

      // Create activity record for the application
      // Parse screening answers if provided
      let screeningAnswers = null;
      if (data.screeningAnswers) {
        try {
          screeningAnswers = JSON.parse(data.screeningAnswers);
        } catch {
          // Invalid JSON, ignore
        }
      }

      await prisma.candidateActivity.create({
        data: {
          candidateId: candidate.id,
          jobCandidateId: jobCandidate.id,
          activityType: 'stage_change',
          description: movedFromQueue
            ? 'Completed application form (moved from Queue to Applied)'
            : 'Applied via public application form',
          metadata: {
            linkedinProfile: data.linkedinProfile,
            portfolioUrl: data.portfolioUrl,
            coverLetter: data.coverLetter,
            desiredSalary: data.desiredSalary,
            workAuthorization: data.workAuthorization,
            screeningAnswers: screeningAnswers,
          },
        },
      });

      // Process auto-rejection rules (Requirements 4.6, 9.2, 9.3, 9.5, 9.6)
      // This is non-retroactive - only applies to new applications (Requirements 4.11)
      let wasAutoRejected = false;
      try {
        wasAutoRejected = await processAutoRejection(
          jobCandidate.id,
          candidate.id,
          {
            experience: candidate.experienceYears,
            location: candidate.location,
            skills: (candidate.skills as string[]) || [],
            education: undefined, // Not available in application data
            salaryExpectation: data.desiredSalary ? parseFloat(data.desiredSalary) : undefined,
          },
          data.jobId
        );
      } catch (autoRejectionError) {
        // Log but don't fail the application if auto-rejection fails
        console.error('Auto-rejection processing failed:', autoRejectionError);
      }

      res.status(201).json({
        success: true,
        applicationId: jobCandidate.id,
        candidateId: candidate.id,
        isNewCandidate,
        movedFromQueue,
        wasAutoRejected,
        message: wasAutoRejected
          ? 'Application submitted but did not meet minimum requirements'
          : 'Application submitted successfully',
      });
    } catch (error) {
      next(error);
    }
  });
});

export { ALLOWED_EXTENSIONS, ALLOWED_MIME_TYPES, MAX_FILE_SIZE };

export default router;
