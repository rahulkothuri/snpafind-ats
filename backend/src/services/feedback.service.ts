import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import type { InterviewFeedback, FeedbackRating, InterviewRecommendation, Interview } from '../types/index.js';
import { interviewActivityService } from './interviewActivity.service.js';

export interface SubmitFeedbackInput { interviewId: string; panelMemberId: string; ratings: FeedbackRating[]; overallComments: string; recommendation: InterviewRecommendation; }

export interface ScorecardCriterion { name: string; label: string; description: string; weight?: number; }

export interface ScorecardTemplate { id: string; companyId: string; name: string; criteria: ScorecardCriterion[]; isDefault: boolean; createdAt: Date; updatedAt: Date; }

export const DEFAULT_SCORECARD_CRITERIA: ScorecardCriterion[] = [
  { name: 'technical_skills', label: 'Technical Skills', description: 'Relevant technical knowledge', weight: 1 },
  { name: 'communication', label: 'Communication', description: 'Clarity and listening skills', weight: 1 },
  { name: 'culture_fit', label: 'Culture Fit', description: 'Alignment with company values', weight: 1 },
  { name: 'experience', label: 'Relevant Experience', description: 'Past experience applicable to the role', weight: 1 },
  { name: 'motivation', label: 'Motivation', description: 'Enthusiasm for the role', weight: 1 },
];
