import { PrismaClient, UserRole, JobStatus, ActivityType, NotificationType, InterviewMode, InterviewStatus, InterviewRecommendation, TaskType, TaskSeverity, TaskStatus } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';
import { faker } from '@faker-js/faker';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// --- CONFIGURATION ---
const CANDIDATE_COUNT = 120; // 100+ candidates
const JOB_COUNT = 45;      // 40+ job roles
const DEFAULT_STAGES = [
    'Queue', 'Applied', 'Screening', 'Shortlisted', 'Interview', 'Selected', 'Offer', 'Hired', 'Rejected'
];
// For interview dates: Jan, Feb, March 2026
const INTERVIEW_START_DATE = new Date('2026-01-01');
const INTERVIEW_END_DATE = new Date('2026-03-31');

const LOCATIONS = ['Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Gurgaon', 'Mumbai', 'Noida', 'Remote', 'Delhi', 'Kolkata'];
const DEPARTMENTS = ['Engineering', 'Product', 'Sales', 'Marketing', 'Design', 'HR', 'Finance', 'Customer Support', 'Data Science'];
const SKILLS_POOL = [
    'React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'NoSQL', 'TypeScript',
    'Go', 'C++', 'Figma', 'Product Management', 'Salesforce', 'Marketing Strategy', 'SEO', 'Data Analysis',
    'Machine Learning', 'Deep Learning', 'NLP', 'Recruiting', 'HR Policies', 'Financial Analysis'
];

async function main() {
    console.log('🌱 Starting LARGE seed...');

    // 1. Clean existing data
    // Delete in order to respect foreign keys
    await prisma.interviewFeedback.deleteMany();
    await prisma.interviewPanel.deleteMany();
    await prisma.calendarEvent.deleteMany();
    await prisma.interview.deleteMany();
    await prisma.task.deleteMany();
    await prisma.notification.deleteMany();
    await prisma.sLAConfig.deleteMany();
    await prisma.stageHistory.deleteMany();
    await prisma.candidateNote.deleteMany();
    await prisma.candidateAttachment.deleteMany();
    await prisma.candidateActivity.deleteMany();
    await prisma.jobCandidate.deleteMany();
    await prisma.pipelineStage.deleteMany();
    await prisma.pipelineStageTemplate.deleteMany();
    await prisma.candidate.deleteMany();
    await prisma.job.deleteMany();
    await prisma.oAuthToken.deleteMany();
    await prisma.user.deleteMany();
    await prisma.company.deleteMany();

    console.log('🧹 Cleaned existing data');

    // 2. Create Company
    const company = await prisma.company.create({
        data: {
            name: 'Techcrop Solutions', // Changed from Acme to Techcrop as per user prompt "Techcrop.com"
            contactEmail: 'contact@techcrop.com',
            address: 'Bangalore, India',
            logoUrl: '/logo.png',
            website: 'https://techcrop.com',
            industry: 'Technology',
            companySize: '1000-5000',
            description: 'Leading provider of enterprise technology solutions.',
        },
    });
    console.log('🏢 Created company:', company.name);

    // 3. Create Users
    const passwordHash = await bcrypt.hash('password123', 10);
    const users = await Promise.all([
        prisma.user.create({
            data: {
                companyId: company.id,
                name: 'Tushar',
                email: 'tushar@techcrop.com',
                passwordHash,
                role: UserRole.admin,
                isActive: true,
            },
        }),
        prisma.user.create({
            data: {
                companyId: company.id,
                name: 'Aarti',
                email: 'aarti@techcrop.com',
                passwordHash,
                role: UserRole.recruiter,
                isActive: true,
            },
        }),
        prisma.user.create({
            data: {
                companyId: company.id,
                name: 'Rahul',
                email: 'rahul@techcrop.com',
                passwordHash,
                role: UserRole.recruiter,
                isActive: true,
            },
        }),
        prisma.user.create({
            data: {
                companyId: company.id,
                name: 'Vikram',
                email: 'vikram@techcrop.com',
                passwordHash,
                role: UserRole.hiring_manager,
                isActive: true,
            },
        }),
        prisma.user.create({
            data: {
                companyId: company.id,
                name: 'Sana',
                email: 'sana@techcrop.com',
                passwordHash,
                role: UserRole.recruiter,
                isActive: true,
            },
        }),
    ]);
    console.log('👥 Created', users.length, 'users');

    // 4. Create Jobs
    const jobs = [];
    const recruiters = users.filter(u => u.role === UserRole.recruiter);

    for (let i = 0; i < JOB_COUNT; i++) {
        const department = faker.helpers.arrayElement(DEPARTMENTS);
        const title = faker.person.jobTitle();
        const isEngineering = department === 'Engineering';
        const salaryMin = faker.number.int({ min: 10, max: 30 });
        const salaryMax = salaryMin + faker.number.int({ min: 5, max: 20 });
        const jobStatus = faker.helpers.weightedArrayElement([
            { weight: 0.7, value: JobStatus.active },
            { weight: 0.2, value: JobStatus.closed },
            { weight: 0.1, value: JobStatus.paused },
        ]);

        const job = await prisma.job.create({
            data: {
                companyId: company.id,
                title: title,
                department: department,
                location: faker.helpers.arrayElement(LOCATIONS),
                employmentType: 'Full-time',
                salaryRange: `${salaryMin}-${salaryMax} LPA`,
                description: faker.lorem.paragraphs(2),
                status: jobStatus,
                openings: faker.number.int({ min: 1, max: 5 }),
                assignedRecruiterId: faker.helpers.arrayElement(recruiters).id,
                experienceMin: isEngineering ? faker.number.int({ min: 2, max: 5 }) : faker.number.int({ min: 1, max: 3 }),
                experienceMax: isEngineering ? faker.number.int({ min: 6, max: 12 }) : faker.number.int({ min: 4, max: 8 }),
                skills: isEngineering
                    ? faker.helpers.arrayElements(SKILLS_POOL, { min: 3, max: 8 })
                    : faker.helpers.arrayElements(['Communication', 'Management', 'Excel', 'Problem Solving'], { min: 2, max: 4 }),
                jobDomain: department,
                createdAt: faker.date.past({ years: 1 }),
            },
        });

        // Create pipeline stages for each job
        const stages = await Promise.all(
            DEFAULT_STAGES.map((name, index) =>
                prisma.pipelineStage.create({
                    data: {
                        jobId: job.id,
                        name,
                        position: index,
                        isDefault: true,
                    },
                })
            )
        );

        jobs.push({ id: job.id, title: job.title, stages });
    }
    console.log('💼 Created', jobs.length, 'jobs');

    // 5. Create Candidates
    const candidates = [];

    for (let i = 0; i < CANDIDATE_COUNT; i++) {
        const firstName = faker.person.firstName();
        const lastName = faker.person.lastName();
        const department = faker.helpers.arrayElement(DEPARTMENTS);
        const experienceYears = faker.number.float({ min: 1, max: 15, multipleOf: 0.5 });

        // Create rich skills array
        const skills = faker.helpers.arrayElements(SKILLS_POOL, { min: 4, max: 10 });

        const candidate = await prisma.candidate.create({
            data: {
                companyId: company.id,
                name: `${firstName} ${lastName}`,
                email: faker.internet.email({ firstName, lastName }).toLowerCase(),
                phone: faker.phone.number(),
                experienceYears,
                currentCompany: faker.company.name(),
                location: faker.helpers.arrayElement(LOCATIONS),
                currentCtc: `${faker.number.int({ min: 10, max: 40 })} LPA`,
                expectedCtc: `${faker.number.int({ min: 15, max: 50 })} LPA`,
                noticePeriod: faker.helpers.arrayElement(['15 days', '30 days', '60 days', '90 days', 'Immediate']),
                source: faker.helpers.arrayElement(['LinkedIn', 'Naukri', 'Referral', 'Career Page', 'Agency', 'Direct']),
                availability: faker.helpers.arrayElement(['Immediate', '15 days', '30 days']),
                skills: skills,
                score: faker.number.int({ min: 40, max: 98 }),

                // Enhanced fields
                age: faker.number.int({ min: 22, max: 45 }),
                industry: company.industry,
                jobDomain: department,
                candidateSummary: faker.lorem.paragraph(),
                tags: faker.helpers.arrayElements(['High Priority', 'Diversity', 'Immediate Joiner', 'Budget Fit', 'Relocation Required', 'Remote'], { min: 0, max: 2 }),
                title: faker.person.jobTitle(),
                department: department,
                internalMobility: faker.datatype.boolean({ probability: 0.05 }), // 5% chance

                createdAt: faker.date.past({ years: 1 }),
            },
        });
        candidates.push(candidate);
    }
    console.log('👤 Created', candidates.length, 'candidates');

    // 6. Applications (JobCandidate) & History & Interviews
    console.log('🔗 generating applications & interviews...');

    let totalApplications = 0;
    let totalInterviews = 0;

    // We want a funnel shape:
    // Applied (Many) -> Screening (Some) -> Interview (Fewer) -> Offer (Few) -> Hired (Very Few)

    for (const candidate of candidates) {
        // Each candidate applies to 1-3 jobs
        const numApps = faker.number.int({ min: 1, max: 3 });
        const appliedJobs = faker.helpers.arrayElements(jobs, numApps);

        for (const job of appliedJobs) {
            totalApplications++;

            // Determine how far they got based on probability (Funnel)
            const funnelStageIndex = faker.helpers.weightedArrayElement([
                { weight: 0.30, value: 1 }, // Applied (Stayed at Applied)
                { weight: 0.25, value: 2 }, // Screening
                { weight: 0.25, value: 4 }, // Interview !! IMPORTANT for user request
                { weight: 0.10, value: 6 }, // Offer
                { weight: 0.05, value: 7 }, // Hired
                { weight: 0.05, value: 8 }, // Rejected
            ]);

            const targetStageName = DEFAULT_STAGES[funnelStageIndex];
            const targetStage = job.stages.find(s => s.name === targetStageName);

            if (!targetStage) continue;

            const jobCandidate = await prisma.jobCandidate.create({
                data: {
                    jobId: job.id,
                    candidateId: candidate.id,
                    currentStageId: targetStage.id,
                    appliedAt: faker.date.past({ years: 1 }),
                },
            });

            // Add Activity Logs for stage progression
            // Simply add a "Stage Change" activity for the final stage to keep seed fast
            await prisma.candidateActivity.create({
                data: {
                    candidateId: candidate.id,
                    jobCandidateId: jobCandidate.id,
                    activityType: ActivityType.stage_change,
                    description: `Moved to ${targetStageName}`,
                    metadata: { toStage: targetStageName },
                    createdAt: new Date(),
                },
            });

            // 7. GENERATE INTERVIEWS if they reached Interview stage or beyond
            // Target dates: Jan, Feb, March 2026
            if (funnelStageIndex >= 4) { // 4 is 'Interview' index in DEFAULT_STAGES
                // Create 1-3 interviews per candidate in this bucket
                const interviewCount = faker.number.int({ min: 1, max: 3 });

                for (let k = 0; k < interviewCount; k++) {
                    totalInterviews++;

                    // Random date between Jan 1 2026 and Mar 31 2026
                    const interviewDate = faker.date.between({ from: INTERVIEW_START_DATE, to: INTERVIEW_END_DATE });

                    // Determine status
                    // If date is in past relative to "now" (simulated), it might be completed.
                    // Since we are simulating 2026 Jan-Mar, let's just make them mixed.
                    // Wait, user says "Jan, Feb, March of 2026". 
                    // Current real time is 2026-01-03. So Jan 1-2 are past, rest is future.
                    // But for a dashboard to look "lived in", we often have completed interviews.
                    // Let's assume some are completed even if in future relative to "now"? 
                    // No, better to stick to logic:
                    // - If date < 2026-01-03: Completed or No Show
                    // - If date >= 2026-01-03: Scheduled

                    let status: InterviewStatus = InterviewStatus.scheduled;
                    if (interviewDate < new Date('2026-01-03T18:00:00')) {
                        status = faker.helpers.weightedArrayElement([
                            { weight: 0.8, value: InterviewStatus.completed },
                            { weight: 0.1, value: InterviewStatus.cancelled },
                            { weight: 0.1, value: InterviewStatus.no_show },
                        ]);
                    } else {
                        // Future interviews
                        status = InterviewStatus.scheduled;
                    }

                    const interview = await prisma.interview.create({
                        data: {
                            jobCandidateId: jobCandidate.id,
                            scheduledAt: interviewDate,
                            duration: faker.helpers.arrayElement([30, 45, 60]),
                            timezone: 'Asia/Kolkata',
                            mode: faker.helpers.arrayElement(Object.values(InterviewMode)),
                            status: status,
                            meetingLink: 'https://meet.google.com/abc-defg-hij',
                            scheduledBy: faker.helpers.arrayElement(recruiters).id,
                            roundType: faker.helpers.arrayElement(['Technical Round 1', 'Technical Round 2', 'Managerial', 'HR Round', 'System Design']),
                            createdAt: faker.date.recent({ days: 30 }),
                        },
                    });

                    // Add panel members
                    const panelMembers = faker.helpers.arrayElements(users, { min: 1, max: 2 });
                    for (const member of panelMembers) {
                        await prisma.interviewPanel.create({
                            data: {
                                interviewId: interview.id,
                                userId: member.id
                            }
                        });

                        // If completed, add feedback
                        if (status === InterviewStatus.completed) {
                            await prisma.interviewFeedback.create({
                                data: {
                                    interviewId: interview.id,
                                    panelMemberId: member.id,
                                    recommendation: faker.helpers.arrayElement(Object.values(InterviewRecommendation)),
                                    overallComments: faker.lorem.paragraph(),
                                    ratings: [
                                        { criterion: 'Technical Skills', score: faker.number.int({ min: 1, max: 5 }) },
                                        { criterion: 'Communication', score: faker.number.int({ min: 1, max: 5 }) },
                                        { criterion: 'Cultural Fit', score: faker.number.int({ min: 1, max: 5 }) }
                                    ],
                                }
                            });
                        }
                    }
                }
            }
        }
    }
    console.log(`🔗 Created ${totalApplications} applications and ${totalInterviews} interviews`);

    // 8. Create Tasks
    const tasks = [];
    for (let i = 0; i < 50; i++) {
        const task = await prisma.task.create({
            data: {
                companyId: company.id,
                userId: faker.helpers.arrayElement(users).id,
                type: faker.helpers.arrayElement(Object.values(TaskType)),
                text: faker.lorem.sentence(),
                severity: faker.helpers.arrayElement(Object.values(TaskSeverity)),
                status: faker.helpers.arrayElement(Object.values(TaskStatus)),
                createdAt: faker.date.recent({ days: 60 }),
            },
        });
        tasks.push(task);
    }
    console.log(`✅ Created ${tasks.length} tasks`);

    // 9. Analytics Helpers - specific data points to ensure charts look good
    // Ensure we have some REJECTED candidates with reasons if possible (though schema doesn't seem to store rejection reason on JobCandidate easily besides activity?)
    // The schema has `cancelReason` on Interview, but not explicit rejection reason on JobCandidate unless in `StageHistory` (which we skipped for speed/complexity).
    // But moving people to 'Rejected' stage is enough for the funnel chart.

    console.log('🎉 Seed completed successfully!');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
