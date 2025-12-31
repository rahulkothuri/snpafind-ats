import prisma from '../lib/prisma.js';
import { NotFoundError, ValidationError } from '../middleware/errorHandler.js';
import type {
  Interview,
  CreateInterviewInput,
  UpdateInterviewInput,
  InterviewFilters,
  DashboardInterviews,
  PanelLoad,
  InterviewMode,
  InterviewStatus,
} from '../types/index.js';
import { interviewActivityService } from './interviewActivity.service.js';
import { calendarService } from './calendar.service.js';
import { emailService } from './email.service.js';

/**
 * Interview Service
 * Handles CRUD operations for interview scheduling and management
 * Requirements: 1.3, 1.4, 8.3, 8.5, 17.1, 17.2
 */
export const interviewService = {
  /**
   * Create a new interview
   * Requirements: 1.3, 1.4, 17.1
   */
  async createInterview(data: CreateInterviewInput): Promise<Interview> {
    // Validate required fields (Requirements 1.5)
    const errors: Record<string, string[]> = {};

    if (!data.jobCandidateId) {
      errors.jobCandidateId = ['Job candidate ID is required'];
    }

    if (!data.scheduledAt) {
      errors.scheduledAt = ['Scheduled date/time is required'];
    }

    if (!data.duration || data.duration <= 0) {
      errors.duration = ['Duration must be a positive number'];
    }

    if (!data.timezone) {
      errors.timezone = ['Timezone is required'];
    }

    if (!data.mode) {
      errors.mode = ['Interview mode is required'];
    }

    if (!data.panelMemberIds || data.panelMemberIds.length === 0) {
      errors.panelMemberIds = ['At least one panel member is required'];
    }

    if (!data.scheduledBy) {
      errors.scheduledBy = ['Scheduler user ID is required'];
    }

    // Validate in_person mode requires location (Requirements 2.4)
    if (data.mode === 'in_person' && !data.location) {
      errors.location = ['Location is required for in-person interviews'];
    }

    // Validate custom_url mode requires location (used as meeting URL)
    if (data.mode === 'custom_url' && !data.location) {
      errors.location = ['Meeting URL is required for custom URL interviews'];
    }

    // Validate custom URL format
    if (data.mode === 'custom_url' && data.location) {
      try {
        new URL(data.location);
      } catch {
        errors.location = ['Please provide a valid URL for the meeting'];
      }
    }

    if (Object.keys(errors).length > 0) {
      throw new ValidationError(errors);
    }

    // Verify job candidate exists
    const jobCandidate = await prisma.jobCandidate.findUnique({
      where: { id: data.jobCandidateId },
      include: {
        job: true,
        candidate: true,
      },
    });

    if (!jobCandidate) {
      throw new NotFoundError('Job candidate');
    }

    // Verify all panel members exist
    const panelMembers = await prisma.user.findMany({
      where: { id: { in: data.panelMemberIds } },
    });

    if (panelMembers.length !== data.panelMemberIds.length) {
      throw new ValidationError({
        panelMemberIds: ['One or more panel members not found'],
      });
    }

    // Verify scheduler exists
    const scheduler = await prisma.user.findUnique({
      where: { id: data.scheduledBy },
    });

    if (!scheduler) {
      throw new NotFoundError('Scheduler user');
    }

    // Create interview with panel members in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the interview
      const interview = await tx.interview.create({
        data: {
          jobCandidateId: data.jobCandidateId,
          scheduledAt: new Date(data.scheduledAt),
          duration: data.duration,
          timezone: data.timezone,
          mode: data.mode as InterviewMode,
          location: data.location,
          notes: data.notes,
          scheduledBy: data.scheduledBy,
          status: 'scheduled',
        },
      });

      // Create panel member associations
      await tx.interviewPanel.createMany({
        data: data.panelMemberIds.map((userId) => ({
          interviewId: interview.id,
          userId,
        })),
      });

      // Fetch the complete interview with relations
      const completeInterview = await tx.interview.findUnique({
        where: { id: interview.id },
        include: {
          jobCandidate: {
            include: {
              candidate: true,
              job: true,
            },
          },
          scheduler: true,
          panelMembers: {
            include: {
              user: true,
            },
          },
          feedback: {
            include: {
              panelMember: true,
            },
          },
        },
      });

      return completeInterview;
    });

    let mappedInterview = this.mapToInterview(result!);

    // Record interview_scheduled activity (Requirements 15.1)
    try {
      await interviewActivityService.recordInterviewScheduled(mappedInterview);
    } catch (error) {
      // Log error but don't fail the interview creation
      console.error('Failed to record interview scheduled activity:', error);
    }

    // Wire calendar sync (Requirements 4.2, 5.2) - Task 21.1
    try {
      // Use scheduler for calendar event creation to ensure they own the event
      const calendarUserIds = [data.scheduledBy];
      const endTime = new Date(new Date(data.scheduledAt).getTime() + data.duration * 60 * 1000);
      const candidateName = mappedInterview.jobCandidate?.candidate?.name || 'Candidate';
      const jobTitle = mappedInterview.jobCandidate?.job?.title || 'Position';

      const meetingLink = await calendarService.createCalendarEventsForInterview(
        mappedInterview.id,
        calendarUserIds,
        {
          title: `Interview: ${candidateName} - ${jobTitle}`,
          description: this.buildEventDescription(mappedInterview),
          startTime: new Date(data.scheduledAt),
          endTime,
          timezone: data.timezone,
          attendees: mappedInterview.panelMembers?.map(pm => ({
            email: pm.user?.email || '',
            name: pm.user?.name,
          })) || [],
          createMeetingLink: data.mode === 'google_meet' || data.mode === 'microsoft_teams',
        }
      );

      // Update interview with meeting link if generated
      if (meetingLink && !mappedInterview.meetingLink) {
        await prisma.interview.update({
          where: { id: mappedInterview.id },
          data: { meetingLink },
        });
        mappedInterview = { ...mappedInterview, meetingLink };
      }
    } catch (error) {
      // Log error but don't fail the interview creation
      console.error('Failed to create calendar events:', error);
    }

    // Wire email notifications (Requirements 6.1, 7.1) - Task 21.2
    try {
      await emailService.sendInterviewConfirmation(mappedInterview);
    } catch (error) {
      // Log error but don't fail the interview creation
      console.error('Failed to send interview confirmation emails:', error);
    }

    return mappedInterview;
  },

  /**
   * Build event description for calendar events
   */
  buildEventDescription(interview: Interview): string {
    const candidate = interview.jobCandidate?.candidate;
    const job = interview.jobCandidate?.job;
    const panelMembers = interview.panelMembers || [];

    let description = `Interview for ${job?.title || 'Position'}\n\n`;
    description += `Candidate: ${candidate?.name || 'Unknown'}\n`;
    description += `Email: ${candidate?.email || 'N/A'}\n`;
    description += `Duration: ${interview.duration} minutes\n`;
    description += `Mode: ${this.formatInterviewMode(interview.mode)}\n`;

    if (interview.location) {
      description += `Location: ${interview.location}\n`;
    }

    if (interview.meetingLink) {
      description += `Meeting Link: ${interview.meetingLink}\n`;
    }

    description += `\nPanel Members:\n`;
    for (const pm of panelMembers) {
      description += `- ${pm.user?.name || 'Unknown'} (${pm.user?.email || 'N/A'})\n`;
    }

    if (interview.notes) {
      description += `\nNotes: ${interview.notes}\n`;
    }

    if (candidate?.resumeUrl) {
      description += `\nResume: ${candidate.resumeUrl}\n`;
    }

    return description;
  },

  /**
   * Format interview mode for display
   */
  formatInterviewMode(mode: InterviewMode): string {
    switch (mode) {
      case 'google_meet':
        return 'Google Meet';
      case 'microsoft_teams':
        return 'Microsoft Teams';
      case 'in_person':
        return 'In-Person';
      case 'custom_url':
        return 'Custom URL';
      default:
        return mode;
    }
  },

  /**
   * Update/reschedule an interview
   * Requirements: 8.2, 8.3
   */
  async updateInterview(id: string, data: UpdateInterviewInput): Promise<Interview> {
    // Verify interview exists
    const existing = await prisma.interview.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Interview');
    }

    // Store old values for activity recording (Requirements 15.2)
    const oldScheduledAt = existing.scheduledAt;
    const oldTimezone = existing.timezone;
    const oldDuration = existing.duration;
    const oldMode = existing.mode;
    const oldLocation = existing.location;

    // Cannot update cancelled interviews
    if (existing.status === 'cancelled') {
      throw new ValidationError({
        status: ['Cannot update a cancelled interview'],
      });
    }

    // Validate in_person mode requires location
    if (data.mode === 'in_person' && !data.location && !existing.location) {
      throw new ValidationError({
        location: ['Location is required for in-person interviews'],
      });
    }

    // Validate custom_url mode requires location (used as meeting URL)
    if (data.mode === 'custom_url' && !data.location && !existing.location) {
      throw new ValidationError({
        location: ['Meeting URL is required for custom URL interviews'],
      });
    }

    // Validate custom URL format
    if (data.mode === 'custom_url' && (data.location || existing.location)) {
      const urlToValidate = data.location || existing.location;
      try {
        new URL(urlToValidate!);
      } catch {
        throw new ValidationError({
          location: ['Please provide a valid URL for the meeting'],
        });
      }
    }

    // Validate duration if provided
    if (data.duration !== undefined && data.duration <= 0) {
      throw new ValidationError({
        duration: ['Duration must be a positive number'],
      });
    }

    // Verify panel members if provided
    if (data.panelMemberIds && data.panelMemberIds.length > 0) {
      const panelMembers = await prisma.user.findMany({
        where: { id: { in: data.panelMemberIds } },
      });

      if (panelMembers.length !== data.panelMemberIds.length) {
        throw new ValidationError({
          panelMemberIds: ['One or more panel members not found'],
        });
      }
    } else if (data.panelMemberIds && data.panelMemberIds.length === 0) {
      throw new ValidationError({
        panelMemberIds: ['At least one panel member is required'],
      });
    }

    // Update interview in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Update the interview
      await tx.interview.update({
        where: { id },
        data: {
          scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : undefined,
          duration: data.duration,
          timezone: data.timezone,
          mode: data.mode as InterviewMode | undefined,
          location: data.location,
          notes: data.notes,
        },
      });

      // Update panel members if provided
      if (data.panelMemberIds) {
        // Delete existing panel members
        await tx.interviewPanel.deleteMany({
          where: { interviewId: id },
        });

        // Create new panel member associations
        await tx.interviewPanel.createMany({
          data: data.panelMemberIds.map((userId) => ({
            interviewId: id,
            userId,
          })),
        });
      }

      // Fetch the complete interview with relations
      const completeInterview = await tx.interview.findUnique({
        where: { id },
        include: {
          jobCandidate: {
            include: {
              candidate: true,
              job: true,
            },
          },
          scheduler: true,
          panelMembers: {
            include: {
              user: true,
            },
          },
          feedback: {
            include: {
              panelMember: true,
            },
          },
        },
      });

      return completeInterview;
    });

    const mappedInterview = this.mapToInterview(result!);

    // Record interview_rescheduled activity (Requirements 15.2)
    try {
      await interviewActivityService.recordInterviewRescheduled(
        mappedInterview,
        oldScheduledAt,
        oldTimezone,
        oldDuration,
        oldMode,
        oldLocation ?? undefined
      );
    } catch (error) {
      // Log error but don't fail the interview update
      console.error('Failed to record interview rescheduled activity:', error);
    }

    // Wire calendar sync for reschedule (Requirements 4.3, 5.3) - Task 21.1
    try {
      // Use scheduler for calendar event updates
      const calendarUserIds = [mappedInterview.scheduledBy];
      const endTime = new Date(mappedInterview.scheduledAt.getTime() + mappedInterview.duration * 60 * 1000);
      const candidateName = mappedInterview.jobCandidate?.candidate?.name || 'Candidate';
      const jobTitle = mappedInterview.jobCandidate?.job?.title || 'Position';

      await calendarService.updateCalendarEventsForInterview(
        mappedInterview.id,
        calendarUserIds,
        {
          title: `Interview: ${candidateName} - ${jobTitle}`,
          description: this.buildEventDescription(mappedInterview),
          startTime: mappedInterview.scheduledAt,
          endTime,
          timezone: mappedInterview.timezone,
          attendees: mappedInterview.panelMembers?.map(pm => ({
            email: pm.user?.email || '',
            name: pm.user?.name,
          })),
        }
      );
    } catch (error) {
      // Log error but don't fail the interview update
      console.error('Failed to update calendar events:', error);
    }

    // Wire email notifications for reschedule (Requirements 6.3, 7.3) - Task 21.2
    // Only send if the scheduled time actually changed
    if (oldScheduledAt.getTime() !== mappedInterview.scheduledAt.getTime()) {
      try {
        await emailService.sendRescheduleNotification(mappedInterview, oldScheduledAt);
      } catch (error) {
        // Log error but don't fail the interview update
        console.error('Failed to send reschedule notification emails:', error);
      }
    }

    return mappedInterview;
  },

  /**
   * Cancel an interview
   * Requirements: 8.4, 8.5
   */
  async cancelInterview(id: string, reason?: string): Promise<Interview> {
    // Verify interview exists
    const existing = await prisma.interview.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundError('Interview');
    }

    // Cannot cancel already cancelled interviews
    if (existing.status === 'cancelled') {
      throw new ValidationError({
        status: ['Interview is already cancelled'],
      });
    }

    // Update interview status to cancelled
    const result = await prisma.interview.update({
      where: { id },
      data: {
        status: 'cancelled',
        cancelReason: reason,
      },
      include: {
        jobCandidate: {
          include: {
            candidate: true,
            job: true,
          },
        },
        scheduler: true,
        panelMembers: {
          include: {
            user: true,
          },
        },
        feedback: {
          include: {
            panelMember: true,
          },
        },
      },
    });

    const mappedInterview = this.mapToInterview(result);

    // Record interview_cancelled activity (Requirements 15.3)
    try {
      await interviewActivityService.recordInterviewCancelled(mappedInterview, reason);
    } catch (error) {
      // Log error but don't fail the interview cancellation
      console.error('Failed to record interview cancelled activity:', error);
    }

    // Wire calendar sync for cancellation (Requirements 4.4, 5.4) - Task 21.1
    try {
      // Use scheduler for calendar event deletion
      const calendarUserIds = [mappedInterview.scheduledBy];
      await calendarService.deleteCalendarEventsForInterview(mappedInterview.id, calendarUserIds);
    } catch (error) {
      // Log error but don't fail the interview cancellation
      console.error('Failed to delete calendar events:', error);
    }

    // Wire email notifications for cancellation (Requirements 6.4, 7.4) - Task 21.2
    try {
      await emailService.sendCancellationNotification(mappedInterview);
    } catch (error) {
      // Log error but don't fail the interview cancellation
      console.error('Failed to send cancellation notification emails:', error);
    }

    return mappedInterview;
  },

  /**
   * Get interview by ID
   * Requirements: 17.1
   */
  async getInterview(id: string): Promise<Interview | null> {
    const interview = await prisma.interview.findUnique({
      where: { id },
      include: {
        jobCandidate: {
          include: {
            candidate: true,
            job: true,
          },
        },
        scheduler: true,
        panelMembers: {
          include: {
            user: true,
          },
        },
        feedback: {
          include: {
            panelMember: true,
          },
        },
      },
    });

    if (!interview) {
      return null;
    }

    return this.mapToInterview(interview);
  },

  /**
   * List interviews with filters
   * Requirements: 17.2
   */
  async listInterviews(filters: InterviewFilters): Promise<Interview[]> {
    // Build where clause based on filters
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const where: any = {};

    if (filters.jobCandidateId) {
      where.jobCandidateId = filters.jobCandidateId;
    }

    if (filters.status) {
      where.status = filters.status;
    }

    if (filters.mode) {
      where.mode = filters.mode;
    }

    if (filters.dateFrom || filters.dateTo) {
      where.scheduledAt = {};
      if (filters.dateFrom) {
        where.scheduledAt.gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        where.scheduledAt.lte = new Date(filters.dateTo);
      }
    }

    // Filter by job
    if (filters.jobId) {
      where.jobCandidate = {
        jobId: filters.jobId,
      };
    }

    // Filter by candidate
    if (filters.candidateId) {
      where.jobCandidate = {
        ...where.jobCandidate,
        candidateId: filters.candidateId,
      };
    }

    // Filter by company
    if (filters.companyId) {
      where.jobCandidate = {
        ...where.jobCandidate,
        job: {
          companyId: filters.companyId,
        },
      };
    }

    // Filter by panel member
    if (filters.panelMemberId) {
      where.panelMembers = {
        some: {
          userId: filters.panelMemberId,
        },
      };
    }

    const interviews = await prisma.interview.findMany({
      where,
      orderBy: { scheduledAt: 'asc' },
      include: {
        jobCandidate: {
          include: {
            candidate: true,
            job: true,
          },
        },
        scheduler: true,
        panelMembers: {
          include: {
            user: true,
          },
        },
        feedback: {
          include: {
            panelMember: true,
          },
        },
      },
    });

    return interviews.map((interview) => this.mapToInterview(interview));
  },

  /**
   * Get interviews for dashboard (today, tomorrow, this week)
   * Requirements: 11.1, 11.2, 12.1
   */
  async getDashboardInterviews(userId: string, companyId: string): Promise<DashboardInterviews> {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    const dayAfterTomorrow = new Date(tomorrow);
    dayAfterTomorrow.setDate(dayAfterTomorrow.getDate() + 1);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    // Base where clause for company
    const baseWhere = {
      jobCandidate: {
        job: {
          companyId,
        },
      },
      status: { not: 'cancelled' as InterviewStatus },
    };

    // Today's interviews
    const todayInterviews = await prisma.interview.findMany({
      where: {
        ...baseWhere,
        scheduledAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        jobCandidate: {
          include: {
            candidate: true,
            job: true,
          },
        },
        scheduler: true,
        panelMembers: {
          include: {
            user: true,
          },
        },
        feedback: {
          include: {
            panelMember: true,
          },
        },
      },
    });

    // Tomorrow's interviews
    const tomorrowInterviews = await prisma.interview.findMany({
      where: {
        ...baseWhere,
        scheduledAt: {
          gte: tomorrow,
          lt: dayAfterTomorrow,
        },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        jobCandidate: {
          include: {
            candidate: true,
            job: true,
          },
        },
        scheduler: true,
        panelMembers: {
          include: {
            user: true,
          },
        },
        feedback: {
          include: {
            panelMember: true,
          },
        },
      },
    });

    // This week's interviews (excluding today and tomorrow)
    const thisWeekInterviews = await prisma.interview.findMany({
      where: {
        ...baseWhere,
        scheduledAt: {
          gte: dayAfterTomorrow,
          lt: endOfWeek,
        },
      },
      orderBy: { scheduledAt: 'asc' },
      include: {
        jobCandidate: {
          include: {
            candidate: true,
            job: true,
          },
        },
        scheduler: true,
        panelMembers: {
          include: {
            user: true,
          },
        },
        feedback: {
          include: {
            panelMember: true,
          },
        },
      },
    });

    // Pending feedback - completed interviews where user hasn't submitted feedback
    const pendingFeedbackInterviews = await prisma.interview.findMany({
      where: {
        ...baseWhere,
        status: 'completed',
        panelMembers: {
          some: {
            userId,
          },
        },
        feedback: {
          none: {
            panelMemberId: userId,
          },
        },
      },
      orderBy: { scheduledAt: 'desc' },
      include: {
        jobCandidate: {
          include: {
            candidate: true,
            job: true,
          },
        },
        scheduler: true,
        panelMembers: {
          include: {
            user: true,
          },
        },
        feedback: {
          include: {
            panelMember: true,
          },
        },
      },
    });

    return {
      today: todayInterviews.map((i) => this.mapToInterview(i)),
      tomorrow: tomorrowInterviews.map((i) => this.mapToInterview(i)),
      thisWeek: thisWeekInterviews.map((i) => this.mapToInterview(i)),
      pendingFeedback: pendingFeedbackInterviews.map((i) => this.mapToInterview(i)),
    };
  },

  /**
   * Get panel load distribution
   * Requirements: 13.1, 13.2
   */
  async getPanelLoadDistribution(companyId: string, period: 'week' | 'month'): Promise<PanelLoad[]> {
    const now = new Date();
    const startDate = new Date(now);

    if (period === 'week') {
      startDate.setDate(startDate.getDate() - 7);
    } else {
      startDate.setMonth(startDate.getMonth() - 1);
    }

    // Get all interviews in the period for the company
    const interviews = await prisma.interview.findMany({
      where: {
        scheduledAt: {
          gte: startDate,
          lte: now,
        },
        status: { not: 'cancelled' },
        jobCandidate: {
          job: {
            companyId,
          },
        },
      },
      include: {
        panelMembers: {
          include: {
            user: true,
          },
        },
      },
    });

    // Count interviews per panel member
    const panelLoadMap = new Map<string, { user: { id: string; name: string; email: string }; count: number }>();

    for (const interview of interviews) {
      for (const panel of interview.panelMembers) {
        const existing = panelLoadMap.get(panel.userId);
        if (existing) {
          existing.count++;
        } else {
          panelLoadMap.set(panel.userId, {
            user: {
              id: panel.user.id,
              name: panel.user.name,
              email: panel.user.email,
            },
            count: 1,
          });
        }
      }
    }

    // Calculate average
    const totalPanelMembers = panelLoadMap.size;
    const totalInterviews = Array.from(panelLoadMap.values()).reduce((sum, p) => sum + p.count, 0);
    const averageLoad = totalPanelMembers > 0 ? totalInterviews / totalPanelMembers : 0;

    // Convert to array
    const panelLoads: PanelLoad[] = Array.from(panelLoadMap.values()).map((p) => ({
      userId: p.user.id,
      userName: p.user.name,
      userEmail: p.user.email,
      interviewCount: p.count,
      averageLoad,
    }));

    // Sort by interview count descending
    panelLoads.sort((a, b) => b.interviewCount - a.interviewCount);

    return panelLoads;
  },

  /**
   * Map Prisma interview to Interview type
   */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  mapToInterview(interview: any): Interview {
    return {
      id: interview.id,
      jobCandidateId: interview.jobCandidateId,
      scheduledAt: interview.scheduledAt,
      duration: interview.duration,
      timezone: interview.timezone,
      mode: interview.mode as InterviewMode,
      meetingLink: interview.meetingLink ?? undefined,
      location: interview.location ?? undefined,
      status: interview.status as InterviewStatus,
      notes: interview.notes ?? undefined,
      cancelReason: interview.cancelReason ?? undefined,
      scheduledBy: interview.scheduledBy,
      createdAt: interview.createdAt,
      updatedAt: interview.updatedAt,
      jobCandidate: interview.jobCandidate
        ? {
          id: interview.jobCandidate.id,
          jobId: interview.jobCandidate.jobId,
          candidateId: interview.jobCandidate.candidateId,
          currentStageId: interview.jobCandidate.currentStageId,
          appliedAt: interview.jobCandidate.appliedAt,
          updatedAt: interview.jobCandidate.updatedAt,
          candidate: interview.jobCandidate.candidate
            ? {
              id: interview.jobCandidate.candidate.id,
              companyId: interview.jobCandidate.candidate.companyId,
              name: interview.jobCandidate.candidate.name,
              email: interview.jobCandidate.candidate.email,
              phone: interview.jobCandidate.candidate.phone ?? undefined,
              experienceYears: interview.jobCandidate.candidate.experienceYears,
              currentCompany: interview.jobCandidate.candidate.currentCompany ?? undefined,
              location: interview.jobCandidate.candidate.location,
              currentCtc: interview.jobCandidate.candidate.currentCtc ?? undefined,
              expectedCtc: interview.jobCandidate.candidate.expectedCtc ?? undefined,
              noticePeriod: interview.jobCandidate.candidate.noticePeriod ?? undefined,
              source: interview.jobCandidate.candidate.source,
              availability: interview.jobCandidate.candidate.availability ?? undefined,
              skills: Array.isArray(interview.jobCandidate.candidate.skills)
                ? interview.jobCandidate.candidate.skills
                : [],
              resumeUrl: interview.jobCandidate.candidate.resumeUrl ?? undefined,
              score: interview.jobCandidate.candidate.score ?? undefined,
              createdAt: interview.jobCandidate.candidate.createdAt,
              updatedAt: interview.jobCandidate.candidate.updatedAt,
            }
            : undefined,
          job: interview.jobCandidate.job
            ? {
              id: interview.jobCandidate.job.id,
              companyId: interview.jobCandidate.job.companyId,
              title: interview.jobCandidate.job.title,
              department: interview.jobCandidate.job.department,
              description: interview.jobCandidate.job.description ?? '',
              status: interview.jobCandidate.job.status,
              openings: interview.jobCandidate.job.openings,
              skills: Array.isArray(interview.jobCandidate.job.skills)
                ? interview.jobCandidate.job.skills
                : [],
              locations: Array.isArray(interview.jobCandidate.job.locations)
                ? interview.jobCandidate.job.locations
                : [],
              createdAt: interview.jobCandidate.job.createdAt,
              updatedAt: interview.jobCandidate.job.updatedAt,
            }
            : undefined,
        }
        : undefined,
      scheduler: interview.scheduler
        ? {
          id: interview.scheduler.id,
          companyId: interview.scheduler.companyId,
          name: interview.scheduler.name,
          email: interview.scheduler.email,
          role: interview.scheduler.role,
          isActive: interview.scheduler.isActive,
          createdAt: interview.scheduler.createdAt,
          updatedAt: interview.scheduler.updatedAt,
        }
        : undefined,
      panelMembers: interview.panelMembers?.map((pm: { id: string; interviewId: string; userId: string; createdAt: Date; user?: { id: string; companyId: string; name: string; email: string; role: string; isActive: boolean; createdAt: Date; updatedAt: Date } }) => ({
        id: pm.id,
        interviewId: pm.interviewId,
        userId: pm.userId,
        createdAt: pm.createdAt,
        user: pm.user
          ? {
            id: pm.user.id,
            companyId: pm.user.companyId,
            name: pm.user.name,
            email: pm.user.email,
            role: pm.user.role,
            isActive: pm.user.isActive,
            createdAt: pm.user.createdAt,
            updatedAt: pm.user.updatedAt,
          }
          : undefined,
      })),
      feedback: interview.feedback?.map((fb: { id: string; interviewId: string; panelMemberId: string; ratings: unknown; overallComments: string; recommendation: string; submittedAt: Date; panelMember?: { id: string; companyId: string; name: string; email: string; role: string; isActive: boolean; createdAt: Date; updatedAt: Date } }) => ({
        id: fb.id,
        interviewId: fb.interviewId,
        panelMemberId: fb.panelMemberId,
        ratings: fb.ratings,
        overallComments: fb.overallComments,
        recommendation: fb.recommendation,
        submittedAt: fb.submittedAt,
        panelMember: fb.panelMember
          ? {
            id: fb.panelMember.id,
            companyId: fb.panelMember.companyId,
            name: fb.panelMember.name,
            email: fb.panelMember.email,
            role: fb.panelMember.role,
            isActive: fb.panelMember.isActive,
            createdAt: fb.panelMember.createdAt,
            updatedAt: fb.panelMember.updatedAt,
          }
          : undefined,
      })),
    };
  },
};

export default interviewService;
