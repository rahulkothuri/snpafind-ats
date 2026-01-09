import { PrismaClient, UserRole, JobStatus, ActivityType, InterviewMode, InterviewStatus, InterviewRecommendation } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

// Parse connection string and configure SSL
const pool = new pg.Pool({ 
  connectionString,
  ssl: process.env.DATABASE_URL?.includes('rds.amazonaws.com') ? { rejectUnauthorized: false } : false
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Default pipeline stages with sub-stages
const DEFAULT_STAGES = [
  { name: 'Queue', subStages: [] },
  { name: 'Applied', subStages: [] },
  { name: 'Screening', subStages: ['HR Screening'] },
  { name: 'Shortlisted', subStages: ['CV Shortlist', 'Panel Shortlist'] },
  { name: 'Interview', subStages: ['Round 1', 'Round 2'] },
  { name: 'Selected', subStages: [] },
  { name: 'Offered', subStages: ['Offer Sent', 'Offer Accepted'] },
  { name: 'Hired', subStages: [] },
  { name: 'Rejected', subStages: [] },
];

// Interview dates: Jan, Feb, March 2026
const INTERVIEW_START_DATE = new Date('2026-01-01');
const INTERVIEW_END_DATE = new Date('2026-03-31');

const LOCATIONS = ['Bangalore', 'Hyderabad', 'Pune', 'Chennai', 'Gurgaon', 'Mumbai', 'Noida', 'Remote', 'Delhi', 'Kolkata'];
const DEPARTMENTS = ['Engineering', 'Product', 'Sales', 'Marketing', 'Design', 'HR', 'Finance', 'Customer Support', 'Data Science', 'Operations'];
const SKILLS_POOL = [
  'React', 'Node.js', 'Python', 'Java', 'AWS', 'Docker', 'Kubernetes', 'SQL', 'NoSQL', 'TypeScript',
  'Go', 'C++', 'Figma', 'Product Management', 'Salesforce', 'Marketing Strategy', 'SEO', 'Data Analysis',
  'Machine Learning', 'Deep Learning', 'NLP', 'Recruiting', 'HR Policies', 'Financial Analysis', 'Spring Boot',
  'GraphQL', 'Redis', 'MongoDB', 'PostgreSQL', 'Microservices', 'System Design', 'Agile', 'Scrum'
];

const JOB_TITLES = [
  'Senior Software Engineer', 'Backend Engineer', 'Frontend Developer', 'Full Stack Developer',
  'DevOps Engineer', 'Data Scientist', 'Machine Learning Engineer', 'Product Manager',
  'UX Designer', 'UI Designer', 'QA Engineer', 'Technical Lead', 'Engineering Manager',
  'Sales Executive', 'Account Manager', 'Marketing Manager', 'Content Writer',
  'HR Manager', 'Recruiter', 'Finance Analyst', 'Operations Manager', 'Customer Success Manager',
  'Cloud Architect', 'Security Engineer', 'Mobile Developer', 'iOS Developer', 'Android Developer',
  'Data Engineer', 'Business Analyst', 'Scrum Master', 'Technical Writer', 'Solutions Architect',
  'Platform Engineer', 'Site Reliability Engineer', 'Database Administrator', 'Network Engineer',
  'AI/ML Engineer', 'Research Scientist', 'Growth Manager', 'Brand Manager', 'PR Manager'
];

const FIRST_NAMES = [
  'Aarav', 'Vivaan', 'Aditya', 'Vihaan', 'Arjun', 'Sai', 'Reyansh', 'Ayaan', 'Krishna', 'Ishaan',
  'Ananya', 'Diya', 'Saanvi', 'Aanya', 'Aadhya', 'Isha', 'Kavya', 'Riya', 'Priya', 'Neha',
  'Rahul', 'Amit', 'Vikram', 'Suresh', 'Rajesh', 'Deepak', 'Karan', 'Rohan', 'Nikhil', 'Akash',
  'Pooja', 'Sneha', 'Divya', 'Meera', 'Lakshmi', 'Kavitha', 'Swati', 'Anjali', 'Shruti', 'Nisha',
  'Aryan', 'Dev', 'Harsh', 'Yash', 'Pranav', 'Siddharth', 'Varun', 'Gaurav', 'Manish', 'Sachin'
];

const LAST_NAMES = [
  'Sharma', 'Patel', 'Kumar', 'Singh', 'Reddy', 'Nair', 'Iyer', 'Rao', 'Gupta', 'Verma',
  'Joshi', 'Menon', 'Pillai', 'Krishnan', 'Sundaram', 'Prasad', 'Chauhan', 'Mehta', 'Shah', 'Desai',
  'Agarwal', 'Bansal', 'Kapoor', 'Malhotra', 'Khanna', 'Bhatia', 'Chopra', 'Saxena', 'Mishra', 'Pandey'
];

const COMPANIES = [
  'TCS', 'Infosys', 'Wipro', 'HCL', 'Tech Mahindra', 'Cognizant', 'Accenture', 'IBM', 'Microsoft',
  'Google', 'Amazon', 'Flipkart', 'Swiggy', 'Zomato', 'Paytm', 'PhonePe', 'Razorpay', 'Freshworks',
  'Zoho', 'Ola', 'Uber', 'Byju\'s', 'Unacademy', 'Meesho', 'CRED', 'Groww', 'Zerodha', 'Myntra',
  'Nykaa', 'PolicyBazaar', 'MakeMyTrip', 'Oyo', 'Dream11', 'Jio', 'Airtel', 'Vodafone', 'Samsung'
];

function randomElement<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number, decimals: number = 1): number {
  return parseFloat((Math.random() * (max - min) + min).toFixed(decimals));
}

function randomDate(start: Date, end: Date): Date {
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

function generatePhone(): string {
  return `+91-${randomInt(70000, 99999)}-${randomInt(10000, 99999)}`;
}

async function main() {
  console.log('🌱 Starting SnapFind demo seed...');
  console.log('📌 NOTE: This script ADDS data without deleting existing data');

  // Create company
  const company = await prisma.company.create({
    data: {
      name: 'SnapFind',
      contactEmail: 'hr@snapfind.com',
      address: 'Bangalore, India',
      logoUrl: '/logo.png',
      website: 'https://snapfind.com',
      industry: 'Technology',
      companySize: '500-1000',
      description: 'SnapFind is a leading AI-powered recruitment platform helping companies find the best talent faster.',
    },
  });
  console.log('🏢 Created company:', company.name);

  // Create 5 users with Tushar as admin
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Tushar',
        email: 'tushar@snapfind.com',
        passwordHash,
        role: UserRole.admin,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Priya',
        email: 'priya@snapfind.com',
        passwordHash,
        role: UserRole.recruiter,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Rahul',
        email: 'rahul@snapfind.com',
        passwordHash,
        role: UserRole.recruiter,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Anita',
        email: 'anita@snapfind.com',
        passwordHash,
        role: UserRole.hiring_manager,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Vikram',
        email: 'vikram@snapfind.com',
        passwordHash,
        role: UserRole.recruiter,
        isActive: true,
      },
    }),
  ]);
  console.log('👥 Created', users.length, 'users');

  const recruiters = users.filter(u => u.role === UserRole.recruiter);


  // Create ~40 jobs
  const jobs: Array<{ id: string; title: string; stages: Array<{ id: string; name: string; parentId: string | null }> }> = [];

  for (let i = 0; i < 40; i++) {
    const department = randomElement(DEPARTMENTS);
    const title = JOB_TITLES[i % JOB_TITLES.length];
    const salaryMin = randomInt(10, 30);
    const salaryMax = salaryMin + randomInt(5, 20);
    const jobStatus = Math.random() < 0.8 ? JobStatus.active : (Math.random() < 0.5 ? JobStatus.paused : JobStatus.closed);

    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        title: `${title}${i > JOB_TITLES.length ? ` - ${randomElement(['L1', 'L2', 'L3', 'Senior', 'Lead'])}` : ''}`,
        department,
        location: randomElement(LOCATIONS),
        employmentType: 'Full-time',
        salaryRange: `${salaryMin}-${salaryMax} LPA`,
        description: `We are looking for a talented ${title} to join our ${department} team. This is an exciting opportunity to work on cutting-edge projects.`,
        status: jobStatus,
        openings: randomInt(1, 5),
        assignedRecruiterId: randomElement(recruiters).id,
        experienceMin: randomInt(1, 5),
        experienceMax: randomInt(6, 12),
        skills: randomElement(SKILLS_POOL.slice(0, 15).concat(SKILLS_POOL.slice(0, 10))).split(',').slice(0, randomInt(3, 8)),
        jobDomain: department,
        createdAt: randomDate(new Date('2025-06-01'), new Date('2025-12-31')),
      },
    });

    // Create pipeline stages with sub-stages
    const stages: Array<{ id: string; name: string; parentId: string | null }> = [];
    let position = 0;

    for (const stageConfig of DEFAULT_STAGES) {
      const stage = await prisma.pipelineStage.create({
        data: {
          jobId: job.id,
          name: stageConfig.name,
          position: position++,
          isDefault: true,
        },
      });
      stages.push({ id: stage.id, name: stage.name, parentId: null });

      // Create sub-stages
      for (const subStageName of stageConfig.subStages) {
        const subStage = await prisma.pipelineStage.create({
          data: {
            jobId: job.id,
            name: subStageName,
            position: position++,
            isDefault: false,
            parentId: stage.id,
          },
        });
        stages.push({ id: subStage.id, name: subStage.name, parentId: stage.id });
      }
    }

    jobs.push({ id: job.id, title: job.title, stages });
  }
  console.log('💼 Created', jobs.length, 'jobs with pipeline stages');

  // Create ~200 candidates
  const candidates: Array<{ id: string; name: string; email: string }> = [];
  const usedEmails = new Set<string>();

  for (let i = 0; i < 200; i++) {
    const firstName = randomElement(FIRST_NAMES);
    const lastName = randomElement(LAST_NAMES);
    let email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 999)}@${randomElement(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'])}`;
    
    // Ensure unique email
    while (usedEmails.has(email)) {
      email = `${firstName.toLowerCase()}.${lastName.toLowerCase()}${randomInt(1, 9999)}@${randomElement(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com'])}`;
    }
    usedEmails.add(email);

    const experienceYears = randomFloat(1, 15);
    const currentCtcBase = randomInt(8, 50);
    const expectedCtcBase = currentCtcBase + randomInt(3, 15);

    const candidate = await prisma.candidate.create({
      data: {
        companyId: company.id,
        name: `${firstName} ${lastName}`,
        email,
        phone: generatePhone(),
        experienceYears,
        currentCompany: randomElement(COMPANIES),
        location: randomElement(LOCATIONS),
        currentCtc: `${currentCtcBase} LPA`,
        expectedCtc: `${expectedCtcBase} LPA`,
        noticePeriod: randomElement(['Immediate', '15 days', '30 days', '60 days', '90 days']),
        source: randomElement(['LinkedIn', 'Naukri', 'Referral', 'Career Page', 'Agency', 'Direct', 'Indeed', 'AngelList']),
        availability: randomElement(['Immediate', '15 days', '30 days', '45 days']),
        skills: Array.from({ length: randomInt(4, 10) }, () => randomElement(SKILLS_POOL)),
        score: randomInt(40, 98),
        age: randomInt(22, 45),
        industry: randomElement(['Technology', 'Finance', 'Healthcare', 'E-commerce', 'Education', 'Manufacturing']),
        jobDomain: randomElement(DEPARTMENTS),
        candidateSummary: `Experienced professional with ${experienceYears.toFixed(1)} years in the industry. Strong background in ${randomElement(SKILLS_POOL)} and ${randomElement(SKILLS_POOL)}. Looking for challenging opportunities to grow.`,
        tags: Array.from({ length: randomInt(0, 3) }, () => randomElement(['High Priority', 'Diversity', 'Immediate Joiner', 'Budget Fit', 'Relocation Required', 'Remote'])),
        title: randomElement(JOB_TITLES),
        department: randomElement(DEPARTMENTS),
        internalMobility: Math.random() < 0.05,
        createdAt: randomDate(new Date('2025-06-01'), new Date('2025-12-31')),
      },
    });
    candidates.push({ id: candidate.id, name: candidate.name, email: candidate.email });
  }
  console.log('👤 Created', candidates.length, 'candidates');


  // Create job-candidate associations (applications)
  console.log('🔗 Creating job-candidate associations...');
  
  const jobCandidates: Array<{ id: string; jobId: string; candidateId: string; stageId: string }> = [];
  const usedPairs = new Set<string>();

  // Each candidate applies to 1-3 jobs
  for (const candidate of candidates) {
    const numApps = randomInt(1, 3);
    const appliedJobs = Array.from({ length: numApps }, () => randomElement(jobs));

    for (const job of appliedJobs) {
      const pairKey = `${job.id}-${candidate.id}`;
      if (usedPairs.has(pairKey)) continue;
      usedPairs.add(pairKey);

      // Funnel distribution: more candidates in early stages
      const stageWeights = [
        { stage: 'Applied', weight: 0.25 },
        { stage: 'Screening', weight: 0.20 },
        { stage: 'Shortlisted', weight: 0.20 },
        { stage: 'Interview', weight: 0.15 },
        { stage: 'Selected', weight: 0.08 },
        { stage: 'Offered', weight: 0.05 },
        { stage: 'Hired', weight: 0.03 },
        { stage: 'Rejected', weight: 0.04 },
      ];

      const rand = Math.random();
      let cumWeight = 0;
      let targetStageName = 'Applied';
      for (const sw of stageWeights) {
        cumWeight += sw.weight;
        if (rand < cumWeight) {
          targetStageName = sw.stage;
          break;
        }
      }

      const targetStage = job.stages.find(s => s.name === targetStageName && s.parentId === null);
      if (!targetStage) continue;

      try {
        const jobCandidate = await prisma.jobCandidate.create({
          data: {
            jobId: job.id,
            candidateId: candidate.id,
            currentStageId: targetStage.id,
            appliedAt: randomDate(new Date('2025-08-01'), new Date('2026-01-05')),
          },
        });

        jobCandidates.push({
          id: jobCandidate.id,
          jobId: job.id,
          candidateId: candidate.id,
          stageId: targetStage.id,
        });

        // Add activity log
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
      } catch (e) {
        // Skip duplicate entries
      }
    }
  }
  console.log('🔗 Created', jobCandidates.length, 'job-candidate associations');

  // Create ~40 interviews for candidates in Interview stage or beyond
  console.log('📅 Creating interviews...');
  
  const interviewStages = ['Interview', 'Selected', 'Offered', 'Hired'];
  const interviewCandidates = jobCandidates.filter(jc => {
    const job = jobs.find(j => j.id === jc.jobId);
    const stage = job?.stages.find(s => s.id === jc.stageId);
    return stage && interviewStages.includes(stage.name);
  });

  let interviewCount = 0;
  const targetInterviews = 40;

  for (const jc of interviewCandidates) {
    if (interviewCount >= targetInterviews) break;

    const numInterviews = randomInt(1, 3);
    for (let k = 0; k < numInterviews && interviewCount < targetInterviews; k++) {
      interviewCount++;

      const interviewDate = randomDate(INTERVIEW_START_DATE, INTERVIEW_END_DATE);
      const now = new Date('2026-01-09');
      
      let status: InterviewStatus;
      if (interviewDate < now) {
        status = Math.random() < 0.8 ? InterviewStatus.completed : 
                 (Math.random() < 0.5 ? InterviewStatus.cancelled : InterviewStatus.no_show);
      } else {
        status = InterviewStatus.scheduled;
      }

      const interview = await prisma.interview.create({
        data: {
          jobCandidateId: jc.id,
          scheduledAt: interviewDate,
          duration: randomElement([30, 45, 60]),
          timezone: 'Asia/Kolkata',
          mode: randomElement([InterviewMode.google_meet, InterviewMode.microsoft_teams, InterviewMode.in_person]),
          status,
          meetingLink: `https://meet.google.com/${randomInt(100, 999)}-${randomInt(1000, 9999)}-${randomInt(100, 999)}`,
          scheduledBy: randomElement(recruiters).id,
          roundType: randomElement(['Technical Round 1', 'Technical Round 2', 'Managerial', 'HR Round', 'System Design', 'Culture Fit']),
          createdAt: randomDate(new Date('2025-12-01'), new Date('2026-01-05')),
        },
      });

      // Add panel members
      const panelMembers = Array.from({ length: randomInt(1, 2) }, () => randomElement(users));
      const addedPanelMembers: string[] = [];

      for (const member of panelMembers) {
        if (addedPanelMembers.includes(member.id)) continue;
        addedPanelMembers.push(member.id);

        await prisma.interviewPanel.create({
          data: {
            interviewId: interview.id,
            userId: member.id,
          },
        });

        // Add feedback for completed interviews
        if (status === InterviewStatus.completed) {
          await prisma.interviewFeedback.create({
            data: {
              interviewId: interview.id,
              panelMemberId: member.id,
              recommendation: randomElement([
                InterviewRecommendation.strong_hire,
                InterviewRecommendation.hire,
                InterviewRecommendation.no_hire,
                InterviewRecommendation.strong_no_hire,
              ]),
              overallComments: `Candidate showed ${randomElement(['excellent', 'good', 'average', 'strong'])} ${randomElement(['technical skills', 'communication', 'problem-solving ability', 'cultural fit'])}. ${randomElement(['Recommended for next round.', 'Needs improvement in some areas.', 'Strong candidate overall.', 'Would be a good addition to the team.'])}`,
              ratings: [
                { criterion: 'Technical Skills', score: randomInt(1, 5) },
                { criterion: 'Communication', score: randomInt(1, 5) },
                { criterion: 'Problem Solving', score: randomInt(1, 5) },
                { criterion: 'Cultural Fit', score: randomInt(1, 5) },
              ],
            },
          });
        }
      }
    }
  }
  console.log('📅 Created', interviewCount, 'interviews');

  console.log('\n✅ SnapFind demo seed completed successfully!');
  console.log('\n📋 Login Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('| Email                    | Password     | Role           |');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('| tushar@snapfind.com      | password123  | Admin          |');
  console.log('| priya@snapfind.com       | password123  | Recruiter      |');
  console.log('| rahul@snapfind.com       | password123  | Recruiter      |');
  console.log('| anita@snapfind.com       | password123  | Hiring Manager |');
  console.log('| vikram@snapfind.com      | password123  | Recruiter      |');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
    await pool.end();
  });
