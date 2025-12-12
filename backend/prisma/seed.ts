import { PrismaClient, UserRole, JobStatus, ActivityType } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import bcrypt from 'bcrypt';
import 'dotenv/config';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

// Default pipeline stages
const DEFAULT_STAGES = [
  'Queue',
  'Applied',
  'Screening',
  'Shortlisted',
  'Interview',
  'Selected',
  'Offer',
  'Hired',
];

async function main() {
  console.log('🌱 Starting seed...');

  // Clean existing data
  await prisma.candidateActivity.deleteMany();
  await prisma.jobCandidate.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.candidate.deleteMany();
  await prisma.job.deleteMany();
  await prisma.user.deleteMany();
  await prisma.company.deleteMany();

  console.log('🧹 Cleaned existing data');

  // Create company
  const company = await prisma.company.create({
    data: {
      name: 'Acme Technologies',
      contactEmail: 'hr@acmetech.com',
      address: 'Bangalore, India',
      logoUrl: '/logo.png',
    },
  });
  console.log('🏢 Created company:', company.name);

  // Create users (recruiters and admins)
  const passwordHash = await bcrypt.hash('password123', 10);

  const users = await Promise.all([
    prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Tushar',
        email: 'tushar@acmetech.com',
        passwordHash,
        role: UserRole.admin,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Aarti',
        email: 'aarti@acmetech.com',
        passwordHash,
        role: UserRole.recruiter,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Rahul',
        email: 'rahul@acmetech.com',
        passwordHash,
        role: UserRole.recruiter,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Vikram',
        email: 'vikram@acmetech.com',
        passwordHash,
        role: UserRole.hiring_manager,
        isActive: true,
      },
    }),
    prisma.user.create({
      data: {
        companyId: company.id,
        name: 'Sana',
        email: 'sana@acmetech.com',
        passwordHash,
        role: UserRole.recruiter,
        isActive: true,
      },
    }),
  ]);
  console.log('👥 Created', users.length, 'users');


  // Create jobs with pipeline stages
  const jobsData = [
    {
      title: 'Senior Backend Engineer',
      department: 'Engineering',
      location: 'Bangalore',
      employmentType: 'Full-time',
      salaryRange: '25-35 LPA',
      description: 'We are looking for a Senior Backend Engineer with 5+ years of experience in Java, Spring Boot, and distributed systems.',
      status: JobStatus.active,
      openings: 3,
    },
    {
      title: 'Backend Engineer (L2)',
      department: 'Engineering',
      location: 'Hyderabad',
      employmentType: 'Full-time',
      salaryRange: '15-22 LPA',
      description: 'Join our backend team to build scalable microservices using Java and modern cloud technologies.',
      status: JobStatus.active,
      openings: 2,
    },
    {
      title: 'Product Manager',
      department: 'Product',
      location: 'Bangalore',
      employmentType: 'Full-time',
      salaryRange: '30-45 LPA',
      description: 'Lead product strategy and roadmap for our core platform products.',
      status: JobStatus.active,
      openings: 1,
    },
    {
      title: 'Sales Lead (North)',
      department: 'Sales',
      location: 'Gurgaon',
      employmentType: 'Full-time',
      salaryRange: '20-30 LPA',
      description: 'Drive sales growth in the North region with enterprise clients.',
      status: JobStatus.active,
      openings: 2,
    },
    {
      title: 'UX Designer',
      department: 'Design',
      location: 'Bangalore',
      employmentType: 'Full-time',
      salaryRange: '18-28 LPA',
      description: 'Create beautiful and intuitive user experiences for our products.',
      status: JobStatus.active,
      openings: 1,
    },
    {
      title: 'Data Analyst',
      department: 'Engineering',
      location: 'Remote',
      employmentType: 'Full-time',
      salaryRange: '12-18 LPA',
      description: 'Analyze data to drive business insights and product decisions.',
      status: JobStatus.active,
      openings: 2,
    },
    {
      title: 'Backend Architect',
      department: 'Engineering',
      location: 'Bangalore',
      employmentType: 'Full-time',
      salaryRange: '40-55 LPA',
      description: 'Design and architect scalable backend systems for high-traffic applications.',
      status: JobStatus.active,
      openings: 1,
    },
    {
      title: 'SDE II (Platform)',
      department: 'Engineering',
      location: 'Hyderabad',
      employmentType: 'Full-time',
      salaryRange: '18-25 LPA',
      description: 'Build and maintain our core platform infrastructure.',
      status: JobStatus.active,
      openings: 2,
    },
  ];

  const jobs: Array<{ id: string; title: string; stages: Array<{ id: string; name: string }> }> = [];

  for (const jobData of jobsData) {
    const job = await prisma.job.create({
      data: {
        companyId: company.id,
        ...jobData,
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

    jobs.push({ id: job.id, title: job.title, stages: stages.map(s => ({ id: s.id, name: s.name })) });
  }
  console.log('💼 Created', jobs.length, 'jobs with pipeline stages');


  // Create candidates
  const candidatesData = [
    {
      name: 'Ravi Kumar',
      email: 'ravi.kumar@example.com',
      phone: '+91-98765-10001',
      experienceYears: 7.2,
      currentCompany: 'FinEdge Systems',
      location: 'Bangalore',
      currentCtc: '26 LPA',
      expectedCtc: '32 LPA',
      noticePeriod: '30 days',
      source: 'Referral',
      availability: '30 days',
      skills: ['Java', 'Spring Boot', 'Microservices', 'REST APIs', 'Distributed systems', 'Kafka'],
      score: 85,
    },
    {
      name: 'Ananya Sharma',
      email: 'ananya.sharma@example.com',
      phone: '+91-98765-10002',
      experienceYears: 4.1,
      currentCompany: 'CloudNova',
      location: 'Hyderabad',
      currentCtc: '18 LPA',
      expectedCtc: '22 LPA',
      noticePeriod: '15 days',
      source: 'Job Board',
      availability: '15 days',
      skills: ['Java', 'Microservices', 'SQL', 'Docker'],
      score: 72,
    },
    {
      name: 'Karan Mehta',
      email: 'karan.mehta@example.com',
      phone: '+91-98765-10003',
      experienceYears: 6.0,
      currentCompany: 'NeoPay',
      location: 'Gurgaon',
      currentCtc: '24 LPA',
      expectedCtc: '30 LPA',
      noticePeriod: '30 days',
      source: 'LinkedIn',
      availability: '30 days',
      skills: ['Java', 'Kafka', 'Event-driven', 'Fintech', 'Payment gateways'],
      score: 78,
    },
    {
      name: 'Priya Gupta',
      email: 'priya.gupta@example.com',
      phone: '+91-98765-10004',
      experienceYears: 3.2,
      currentCompany: 'CodeNest',
      location: 'Bangalore',
      currentCtc: '15 LPA',
      expectedCtc: '19 LPA',
      noticePeriod: 'Immediate',
      source: 'Job Board',
      availability: 'Immediate',
      skills: ['REST APIs', 'Node.js', 'PostgreSQL', 'React'],
      score: 68,
    },
    {
      name: 'Deepak Raj',
      email: 'deepak.raj@example.com',
      phone: '+91-98765-10005',
      experienceYears: 5.5,
      currentCompany: 'DataSync Labs',
      location: 'Chennai',
      currentCtc: '20 LPA',
      expectedCtc: '26 LPA',
      noticePeriod: '60 days',
      source: 'Referral',
      availability: '60+ days',
      skills: ['Python', 'Data Analysis', 'SQL', 'Tableau', 'Machine Learning'],
      score: 82,
    },
    {
      name: 'Sneha Patel',
      email: 'sneha.patel@example.com',
      phone: '+91-98765-10006',
      experienceYears: 4.8,
      currentCompany: 'DesignHub',
      location: 'Bangalore',
      currentCtc: '22 LPA',
      expectedCtc: '28 LPA',
      noticePeriod: '30 days',
      source: 'LinkedIn',
      availability: '30 days',
      skills: ['Figma', 'UI/UX', 'User Research', 'Prototyping', 'Design Systems'],
      score: 88,
    },
    {
      name: 'Amit Singh',
      email: 'amit.singh@example.com',
      phone: '+91-98765-10007',
      experienceYears: 8.5,
      currentCompany: 'TechGiant Corp',
      location: 'Pune',
      currentCtc: '35 LPA',
      expectedCtc: '45 LPA',
      noticePeriod: '90 days',
      source: 'Headhunted',
      availability: '60+ days',
      skills: ['Java', 'System Design', 'Architecture', 'AWS', 'Kubernetes'],
      score: 92,
    },
    {
      name: 'Neha Verma',
      email: 'neha.verma@example.com',
      phone: '+91-98765-10008',
      experienceYears: 6.2,
      currentCompany: 'ProductFirst',
      location: 'Bangalore',
      currentCtc: '32 LPA',
      expectedCtc: '40 LPA',
      noticePeriod: '30 days',
      source: 'LinkedIn',
      availability: '30 days',
      skills: ['Product Management', 'Agile', 'Roadmapping', 'Analytics', 'Stakeholder Management'],
      score: 85,
    },
    {
      name: 'Rohit Sharma',
      email: 'rohit.sharma@example.com',
      phone: '+91-98765-10009',
      experienceYears: 7.0,
      currentCompany: 'SalesForce India',
      location: 'Gurgaon',
      currentCtc: '28 LPA',
      expectedCtc: '35 LPA',
      noticePeriod: '30 days',
      source: 'Referral',
      availability: '30 days',
      skills: ['Enterprise Sales', 'B2B', 'Account Management', 'CRM', 'Negotiation'],
      score: 80,
    },
    {
      name: 'Meera Krishnan',
      email: 'meera.krishnan@example.com',
      phone: '+91-98765-10010',
      experienceYears: 3.5,
      currentCompany: 'StartupXYZ',
      location: 'Remote',
      currentCtc: '14 LPA',
      expectedCtc: '18 LPA',
      noticePeriod: '15 days',
      source: 'Career Page',
      availability: '15 days',
      skills: ['Java', 'Spring Boot', 'MySQL', 'Git'],
      score: 65,
    },
  ];

  const candidates: Array<{ id: string; name: string; email: string }> = [];

  for (const candidateData of candidatesData) {
    const candidate = await prisma.candidate.create({
      data: {
        companyId: company.id,
        ...candidateData,
      },
    });
    candidates.push({ id: candidate.id, name: candidate.name, email: candidate.email });
  }
  console.log('👤 Created', candidates.length, 'candidates');


  // Associate candidates with jobs at various stages
  const jobCandidateAssociations = [
    // Senior Backend Engineer - multiple candidates at different stages
    { candidateIndex: 0, jobIndex: 0, stageName: 'Interview' }, // Ravi Kumar
    { candidateIndex: 2, jobIndex: 0, stageName: 'Screening' }, // Karan Mehta
    { candidateIndex: 6, jobIndex: 0, stageName: 'Offer' }, // Amit Singh
    { candidateIndex: 9, jobIndex: 0, stageName: 'Applied' }, // Meera Krishnan

    // Backend Engineer (L2)
    { candidateIndex: 1, jobIndex: 1, stageName: 'Interview' }, // Ananya Sharma
    { candidateIndex: 3, jobIndex: 1, stageName: 'Screening' }, // Priya Gupta

    // Product Manager
    { candidateIndex: 7, jobIndex: 2, stageName: 'Interview' }, // Neha Verma

    // Sales Lead (North)
    { candidateIndex: 8, jobIndex: 3, stageName: 'Offer' }, // Rohit Sharma

    // UX Designer
    { candidateIndex: 5, jobIndex: 4, stageName: 'Interview' }, // Sneha Patel

    // Data Analyst
    { candidateIndex: 4, jobIndex: 5, stageName: 'Shortlisted' }, // Deepak Raj
  ];

  for (const assoc of jobCandidateAssociations) {
    const job = jobs[assoc.jobIndex];
    const candidate = candidates[assoc.candidateIndex];
    const stage = job.stages.find(s => s.name === assoc.stageName);

    if (stage) {
      const jobCandidate = await prisma.jobCandidate.create({
        data: {
          jobId: job.id,
          candidateId: candidate.id,
          currentStageId: stage.id,
        },
      });

      // Create activity for the candidate
      await prisma.candidateActivity.create({
        data: {
          candidateId: candidate.id,
          jobCandidateId: jobCandidate.id,
          activityType: ActivityType.stage_change,
          description: `Applied for ${job.title}`,
          metadata: { fromStage: null, toStage: 'Applied' },
        },
      });

      if (assoc.stageName !== 'Applied') {
        await prisma.candidateActivity.create({
          data: {
            candidateId: candidate.id,
            jobCandidateId: jobCandidate.id,
            activityType: ActivityType.stage_change,
            description: `Moved to ${assoc.stageName}`,
            metadata: { fromStage: 'Applied', toStage: assoc.stageName },
          },
        });
      }
    }
  }
  console.log('🔗 Created job-candidate associations and activities');

  // Add more candidates to fill the pipeline (for realistic numbers)
  const additionalCandidates = [
    { name: 'Arun Nair', email: 'arun.nair@example.com', location: 'Bangalore', source: 'LinkedIn', skills: ['Java', 'Spring'], experienceYears: 4.0, score: 70 },
    { name: 'Pooja Reddy', email: 'pooja.reddy@example.com', location: 'Hyderabad', source: 'Job Board', skills: ['Python', 'Django'], experienceYears: 3.5, score: 68 },
    { name: 'Suresh Kumar', email: 'suresh.kumar@example.com', location: 'Chennai', source: 'Referral', skills: ['Node.js', 'React'], experienceYears: 5.0, score: 75 },
    { name: 'Divya Menon', email: 'divya.menon@example.com', location: 'Pune', source: 'Career Page', skills: ['Java', 'Microservices'], experienceYears: 6.0, score: 80 },
    { name: 'Rajesh Iyer', email: 'rajesh.iyer@example.com', location: 'Bangalore', source: 'LinkedIn', skills: ['AWS', 'DevOps'], experienceYears: 7.0, score: 82 },
    { name: 'Kavitha Sundaram', email: 'kavitha.s@example.com', location: 'Remote', source: 'Job Board', skills: ['Data Science', 'Python'], experienceYears: 4.5, score: 72 },
    { name: 'Venkat Rao', email: 'venkat.rao@example.com', location: 'Hyderabad', source: 'Referral', skills: ['Java', 'Kafka'], experienceYears: 5.5, score: 76 },
    { name: 'Lakshmi Prasad', email: 'lakshmi.p@example.com', location: 'Bangalore', source: 'LinkedIn', skills: ['Product', 'Agile'], experienceYears: 8.0, score: 85 },
  ];

  for (const candData of additionalCandidates) {
    await prisma.candidate.create({
      data: {
        companyId: company.id,
        name: candData.name,
        email: candData.email,
        location: candData.location,
        source: candData.source,
        skills: candData.skills,
        experienceYears: candData.experienceYears,
        score: candData.score,
      },
    });
  }
  console.log('👤 Created', additionalCandidates.length, 'additional candidates');

  // Add candidates from public applications (Requirements 6.3, 6.4)
  const publicApplicationCandidates = [
    { 
      name: 'Sarah Johnson', 
      email: 'sarah.johnson@gmail.com', 
      phone: '+1-555-123-4567',
      location: 'San Francisco, CA', 
      source: 'Public Application', 
      skills: ['Java', 'Spring Boot', 'AWS'], 
      experienceYears: 5.0, 
      score: null,
      resumeUrl: '/uploads/resumes/sarah-johnson-resume.pdf',
    },
    { 
      name: 'Michael Chen', 
      email: 'michael.chen@outlook.com', 
      phone: '+1-555-234-5678',
      location: 'New York, NY', 
      source: 'Public Application', 
      skills: ['Python', 'Machine Learning', 'TensorFlow'], 
      experienceYears: 3.0, 
      score: null,
      resumeUrl: '/uploads/resumes/michael-chen-resume.pdf',
    },
    { 
      name: 'Emily Davis', 
      email: 'emily.davis@yahoo.com', 
      phone: '+1-555-345-6789',
      location: 'Austin, TX', 
      source: 'Public Application', 
      skills: ['React', 'TypeScript', 'Node.js'], 
      experienceYears: 4.0, 
      score: null,
      resumeUrl: '/uploads/resumes/emily-davis-resume.pdf',
    },
    { 
      name: 'James Wilson', 
      email: 'james.wilson@gmail.com', 
      phone: '+1-555-456-7890',
      location: 'Seattle, WA', 
      source: 'Public Application', 
      skills: ['Go', 'Kubernetes', 'Docker'], 
      experienceYears: 6.0, 
      score: null,
      resumeUrl: '/uploads/resumes/james-wilson-resume.pdf',
    },
  ];

  const publicCandidates: Array<{ id: string; name: string }> = [];
  for (const candData of publicApplicationCandidates) {
    const candidate = await prisma.candidate.create({
      data: {
        companyId: company.id,
        name: candData.name,
        email: candData.email,
        phone: candData.phone,
        location: candData.location,
        source: candData.source,
        skills: candData.skills,
        experienceYears: candData.experienceYears,
        score: candData.score,
        resumeUrl: candData.resumeUrl,
      },
    });
    publicCandidates.push({ id: candidate.id, name: candidate.name });
  }
  console.log('📝 Created', publicCandidates.length, 'candidates from public applications');

  // Associate public application candidates with jobs at Applied stage
  const publicApplicationAssociations = [
    { candidateIndex: 0, jobIndex: 0 }, // Sarah Johnson -> Senior Backend Engineer
    { candidateIndex: 1, jobIndex: 5 }, // Michael Chen -> Data Analyst
    { candidateIndex: 2, jobIndex: 1 }, // Emily Davis -> Backend Engineer (L2)
    { candidateIndex: 3, jobIndex: 6 }, // James Wilson -> Backend Architect
  ];

  for (const assoc of publicApplicationAssociations) {
    const job = jobs[assoc.jobIndex];
    const candidate = publicCandidates[assoc.candidateIndex];
    const appliedStage = job.stages.find(s => s.name === 'Applied');

    if (appliedStage) {
      const jobCandidate = await prisma.jobCandidate.create({
        data: {
          jobId: job.id,
          candidateId: candidate.id,
          currentStageId: appliedStage.id,
        },
      });

      // Create activity for the public application
      await prisma.candidateActivity.create({
        data: {
          candidateId: candidate.id,
          jobCandidateId: jobCandidate.id,
          activityType: ActivityType.stage_change,
          description: `Applied via public application form for ${job.title}`,
          metadata: { 
            fromStage: null, 
            toStage: 'Applied',
            applicationSource: 'Public Application Form',
          },
        },
      });
    }
  }
  console.log('🔗 Created', publicApplicationAssociations.length, 'public application job associations');

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 Company: ${company.name}`);
  console.log(`   - ${users.length} Users (recruiters & admins)`);
  console.log(`   - ${jobs.length} Jobs with pipeline stages`);
  console.log(`   - ${candidates.length + additionalCandidates.length + publicCandidates.length} Candidates total`);
  console.log(`   - ${publicCandidates.length} Candidates from public applications`);
  console.log(`   - ${jobCandidateAssociations.length + publicApplicationAssociations.length} Job-Candidate associations`);
  console.log('\n🔑 Login credentials:');
  console.log('   Email: tushar@acmetech.com');
  console.log('   Password: password123');
  console.log('\n📋 Sample Job Application URLs:');
  jobs.slice(0, 3).forEach(job => {
    console.log(`   - ${job.title}: /apply/${job.id}`);
  });
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
