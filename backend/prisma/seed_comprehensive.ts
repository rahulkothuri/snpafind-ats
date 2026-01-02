import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { faker } from '@faker-js/faker';
import bcrypt from 'bcrypt';

// Initialize Prisma client properly
function createPrismaClient(): PrismaClient {
  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error('DATABASE_URL environment variable is not set');
  }
  
  const pool = new pg.Pool({ connectionString });
  const adapter = new PrismaPg(pool);
  
  return new PrismaClient({ adapter });
}

const prisma = createPrismaClient();

// Sample data arrays for realistic content
const COMPANIES = [
  { name: 'TechCorp Solutions', domain: 'techcorp.com' },
  { name: 'InnovateLabs', domain: 'innovatelabs.io' },
  { name: 'DataDriven Inc', domain: 'datadriven.com' },
];

const JOB_TITLES = [
  'Senior Software Engineer',
  'Frontend Developer',
  'Backend Developer',
  'Full Stack Developer',
  'DevOps Engineer',
  'Data Scientist',
  'Product Manager',
  'UI/UX Designer',
  'QA Engineer',
  'Mobile App Developer',
  'Machine Learning Engineer',
  'Cloud Architect',
  'Cybersecurity Specialist',
  'Business Analyst',
  'Technical Lead',
  'Engineering Manager',
  'Site Reliability Engineer',
  'Database Administrator',
  'Solutions Architect',
  'Scrum Master',
  'Digital Marketing Manager',
  'Content Writer',
  'Sales Executive',
  'HR Manager',
  'Finance Manager',
  'Operations Manager',
  'Customer Success Manager',
  'Growth Hacker',
  'Brand Manager',
  'Legal Counsel'
];

const SKILLS = [
  'JavaScript', 'TypeScript', 'React', 'Node.js', 'Python', 'Java', 'Go', 'Rust',
  'Docker', 'Kubernetes', 'AWS', 'Azure', 'GCP', 'MongoDB', 'PostgreSQL', 'Redis',
  'GraphQL', 'REST APIs', 'Microservices', 'CI/CD', 'Git', 'Linux', 'Agile', 'Scrum',
  'Machine Learning', 'TensorFlow', 'PyTorch', 'Data Analysis', 'SQL', 'NoSQL',
  'Vue.js', 'Angular', 'Flutter', 'React Native', 'Swift', 'Kotlin', 'C++', 'C#',
  'Ruby', 'PHP', 'Laravel', 'Django', 'Flask', 'Spring Boot', 'Express.js', 'Nest.js'
];

const CITIES = [
  'Mumbai', 'Delhi', 'Bangalore', 'Hyderabad', 'Chennai', 'Pune', 'Kolkata', 'Ahmedabad',
  'Jaipur', 'Surat', 'Lucknow', 'Kanpur', 'Nagpur', 'Indore', 'Thane', 'Bhopal',
  'Visakhapatnam', 'Pimpri-Chinchwad', 'Patna', 'Vadodara', 'Ghaziabad', 'Ludhiana',
  'Agra', 'Nashik', 'Faridabad', 'Meerut', 'Rajkot', 'Kalyan-Dombivali', 'Vasai-Virar', 'Varanasi'
];

const EDUCATION_LEVELS = [
  'Bachelor of Technology (B.Tech)',
  'Master of Technology (M.Tech)',
  'Bachelor of Computer Applications (BCA)',
  'Master of Computer Applications (MCA)',
  'Bachelor of Science (B.Sc)',
  'Master of Science (M.Sc)',
  'Bachelor of Engineering (B.E)',
  'Master of Business Administration (MBA)',
  'Bachelor of Commerce (B.Com)',
  'Master of Commerce (M.Com)'
];

const COMPANIES_LIST = [
  'TCS', 'Infosys', 'Wipro', 'HCL', 'Tech Mahindra', 'Cognizant', 'Accenture', 'IBM',
  'Microsoft', 'Google', 'Amazon', 'Flipkart', 'Paytm', 'Zomato', 'Swiggy', 'Ola',
  'Uber', 'PhonePe', 'BYJU\'S', 'Unacademy', 'Razorpay', 'Freshworks', 'Zoho', 'InMobi',
  'Myntra', 'BigBasket', 'Nykaa', 'PolicyBazaar', 'MakeMyTrip', 'BookMyShow'
];

const INTERVIEW_FEEDBACK_COMMENTS = [
  'Excellent technical skills and problem-solving abilities. Strong communication.',
  'Good understanding of concepts but needs improvement in system design.',
  'Outstanding candidate with great cultural fit. Highly recommended.',
  'Solid technical foundation but lacks experience in our tech stack.',
  'Impressive portfolio and hands-on experience. Great team player.',
  'Strong analytical thinking but communication could be better.',
  'Exceptional problem-solving skills and leadership qualities.',
  'Good technical knowledge but needs more real-world project experience.',
  'Excellent cultural fit with strong motivation and learning attitude.',
  'Outstanding technical depth and breadth of knowledge.',
  'Good candidate but may be overqualified for this position.',
  'Strong technical skills but concerns about long-term commitment.',
  'Impressive background and excellent communication skills.',
  'Good technical foundation but needs mentoring in advanced concepts.',
  'Exceptional candidate with strong leadership potential.'
];

const SCREENING_QUESTIONS = [
  {
    question: 'How many years of experience do you have in software development?',
    type: 'number' as const,
    required: true
  },
  {
    question: 'Are you comfortable working in a fast-paced startup environment?',
    type: 'yes_no' as const,
    required: true
  },
  {
    question: 'Which programming languages are you most proficient in?',
    type: 'multiple_choice' as const,
    required: true,
    options: ['JavaScript', 'Python', 'Java', 'Go', 'TypeScript', 'C++']
  },
  {
    question: 'What is your preferred work arrangement?',
    type: 'single_choice' as const,
    required: true,
    options: ['Remote', 'Hybrid', 'On-site', 'Flexible']
  },
  {
    question: 'Tell us about your most challenging project and how you overcame the difficulties.',
    type: 'textarea' as const,
    required: false
  }
];

const MANDATORY_CRITERIA = {
  title: "Mandatory Criteria (Can't be neglected during screening)",
  intro: "Preferred candidates from good startups only.",
  criteria: [
    "CA Candidates are not applicable for this role.",
    "Need candidate from Tier 1 and Tier 2 colleges only.",
    "2–3 years of hands-on experience in relevant technology.",
    "Strong proficiency in problem-solving and analytical thinking.",
    "Experience with modern development practices and tools.",
    "Strong attention to detail with high accuracy in deliverables.",
    "Strong problem-solving skills and ability to work independently.",
    "Candidate should have good communication skills."
  ],
  note: "NOTE - Looking for highly motivated and enthusiastic candidates"
};

async function main() {
  console.log('🌱 Starting comprehensive database seeding...');

  // Clear existing data
  console.log('🧹 Cleaning existing data...');
  await prisma.interview.deleteMany();
  await prisma.candidateActivity.deleteMany();
  await prisma.stageHistory.deleteMany();
  await prisma.jobCandidate.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  // Create companies
  console.log('🏢 Creating companies...');
  const companies = [];
  for (const companyData of COMPANIES) {
    const company = await prisma.company.create({
      data: {
        name: companyData.name,
        contactEmail: `contact@${companyData.domain}`,
        logoUrl: `https://logo.clearbit.com/${companyData.domain}`,
        website: `https://${companyData.domain}`,
        description: faker.company.catchPhrase(),
        industry: faker.company.buzzNoun(),
        companySize: faker.helpers.arrayElement(['1-10', '11-50', '51-200', '201-500', '500+']),
        city: faker.helpers.arrayElement(CITIES),
        state: faker.location.state(),
        country: 'India',
        phone: faker.phone.number({ style: 'national' }),
        address: faker.location.streetAddress(),
        postalCode: faker.location.zipCode(),
        linkedinUrl: `https://linkedin.com/company/${companyData.name.toLowerCase().replace(/\s+/g, '-')}`,
        careersPageUrl: `https://${companyData.domain}/careers`,
      },
    });
    companies.push(company);
  }

  // Create users for each company
  console.log('👥 Creating users...');
  const users = [];
  const defaultPassword = await bcrypt.hash('password123', 10);
  
  for (let companyIndex = 0; companyIndex < companies.length; companyIndex++) {
    const company = companies[companyIndex];
    const companyData = COMPANIES[companyIndex];
    
    // Create admin
    const admin = await prisma.user.create({
      data: {
        name: faker.person.fullName(),
        email: `admin@${companyData.domain}`,
        passwordHash: defaultPassword,
        role: 'admin',
        companyId: company.id,
        isActive: true,
      },
    });
    users.push(admin);

    // Create hiring managers
    for (let i = 0; i < 3; i++) {
      const hiringManager = await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: `hm${i + 1}@${companyData.domain}`,
          passwordHash: defaultPassword,
          role: 'hiring_manager',
          companyId: company.id,
          isActive: true,
        },
      });
      users.push(hiringManager);
    }

    // Create recruiters
    for (let i = 0; i < 5; i++) {
      const recruiter = await prisma.user.create({
        data: {
          name: faker.person.fullName(),
          email: `recruiter${i + 1}@${companyData.domain}`,
          passwordHash: defaultPassword,
          role: 'recruiter',
          companyId: company.id,
          isActive: faker.datatype.boolean(0.9), // 90% active
        },
      });
      users.push(recruiter);
    }
  }

  // Create jobs with pipeline stages
  console.log('💼 Creating jobs with pipeline stages...');
  const jobs = [];
  for (const company of companies) {
    const companyUsers = users.filter(u => u.companyId === company.id);
    const recruiters = companyUsers.filter(u => u.role === 'recruiter' || u.role === 'hiring_manager');

    for (let i = 0; i < 14; i++) { // 14 jobs per company = 42 total jobs
      const jobTitle = faker.helpers.arrayElement(JOB_TITLES);
      const selectedSkills = faker.helpers.arrayElements(SKILLS, { min: 3, max: 8 });
      const selectedLocations = faker.helpers.arrayElements(CITIES, { min: 1, max: 3 });
      
      // Create varied job ages for realistic SLA status distribution
      // Some jobs are new (0-10 days), some are mid-age (15-25 days), some are old (30-60 days)
      const ageDistribution = faker.helpers.arrayElement([
        { min: 0, max: 10 },   // New jobs - On track
        { min: 0, max: 10 },   // New jobs - On track
        { min: 15, max: 25 },  // Mid-age jobs - potentially At risk
        { min: 15, max: 25 },  // Mid-age jobs - potentially At risk
        { min: 25, max: 35 },  // Older jobs - At risk or Breached
        { min: 35, max: 60 },  // Old jobs - likely Breached
      ]);
      const daysAgo = faker.number.int(ageDistribution);
      const jobCreatedAt = new Date();
      jobCreatedAt.setDate(jobCreatedAt.getDate() - daysAgo);
      
      const job = await prisma.job.create({
        data: {
          companyId: company.id,
          title: jobTitle,
          department: faker.commerce.department(),
          description: generateJobDescription(jobTitle),
          openings: faker.number.int({ min: 1, max: 5 }),
          experienceMin: faker.number.int({ min: 0, max: 3 }),
          experienceMax: faker.number.int({ min: 4, max: 10 }),
          salaryMin: faker.number.int({ min: 300000, max: 800000 }),
          salaryMax: faker.number.int({ min: 800000, max: 2000000 }),
          createdAt: jobCreatedAt,
          variables: faker.helpers.arrayElement([
            'Performance bonus up to 20%',
            'Stock options available',
            'Annual bonus based on company performance',
            'Quarterly incentives',
            'Commission-based rewards'
          ]),
          educationQualification: faker.helpers.arrayElement(EDUCATION_LEVELS),
          ageUpTo: faker.number.int({ min: 25, max: 45 }),
          skills: selectedSkills,
          preferredIndustry: faker.company.buzzNoun(),
          workMode: faker.helpers.arrayElement(['Onsite', 'WFH', 'Hybrid']),
          locations: selectedLocations,
          priority: faker.helpers.arrayElement(['Low', 'Medium', 'High']),
          jobDomain: faker.helpers.arrayElement(['Engineering', 'Product', 'Design', 'Marketing', 'Sales', 'Operations']),
          assignedRecruiterId: faker.helpers.arrayElement(recruiters).id,
          status: faker.helpers.arrayElement(['active', 'active', 'active', 'paused', 'closed']), // More active jobs
          mandatoryCriteria: MANDATORY_CRITERIA,
          screeningQuestions: faker.helpers.arrayElements(SCREENING_QUESTIONS, { min: 2, max: 4 }),
        },
      });
      jobs.push(job);

      // Create pipeline stages for each job
      const defaultStages = [
        { name: 'Applied', position: 0, isMandatory: false },
        { name: 'Screening', position: 1, isMandatory: true },
        { name: 'Technical Round', position: 2, isMandatory: false },
        { name: 'Manager Round', position: 3, isMandatory: false },
        { name: 'HR Round', position: 4, isMandatory: false },
        { name: 'Offer', position: 5, isMandatory: true },
        { name: 'Hired', position: 6, isMandatory: false },
      ];

      for (const stage of defaultStages) {
        await prisma.pipelineStage.create({
          data: {
            jobId: job.id,
            name: stage.name,
            position: stage.position,
            isDefault: true,
            isMandatory: stage.isMandatory,
          },
        });
      }
    }
  }

  // Create candidates
  console.log('👨‍💼 Creating candidates...');
  const candidates = [];
  for (const company of companies) {
    for (let i = 0; i < 67; i++) { // 67 candidates per company = 201 total candidates
      const firstName = faker.person.firstName();
      const lastName = faker.person.lastName();
      const fullName = `${firstName} ${lastName}`;
      const selectedSkills = faker.helpers.arrayElements(SKILLS, { min: 2, max: 6 });
      
      const candidate = await prisma.candidate.create({
        data: {
          companyId: company.id,
          name: fullName,
          email: faker.internet.email({ firstName, lastName }),
          phone: faker.phone.number({ style: 'national' }),
          experienceYears: faker.number.float({ min: 0, max: 15, fractionDigits: 1 }),
          currentCompany: faker.helpers.arrayElement(COMPANIES_LIST),
          location: faker.helpers.arrayElement(CITIES),
          currentCtc: `${faker.number.int({ min: 3, max: 25 })} LPA`,
          expectedCtc: `${faker.number.int({ min: 5, max: 35 })} LPA`,
          noticePeriod: faker.helpers.arrayElement(['Immediate', '15 days', '30 days', '60 days', '90 days']),
          source: faker.helpers.arrayElement(['LinkedIn', 'Naukri', 'Referral', 'Company Website', 'Job Portal', 'Campus']),
          availability: faker.helpers.arrayElement(['Immediate', 'Within 2 weeks', 'Within 1 month', 'Flexible']),
          skills: selectedSkills,
          resumeUrl: `/uploads/resumes/${faker.string.uuid()}.pdf`,
          score: faker.number.int({ min: 60, max: 95 }),
          age: faker.number.int({ min: 22, max: 45 }),
          industry: faker.company.buzzNoun(),
          jobDomain: faker.helpers.arrayElement(['Engineering', 'Product', 'Design', 'Marketing', 'Sales']),
          candidateSummary: generateCandidateSummary(fullName, selectedSkills),
          tags: faker.helpers.arrayElements(['Top Performer', 'Quick Learner', 'Team Player', 'Leadership', 'Innovation'], { min: 1, max: 3 }),
          title: faker.person.jobTitle(),
          department: faker.commerce.department(),
          internalMobility: faker.datatype.boolean(0.1), // 10% internal candidates
        },
      });
      candidates.push(candidate);
    }
  }

  // Create job applications (job candidates)
  console.log('📋 Creating job applications...');
  const jobCandidates = [];
  for (const job of jobs) {
    const jobStages = await prisma.pipelineStage.findMany({
      where: { jobId: job.id, parentId: null },
      orderBy: { position: 'asc' },
    });

    const companyCandidates = candidates.filter(c => c.companyId === job.companyId);
    const applicants = faker.helpers.arrayElements(companyCandidates, { min: 3, max: 12 });

    for (const candidate of applicants) {
      const currentStage = faker.helpers.arrayElement(jobStages);
      const appliedAt = faker.date.between({ 
        from: new Date('2024-01-01'), 
        to: new Date() 
      });

      const jobCandidate = await prisma.jobCandidate.create({
        data: {
          jobId: job.id,
          candidateId: candidate.id,
          currentStageId: currentStage.id,
          appliedAt,
          updatedAt: faker.date.between({ from: appliedAt, to: new Date() }),
        },
      });
      jobCandidates.push(jobCandidate);

      // Create application activity
      await prisma.candidateActivity.create({
        data: {
          candidateId: candidate.id,
          jobCandidateId: jobCandidate.id,
          activityType: 'stage_change',
          description: 'Applied via public application form',
          metadata: {
            linkedinProfile: faker.internet.url(),
            portfolioUrl: faker.internet.url(),
            coverLetter: faker.lorem.paragraphs(2),
            desiredSalary: `${faker.number.int({ min: 8, max: 30 })} LPA`,
            workAuthorization: 'yes',
            screeningAnswers: generateScreeningAnswers(),
          },
          createdAt: appliedAt,
        },
      });

      // Create stage history
      await prisma.stageHistory.create({
        data: {
          jobCandidateId: jobCandidate.id,
          stageId: currentStage.id,
          stageName: currentStage.name,
          enteredAt: appliedAt,
          exitedAt: currentStage.name === 'Hired' || currentStage.name === 'Rejected' ? 
            faker.date.between({ from: appliedAt, to: new Date() }) : null,
          durationHours: faker.number.float({ min: 1, max: 168 }), // 1 hour to 1 week
          comment: faker.lorem.sentence(),
          movedBy: faker.helpers.arrayElement(users.filter(u => u.companyId === job.companyId)).id,
        },
      });
    }
  }

  // Create interviews
  console.log('🎤 Creating interviews...');
  const interviewModes = ['google_meet', 'microsoft_teams', 'in_person'] as const;
  const interviewStatuses = ['scheduled', 'completed', 'cancelled', 'no_show'] as const;
  
  // Define date ranges for interviews
  // Past interviews: October 2025 - December 2025
  // Future interviews: January 2026 - February 2026
  const pastInterviewStart = new Date('2025-10-01');
  const pastInterviewEnd = new Date('2025-12-31');
  const futureInterviewStart = new Date('2026-01-01');
  const futureInterviewEnd = new Date('2026-02-28');
  
  for (let i = 0; i < 200; i++) { // 200 interviews total
    const jobCandidate = faker.helpers.arrayElement(jobCandidates);
    const job = jobs.find(j => j.id === jobCandidate.jobId)!;
    const companyUsers = users.filter(u => u.companyId === job.companyId);
    const panelMembers = faker.helpers.arrayElements(companyUsers, { min: 1, max: 3 });
    
    // 60% future interviews (Jan-Feb 2026), 40% past interviews (Oct-Dec 2025)
    const isFutureInterview = i < 120; // First 120 are future interviews
    
    let scheduledAt: Date;
    let status: typeof interviewStatuses[number];
    
    if (isFutureInterview) {
      // Future interviews in January and February 2026
      scheduledAt = faker.date.between({ 
        from: futureInterviewStart, 
        to: futureInterviewEnd 
      });
      // Future interviews are mostly scheduled, some cancelled
      status = faker.helpers.arrayElement(['scheduled', 'scheduled', 'scheduled', 'cancelled']);
    } else {
      // Past interviews in October-December 2025
      scheduledAt = faker.date.between({ 
        from: pastInterviewStart, 
        to: pastInterviewEnd 
      });
      // Past interviews have varied statuses
      status = faker.helpers.arrayElement(interviewStatuses);
    }
    
    const mode = faker.helpers.arrayElement(interviewModes);
    
    const interview = await prisma.interview.create({
      data: {
        jobCandidateId: jobCandidate.id,
        scheduledAt,
        duration: faker.helpers.arrayElement([30, 45, 60, 90]),
        timezone: 'Asia/Kolkata',
        mode,
        meetingLink: mode === 'google_meet' ? 'https://meet.google.com/abc-defg-hij' :
                    mode === 'microsoft_teams' ? 'https://teams.microsoft.com/l/meetup-join/...' : null,
        location: mode === 'in_person' ? faker.location.streetAddress() : null,
        status,
        notes: faker.lorem.paragraph(),
        scheduledBy: faker.helpers.arrayElement(companyUsers).id,
        panelMembers: {
          create: panelMembers.map(member => ({
            userId: member.id,
          })),
        },
      },
    });

    // Create feedback for completed interviews
    if (status === 'completed') {
      for (const panelMember of panelMembers) {
        await prisma.interviewFeedback.create({
          data: {
            interviewId: interview.id,
            panelMemberId: panelMember.id,
            ratings: [
              { criterion: 'Technical Skills', score: faker.number.int({ min: 1, max: 5 }), comments: 'Good technical knowledge' },
              { criterion: 'Communication', score: faker.number.int({ min: 1, max: 5 }), comments: 'Clear communication' },
              { criterion: 'Problem Solving', score: faker.number.int({ min: 1, max: 5 }), comments: 'Analytical approach' },
              { criterion: 'Cultural Fit', score: faker.number.int({ min: 1, max: 5 }), comments: 'Good team fit' }
            ],
            overallComments: faker.helpers.arrayElement(INTERVIEW_FEEDBACK_COMMENTS),
            recommendation: faker.helpers.arrayElement(['strong_hire', 'hire', 'no_hire', 'strong_no_hire']),
          },
        });
      }
    }
  }

  // Create additional candidate activities
  console.log('📝 Creating additional candidate activities...');
  for (const candidate of candidates.slice(0, 50)) { // Add activities for first 50 candidates
    const activities = [
      'note_added',
      'resume_uploaded',
      'score_updated',
      'interview_scheduled'
    ] as const;

    for (let i = 0; i < faker.number.int({ min: 1, max: 5 }); i++) {
      await prisma.candidateActivity.create({
        data: {
          candidateId: candidate.id,
          activityType: faker.helpers.arrayElement(activities),
          description: generateActivityDescription(faker.helpers.arrayElement(activities)),
          metadata: {
            additionalInfo: faker.lorem.sentence(),
          },
          createdAt: faker.date.between({ 
            from: new Date('2024-01-01'), 
            to: new Date() 
          }),
        },
      });
    }
  }

  console.log('✅ Comprehensive database seeding completed!');
  console.log(`📊 Created:
    - ${companies.length} companies
    - ${users.length} users
    - ${jobs.length} jobs
    - ${candidates.length} candidates
    - ${jobCandidates.length} job applications
    - 200 interviews (120 in Jan-Feb 2026, 80 in Oct-Dec 2025)
    - Multiple activities and feedback entries`);
}

function generateJobDescription(title: string): string {
  return `## About the Role

We are looking for a talented ${title} to join our dynamic team. This is an exciting opportunity to work on cutting-edge projects and make a significant impact on our product development.

## Key Responsibilities

• Design, develop, and maintain high-quality software solutions
• Collaborate with cross-functional teams to deliver exceptional products
• Participate in code reviews and maintain coding standards
• Troubleshoot and debug applications to optimize performance
• Stay updated with the latest technology trends and best practices
• Mentor junior developers and contribute to team growth

## Requirements

• Bachelor's degree in Computer Science or related field
• Strong programming skills and problem-solving abilities
• Experience with modern development frameworks and tools
• Excellent communication and teamwork skills
• Passion for learning and continuous improvement

## What We Offer

• Competitive salary and benefits package
• Flexible working arrangements
• Professional development opportunities
• Health insurance and wellness programs
• Stock options and performance bonuses
• Collaborative and inclusive work environment`;
}

function generateCandidateSummary(name: string, skills: string[]): string {
  return `${name} is an experienced professional with expertise in ${skills.slice(0, 3).join(', ')}. 
Strong background in software development with a proven track record of delivering high-quality solutions. 
Excellent problem-solving skills and ability to work in fast-paced environments. 
Passionate about technology and continuous learning.`;
}

function generateScreeningAnswers(): Record<string, any> {
  return {
    'q1': faker.number.int({ min: 1, max: 8 }),
    'q2': faker.helpers.arrayElement(['yes', 'no']),
    'q3': faker.helpers.arrayElements(['JavaScript', 'Python', 'Java'], { min: 1, max: 3 }),
    'q4': faker.helpers.arrayElement(['Remote', 'Hybrid', 'On-site']),
    'q5': faker.lorem.paragraphs(2),
  };
}

function generateActivityDescription(activityType: 'note_added' | 'resume_uploaded' | 'score_updated' | 'interview_scheduled'): string {
  switch (activityType) {
    case 'note_added':
      return 'Added recruiter note after phone screening';
    case 'resume_uploaded':
      return 'Updated resume with latest experience';
    case 'score_updated':
      return 'Updated candidate score based on assessment';
    case 'interview_scheduled':
      return 'Scheduled technical interview';
    default:
      return 'General activity update';
  }
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });