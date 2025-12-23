import { PrismaClient, UserRole, JobStatus, ActivityType, NotificationType } from '@prisma/client';
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

  // Clean existing data (Phase 2 models first due to foreign keys)
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


  // Create candidates with enhanced fields
  const candidatesData = [
    {
      name: 'Rajesh Kumar Patel',
      email: 'rajesh.patel@techcorp.com',
      phone: '+91-98765-43210',
      experienceYears: 8.0,
      currentCompany: 'TechCorp Solutions Pvt Ltd',
      location: 'Bangalore',
      currentCtc: '₹32 LPA (Fixed: ₹28L + Variable: ₹4L)',
      expectedCtc: '₹45-50 LPA (Negotiable)',
      noticePeriod: '15 days (Buyout possible)',
      source: 'LinkedIn Premium',
      availability: 'Immediate (Serving Notice)',
      skills: ['React.js', 'Node.js', 'TypeScript', 'Python', 'AWS', 'Docker', 'Kubernetes', 'MongoDB', 'PostgreSQL', 'GraphQL', 'Redis', 'Microservices'],
      score: 92,
      // Enhanced fields
      age: 31,
      industry: 'Enterprise Software & Cloud Solutions',
      jobDomain: 'Full Stack Development & System Architecture',
      candidateSummary: 'Highly skilled Senior Full Stack Engineer with 8+ years of comprehensive experience in building scalable web applications and cloud-native solutions. Expert in modern JavaScript ecosystem (React, Node.js, TypeScript) with strong backend expertise in Python and microservices architecture. Led cross-functional teams of 6+ developers, successfully delivered 15+ enterprise projects with 99.9% uptime. Proven track record in AWS cloud infrastructure, DevOps practices, and agile methodologies. Passionate about clean code, system design, and mentoring junior developers. Recently completed AWS Solutions Architect certification and actively contributes to open-source projects.',
      tags: ['High priority', 'Full Stack', 'Cloud Expert', 'Team Lead'],
      title: 'Senior Full Stack Engineer',
      department: 'Engineering',
      internalMobility: false,
    },
    {
      name: 'Ananya Krishnamurthy',
      email: 'ananya.k@innovatetech.in',
      phone: '+91-87654-32109',
      experienceYears: 6.0,
      currentCompany: 'InnovateTech India',
      location: 'Hyderabad',
      currentCtc: '₹28 LPA (Base: ₹24L + ESOP: ₹4L)',
      expectedCtc: '₹38-42 LPA + Equity',
      noticePeriod: '45 days (Non-negotiable)',
      source: 'Employee Referral',
      availability: '45 days (Standard Notice)',
      skills: ['Product Strategy', 'User Research', 'Data Analytics', 'Agile/Scrum', 'Figma', 'SQL', 'A/B Testing', 'Market Research', 'Roadmap Planning'],
      score: 88,
      // Enhanced fields
      age: 29,
      industry: 'B2B SaaS & Enterprise Solutions',
      jobDomain: 'Product Management & Strategy',
      candidateSummary: 'Results-driven Senior Product Manager with 6+ years of experience in B2B SaaS products serving 10M+ users. Successfully launched 8 major product features that increased user engagement by 40% and revenue by ₹25Cr annually. Expert in user research, data-driven decision making, and cross-functional team leadership. Led product strategy for enterprise clients including Fortune 500 companies. Strong analytical skills with proficiency in SQL, analytics tools, and A/B testing frameworks. MBA from IIM Bangalore with specialization in Technology Management. Passionate about building products that solve real business problems.',
      tags: ['Product Leadership', 'B2B SaaS', 'Referral', 'High Potential'],
      title: 'Senior Product Manager',
      department: 'Product',
      internalMobility: false,
    },
    {
      name: 'Vikram Singh Chauhan',
      email: 'vikram.chauhan@salesforce.com',
      phone: '+91-99887-76655',
      experienceYears: 12.0,
      currentCompany: 'Salesforce India',
      location: 'Mumbai',
      currentCtc: '₹65 LPA (Base: ₹45L + Variable: ₹15L + ESOP: ₹5L)',
      expectedCtc: '₹85-95 LPA + Performance Bonus',
      noticePeriod: '90 days (Standard for Leadership)',
      source: 'Executive Headhunter',
      availability: '90 days (Leadership Notice)',
      skills: ['Enterprise Sales', 'Account Management', 'Team Leadership', 'Salesforce CRM', 'Contract Negotiation', 'Strategic Planning', 'Revenue Growth', 'Client Relations', 'P&L Management'],
      score: 95,
      // Enhanced fields
      age: 38,
      industry: 'Enterprise Software & Cloud CRM',
      jobDomain: 'Enterprise Sales & Business Development',
      candidateSummary: 'Accomplished Enterprise Sales Director with 12+ years of proven success in B2B software sales, consistently exceeding targets by 150%+. Currently managing ₹180Cr+ annual revenue portfolio with 25+ enterprise accounts including Reliance, TCS, and HDFC Bank. Led sales teams of 15+ members across multiple regions, achieving 40% YoY growth for 3 consecutive years. Expert in complex deal negotiations, C-level stakeholder management, and strategic account planning. Strong track record of closing deals worth ₹5-20Cr with Fortune 500 companies. MBA from XLRI Jamshedpur with specialization in Sales & Marketing. Recognized as "Top Performer" for 5 consecutive years.',
      tags: ['Leadership', 'Enterprise Sales', 'High Value', 'C-Level Connect'],
      title: 'Enterprise Sales Director',
      department: 'Sales',
      internalMobility: false,
    },
    {
      name: 'Priya Sharma',
      email: 'priya.sharma@fintech.com',
      phone: '+91-98765-43213',
      experienceYears: 5.5,
      currentCompany: 'FinTech Innovations',
      location: 'Bangalore',
      currentCtc: '₹24 LPA',
      expectedCtc: '₹32 LPA',
      noticePeriod: '30 days',
      source: 'LinkedIn',
      availability: '30 days',
      skills: ['Java', 'Spring Boot', 'Microservices', 'PostgreSQL', 'Kafka', 'Redis'],
      score: 82,
      // Enhanced fields
      age: 28,
      industry: 'Financial Technology',
      jobDomain: 'Backend Development',
      candidateSummary: 'Experienced backend engineer with 5+ years in fintech domain. Specialized in building scalable microservices using Java and Spring Boot. Led multiple high-impact projects involving payment processing systems and real-time transaction handling. Strong expertise in distributed systems and event-driven architectures.',
      tags: ['Fintech', 'Backend Expert'],
      title: 'Senior Backend Engineer',
      department: 'Engineering',
      internalMobility: false,
    },
    {
      name: 'Deepak Raj',
      email: 'deepak.raj@datasync.com',
      phone: '+91-98765-10005',
      experienceYears: 5.5,
      currentCompany: 'DataSync Labs',
      location: 'Chennai',
      currentCtc: '₹20 LPA',
      expectedCtc: '₹26 LPA',
      noticePeriod: '60 days',
      source: 'Referral',
      availability: '60+ days',
      skills: ['Python', 'Data Analysis', 'SQL', 'Tableau', 'Machine Learning', 'Pandas', 'NumPy'],
      score: 82,
      // Enhanced fields
      age: 30,
      industry: 'Data Analytics & AI',
      jobDomain: 'Data Science & Analytics',
      candidateSummary: 'Data scientist with 5+ years of experience in building ML models and analytics solutions. Expert in Python ecosystem, statistical analysis, and data visualization. Led data-driven initiatives that improved business KPIs by 25%. Strong background in machine learning algorithms and big data technologies.',
      tags: ['Data Science', 'ML Expert', 'Referral'],
      title: 'Senior Data Scientist',
      department: 'Analytics',
      internalMobility: false,
    },
    {
      name: 'Sneha Patel',
      email: 'sneha.patel@designhub.com',
      phone: '+91-98765-10006',
      experienceYears: 4.8,
      currentCompany: 'DesignHub',
      location: 'Bangalore',
      currentCtc: '₹22 LPA',
      expectedCtc: '₹28 LPA',
      noticePeriod: '30 days',
      source: 'LinkedIn',
      availability: '30 days',
      skills: ['Figma', 'UI/UX', 'User Research', 'Prototyping', 'Design Systems', 'Adobe Creative Suite'],
      score: 88,
      // Enhanced fields
      age: 27,
      industry: 'Design & User Experience',
      jobDomain: 'UX/UI Design',
      candidateSummary: 'Creative UX designer with 4+ years of experience in digital product design. Led design for 10+ mobile and web applications with 2M+ users. Expert in user research, prototyping, and design systems. Passionate about creating intuitive user experiences that drive business results.',
      tags: ['Design', 'UX Expert', 'Creative'],
      title: 'Senior UX Designer',
      department: 'Design',
      internalMobility: false,
    },
    {
      name: 'Amit Singh',
      email: 'amit.singh@techgiant.com',
      phone: '+91-98765-10007',
      experienceYears: 8.5,
      currentCompany: 'TechGiant Corp',
      location: 'Pune',
      currentCtc: '₹35 LPA',
      expectedCtc: '₹45 LPA',
      noticePeriod: '90 days',
      source: 'Headhunted',
      availability: '60+ days',
      skills: ['Java', 'System Design', 'Architecture', 'AWS', 'Kubernetes', 'Docker', 'Microservices'],
      score: 92,
      // Enhanced fields
      age: 34,
      industry: 'Enterprise Technology',
      jobDomain: 'System Architecture',
      candidateSummary: 'Senior technical architect with 8+ years of experience in designing large-scale distributed systems. Led architecture for systems handling 100M+ requests/day. Expert in cloud-native technologies, microservices, and DevOps practices. Mentored 20+ engineers and established engineering best practices.',
      tags: ['Architecture', 'Leadership', 'Cloud Expert'],
      title: 'Principal Software Architect',
      department: 'Engineering',
      internalMobility: false,
    },
    {
      name: 'Neha Verma',
      email: 'neha.verma@productfirst.com',
      phone: '+91-98765-10008',
      experienceYears: 6.2,
      currentCompany: 'ProductFirst',
      location: 'Bangalore',
      currentCtc: '₹32 LPA',
      expectedCtc: '₹40 LPA',
      noticePeriod: '30 days',
      source: 'LinkedIn',
      availability: '30 days',
      skills: ['Product Management', 'Agile', 'Roadmapping', 'Analytics', 'Stakeholder Management', 'Go-to-Market'],
      score: 85,
      // Enhanced fields
      age: 31,
      industry: 'Product Management',
      jobDomain: 'Product Strategy & Management',
      candidateSummary: 'Experienced product manager with 6+ years in tech product development. Successfully launched 12+ products with combined ARR of ₹50Cr+. Expert in product strategy, user research, and cross-functional team leadership. Strong analytical mindset with data-driven approach to product decisions.',
      tags: ['Product', 'Strategy', 'Leadership'],
      title: 'Senior Product Manager',
      department: 'Product',
      internalMobility: false,
    },
    {
      name: 'Rohit Sharma',
      email: 'rohit.sharma@salesforce.com',
      phone: '+91-98765-10009',
      experienceYears: 7.0,
      currentCompany: 'SalesForce India',
      location: 'Gurgaon',
      currentCtc: '₹28 LPA',
      expectedCtc: '₹35 LPA',
      noticePeriod: '30 days',
      source: 'Referral',
      availability: '30 days',
      skills: ['Enterprise Sales', 'B2B', 'Account Management', 'CRM', 'Negotiation', 'Team Leadership'],
      score: 80,
      // Enhanced fields
      age: 33,
      industry: 'Enterprise Software Sales',
      jobDomain: 'B2B Sales & Account Management',
      candidateSummary: 'Results-driven sales professional with 7+ years in enterprise B2B sales. Consistently exceeded targets by 130%+ for 5 consecutive years. Managed key accounts worth ₹40Cr+ annual revenue. Expert in consultative selling, relationship building, and complex deal negotiations.',
      tags: ['Sales', 'Enterprise', 'Referral'],
      title: 'Senior Sales Manager',
      department: 'Sales',
      internalMobility: false,
    },
    {
      name: 'Meera Krishnan',
      email: 'meera.krishnan@startup.com',
      phone: '+91-98765-10010',
      experienceYears: 3.5,
      currentCompany: 'StartupXYZ',
      location: 'Remote',
      currentCtc: '₹14 LPA',
      expectedCtc: '₹18 LPA',
      noticePeriod: '15 days',
      source: 'Career Page',
      availability: '15 days',
      skills: ['Java', 'Spring Boot', 'MySQL', 'Git', 'REST APIs'],
      score: 65,
      // Enhanced fields
      age: 25,
      industry: 'Software Development',
      jobDomain: 'Backend Development',
      candidateSummary: 'Enthusiastic backend developer with 3+ years of experience in Java and Spring Boot. Quick learner with strong problem-solving skills. Contributed to multiple microservices projects and passionate about clean code practices.',
      tags: ['Junior', 'Remote', 'Growth Potential'],
      title: 'Software Engineer',
      department: 'Engineering',
      internalMobility: true,
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
    { 
      name: 'Arun Nair', 
      email: 'arun.nair@example.com', 
      phone: '+91-98765-11001',
      location: 'Bangalore', 
      source: 'LinkedIn', 
      skills: ['Java', 'Spring', 'Hibernate'], 
      experienceYears: 4.0, 
      score: 70,
      currentCompany: 'TechStart Solutions',
      currentCtc: '₹18 LPA',
      expectedCtc: '₹24 LPA',
      noticePeriod: '30 days',
      availability: '30 days',
      age: 27,
      industry: 'Software Development',
      jobDomain: 'Backend Development',
      candidateSummary: 'Backend developer with 4 years of experience in Java ecosystem. Strong foundation in Spring framework and database technologies.',
      tags: ['Java', 'Backend'],
      title: 'Software Engineer',
      department: 'Engineering',
      internalMobility: false,
    },
    { 
      name: 'Pooja Reddy', 
      email: 'pooja.reddy@example.com', 
      phone: '+91-98765-11002',
      location: 'Hyderabad', 
      source: 'Job Board', 
      skills: ['Python', 'Django', 'PostgreSQL'], 
      experienceYears: 3.5, 
      score: 68,
      currentCompany: 'WebTech Innovations',
      currentCtc: '₹15 LPA',
      expectedCtc: '₹20 LPA',
      noticePeriod: '45 days',
      availability: '45 days',
      age: 26,
      industry: 'Web Development',
      jobDomain: 'Full Stack Development',
      candidateSummary: 'Full-stack developer with expertise in Python and Django. Experience in building web applications and RESTful APIs.',
      tags: ['Python', 'Django', 'Full Stack'],
      title: 'Software Developer',
      department: 'Engineering',
      internalMobility: false,
    },
    { 
      name: 'Suresh Kumar', 
      email: 'suresh.kumar@example.com', 
      phone: '+91-98765-11003',
      location: 'Chennai', 
      source: 'Referral', 
      skills: ['Node.js', 'React', 'MongoDB'], 
      experienceYears: 5.0, 
      score: 75,
      currentCompany: 'Digital Solutions Ltd',
      currentCtc: '₹22 LPA',
      expectedCtc: '₹28 LPA',
      noticePeriod: '30 days',
      availability: '30 days',
      age: 29,
      industry: 'Digital Solutions',
      jobDomain: 'Full Stack Development',
      candidateSummary: 'Experienced full-stack developer with strong expertise in MERN stack. Led development of multiple client projects.',
      tags: ['MERN', 'Full Stack', 'Referral'],
      title: 'Senior Software Engineer',
      department: 'Engineering',
      internalMobility: false,
    },
    { 
      name: 'Divya Menon', 
      email: 'divya.menon@example.com', 
      phone: '+91-98765-11004',
      location: 'Pune', 
      source: 'Career Page', 
      skills: ['Java', 'Microservices', 'Spring Boot'], 
      experienceYears: 6.0, 
      score: 80,
      currentCompany: 'Enterprise Tech Corp',
      currentCtc: '₹26 LPA',
      expectedCtc: '₹32 LPA',
      noticePeriod: '60 days',
      availability: '60+ days',
      age: 30,
      industry: 'Enterprise Software',
      jobDomain: 'Microservices Architecture',
      candidateSummary: 'Senior engineer with expertise in microservices architecture and distributed systems. Experience in enterprise-grade applications.',
      tags: ['Microservices', 'Enterprise', 'Architecture'],
      title: 'Senior Software Engineer',
      department: 'Engineering',
      internalMobility: false,
    },
    { 
      name: 'Rajesh Iyer', 
      email: 'rajesh.iyer@example.com', 
      phone: '+91-98765-11005',
      location: 'Bangalore', 
      source: 'LinkedIn', 
      skills: ['AWS', 'DevOps', 'Kubernetes'], 
      experienceYears: 7.0, 
      score: 82,
      currentCompany: 'CloudOps Solutions',
      currentCtc: '₹30 LPA',
      expectedCtc: '₹38 LPA',
      noticePeriod: '45 days',
      availability: '45 days',
      age: 32,
      industry: 'Cloud Infrastructure',
      jobDomain: 'DevOps & Cloud Engineering',
      candidateSummary: 'DevOps engineer with 7+ years of experience in cloud infrastructure and automation. Expert in AWS services and container orchestration.',
      tags: ['DevOps', 'AWS', 'Cloud'],
      title: 'Senior DevOps Engineer',
      department: 'Engineering',
      internalMobility: false,
    },
    { 
      name: 'Kavitha Sundaram', 
      email: 'kavitha.s@example.com', 
      phone: '+91-98765-11006',
      location: 'Remote', 
      source: 'Job Board', 
      skills: ['Data Science', 'Python', 'Machine Learning'], 
      experienceYears: 4.5, 
      score: 72,
      currentCompany: 'Analytics Pro',
      currentCtc: '₹20 LPA',
      expectedCtc: '₹26 LPA',
      noticePeriod: '30 days',
      availability: '30 days',
      age: 28,
      industry: 'Data Analytics',
      jobDomain: 'Data Science & ML',
      candidateSummary: 'Data scientist with expertise in machine learning and statistical analysis. Experience in building predictive models and data pipelines.',
      tags: ['Data Science', 'ML', 'Remote'],
      title: 'Data Scientist',
      department: 'Analytics',
      internalMobility: false,
    },
    { 
      name: 'Venkat Rao', 
      email: 'venkat.rao@example.com', 
      phone: '+91-98765-11007',
      location: 'Hyderabad', 
      source: 'Referral', 
      skills: ['Java', 'Kafka', 'Event Streaming'], 
      experienceYears: 5.5, 
      score: 76,
      currentCompany: 'StreamTech Solutions',
      currentCtc: '₹24 LPA',
      expectedCtc: '₹30 LPA',
      noticePeriod: '45 days',
      availability: '45 days',
      age: 31,
      industry: 'Real-time Systems',
      jobDomain: 'Event-Driven Architecture',
      candidateSummary: 'Backend engineer specializing in event-driven systems and real-time data processing. Strong experience with Kafka and distributed systems.',
      tags: ['Kafka', 'Event Streaming', 'Referral'],
      title: 'Senior Backend Engineer',
      department: 'Engineering',
      internalMobility: false,
    },
    { 
      name: 'Lakshmi Prasad', 
      email: 'lakshmi.p@example.com', 
      phone: '+91-98765-11008',
      location: 'Bangalore', 
      source: 'LinkedIn', 
      skills: ['Product Management', 'Agile', 'Strategy'], 
      experienceYears: 8.0, 
      score: 85,
      currentCompany: 'Product Innovations Inc',
      currentCtc: '₹35 LPA',
      expectedCtc: '₹42 LPA',
      noticePeriod: '60 days',
      availability: '60+ days',
      age: 34,
      industry: 'Product Management',
      jobDomain: 'Product Strategy & Leadership',
      candidateSummary: 'Senior product manager with 8+ years of experience in product strategy and team leadership. Successfully launched multiple products with significant market impact.',
      tags: ['Product', 'Strategy', 'Leadership'],
      title: 'Senior Product Manager',
      department: 'Product',
      internalMobility: false,
    },
  ];

  for (const candData of additionalCandidates) {
    await prisma.candidate.create({
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
        currentCompany: candData.currentCompany,
        currentCtc: candData.currentCtc,
        expectedCtc: candData.expectedCtc,
        noticePeriod: candData.noticePeriod,
        availability: candData.availability,
        age: candData.age,
        industry: candData.industry,
        jobDomain: candData.jobDomain,
        candidateSummary: candData.candidateSummary,
        tags: candData.tags,
        title: candData.title,
        department: candData.department,
        internalMobility: candData.internalMobility,
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
      skills: ['Java', 'Spring Boot', 'AWS', 'Microservices'], 
      experienceYears: 5.0, 
      score: null,
      resumeUrl: '/uploads/resumes/sarah-johnson-resume.pdf',
      currentCompany: 'Tech Innovations Inc',
      currentCtc: '$95,000',
      expectedCtc: '$120,000',
      noticePeriod: '2 weeks',
      availability: '2 weeks',
      age: 29,
      industry: 'Technology',
      jobDomain: 'Backend Development',
      candidateSummary: 'Experienced backend developer with strong expertise in Java and cloud technologies. Looking for opportunities in innovative tech companies.',
      tags: ['International', 'Java Expert'],
      title: 'Senior Software Engineer',
      department: 'Engineering',
      internalMobility: false,
    },
    { 
      name: 'Michael Chen', 
      email: 'michael.chen@outlook.com', 
      phone: '+1-555-234-5678',
      location: 'New York, NY', 
      source: 'Public Application', 
      skills: ['Python', 'Machine Learning', 'TensorFlow', 'Data Science'], 
      experienceYears: 3.0, 
      score: null,
      resumeUrl: '/uploads/resumes/michael-chen-resume.pdf',
      currentCompany: 'AI Research Labs',
      currentCtc: '$85,000',
      expectedCtc: '$110,000',
      noticePeriod: '3 weeks',
      availability: '3 weeks',
      age: 26,
      industry: 'Artificial Intelligence',
      jobDomain: 'Machine Learning Engineering',
      candidateSummary: 'ML engineer with expertise in deep learning and data science. Passionate about building AI-powered solutions.',
      tags: ['ML', 'AI', 'International'],
      title: 'ML Engineer',
      department: 'Engineering',
      internalMobility: false,
    },
    { 
      name: 'Emily Davis', 
      email: 'emily.davis@yahoo.com', 
      phone: '+1-555-345-6789',
      location: 'Austin, TX', 
      source: 'Public Application', 
      skills: ['React', 'TypeScript', 'Node.js', 'GraphQL'], 
      experienceYears: 4.0, 
      score: null,
      resumeUrl: '/uploads/resumes/emily-davis-resume.pdf',
      currentCompany: 'Frontend Solutions LLC',
      currentCtc: '$88,000',
      expectedCtc: '$105,000',
      noticePeriod: '2 weeks',
      availability: '2 weeks',
      age: 27,
      industry: 'Web Development',
      jobDomain: 'Frontend Development',
      candidateSummary: 'Frontend developer with strong TypeScript and React expertise. Experience in building modern web applications.',
      tags: ['Frontend', 'React', 'International'],
      title: 'Senior Frontend Developer',
      department: 'Engineering',
      internalMobility: false,
    },
    { 
      name: 'James Wilson', 
      email: 'james.wilson@gmail.com', 
      phone: '+1-555-456-7890',
      location: 'Seattle, WA', 
      source: 'Public Application', 
      skills: ['Go', 'Kubernetes', 'Docker', 'DevOps'], 
      experienceYears: 6.0, 
      score: null,
      resumeUrl: '/uploads/resumes/james-wilson-resume.pdf',
      currentCompany: 'Cloud Infrastructure Co',
      currentCtc: '$105,000',
      expectedCtc: '$130,000',
      noticePeriod: '4 weeks',
      availability: '4 weeks',
      age: 31,
      industry: 'Cloud Infrastructure',
      jobDomain: 'DevOps & Infrastructure',
      candidateSummary: 'DevOps engineer with expertise in Go and container orchestration. Strong background in cloud infrastructure and automation.',
      tags: ['DevOps', 'Go', 'International'],
      title: 'Senior DevOps Engineer',
      department: 'Engineering',
      internalMobility: false,
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
        currentCompany: candData.currentCompany,
        currentCtc: candData.currentCtc,
        expectedCtc: candData.expectedCtc,
        noticePeriod: candData.noticePeriod,
        availability: candData.availability,
        age: candData.age,
        industry: candData.industry,
        jobDomain: candData.jobDomain,
        candidateSummary: candData.candidateSummary,
        tags: candData.tags,
        title: candData.title,
        department: candData.department,
        internalMobility: candData.internalMobility,
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

  // ============================================
  // Phase 2: Stage History Data (Requirements 2.1, 2.2)
  // ============================================
  
  // Get all job candidates for stage history creation
  const allJobCandidates = await prisma.jobCandidate.findMany({
    include: {
      job: {
        include: {
          pipelineStages: true,
        },
      },
      candidate: true,
    },
  });

  // Create stage history entries with various durations for TAT testing
  const stageHistoryEntries: Array<{
    jobCandidateId: string;
    stageId: string;
    stageName: string;
    enteredAt: Date;
    exitedAt: Date | null;
    durationHours: number | null;
    comment: string | null;
    movedBy: string | null;
  }> = [];

  const now = new Date();
  const recruiterUser = users.find(u => u.role === UserRole.recruiter);
  const adminUser = users.find(u => u.role === UserRole.admin);

  for (const jc of allJobCandidates) {
    const stages = jc.job.pipelineStages.sort((a, b) => a.position - b.position);
    const currentStageIndex = stages.findIndex(s => s.id === jc.currentStageId);
    
    // Create history for all stages up to and including current stage
    let cumulativeHours = 0;
    for (let i = 0; i <= currentStageIndex; i++) {
      const stage = stages[i];
      const isCurrentStage = i === currentStageIndex;
      
      // Vary durations: earlier stages have longer durations (simulating realistic flow)
      const baseDuration = isCurrentStage ? 0 : Math.floor(Math.random() * 72) + 24; // 24-96 hours
      const enteredAt = new Date(now.getTime() - (cumulativeHours + baseDuration) * 60 * 60 * 1000);
      const exitedAt = isCurrentStage ? null : new Date(now.getTime() - cumulativeHours * 60 * 60 * 1000);
      
      const comments = [
        'Good fit for the role',
        'Strong technical skills demonstrated',
        'Excellent communication',
        'Needs further evaluation',
        'Recommended for next round',
        'Passed initial screening',
        null,
      ];
      
      stageHistoryEntries.push({
        jobCandidateId: jc.id,
        stageId: stage.id,
        stageName: stage.name,
        enteredAt,
        exitedAt,
        durationHours: isCurrentStage ? null : baseDuration,
        comment: isCurrentStage ? null : comments[Math.floor(Math.random() * comments.length)],
        movedBy: isCurrentStage ? null : (Math.random() > 0.5 ? recruiterUser?.id : adminUser?.id) || null,
      });
      
      cumulativeHours += baseDuration;
    }
  }

  // Create stage history records
  for (const entry of stageHistoryEntries) {
    await prisma.stageHistory.create({
      data: entry,
    });
  }
  console.log('📊 Created', stageHistoryEntries.length, 'stage history entries');

  // ============================================
  // Phase 2: Sample Notifications (Requirements 8.1)
  // ============================================
  
  const notificationData: Array<{
    userId: string;
    type: NotificationType;
    title: string;
    message: string;
    entityType: string | null;
    entityId: string | null;
    isRead: boolean;
    createdAt: Date;
  }> = [];

  // Create notifications for each user
  for (const user of users) {
    // Stage change notifications (mix of read and unread)
    for (let i = 0; i < 3; i++) {
      const jc = allJobCandidates[Math.floor(Math.random() * allJobCandidates.length)];
      const hoursAgo = Math.floor(Math.random() * 72) + 1;
      
      notificationData.push({
        userId: user.id,
        type: NotificationType.stage_change,
        title: 'Candidate Stage Updated',
        message: `${jc.candidate.name} has been moved to ${jc.job.pipelineStages.find(s => s.id === jc.currentStageId)?.name || 'new stage'} for ${jc.job.title}`,
        entityType: 'candidate',
        entityId: jc.candidateId,
        isRead: Math.random() > 0.5, // 50% read
        createdAt: new Date(now.getTime() - hoursAgo * 60 * 60 * 1000),
      });
    }

    // SLA breach notifications (mostly unread)
    if (Math.random() > 0.3) {
      const jc = allJobCandidates[Math.floor(Math.random() * allJobCandidates.length)];
      notificationData.push({
        userId: user.id,
        type: NotificationType.sla_breach,
        title: 'SLA Breach Alert',
        message: `${jc.candidate.name} has exceeded the SLA threshold in ${jc.job.pipelineStages.find(s => s.id === jc.currentStageId)?.name || 'current stage'}`,
        entityType: 'candidate',
        entityId: jc.candidateId,
        isRead: Math.random() > 0.8, // 20% read
        createdAt: new Date(now.getTime() - Math.floor(Math.random() * 24) * 60 * 60 * 1000),
      });
    }

    // Feedback pending notifications
    if (Math.random() > 0.5) {
      const jc = allJobCandidates[Math.floor(Math.random() * allJobCandidates.length)];
      notificationData.push({
        userId: user.id,
        type: NotificationType.feedback_pending,
        title: 'Feedback Pending',
        message: `Interview feedback is pending for ${jc.candidate.name} - ${jc.job.title}`,
        entityType: 'candidate',
        entityId: jc.candidateId,
        isRead: Math.random() > 0.6, // 40% read
        createdAt: new Date(now.getTime() - Math.floor(Math.random() * 48) * 60 * 60 * 1000),
      });
    }

    // Offer pending notifications (for hiring managers and admins)
    if (user.role === UserRole.hiring_manager || user.role === UserRole.admin) {
      const offerCandidates = allJobCandidates.filter(jc => 
        jc.job.pipelineStages.find(s => s.id === jc.currentStageId)?.name === 'Offer'
      );
      if (offerCandidates.length > 0) {
        const jc = offerCandidates[0];
        notificationData.push({
          userId: user.id,
          type: NotificationType.offer_pending,
          title: 'Offer Approval Required',
          message: `Offer approval is pending for ${jc.candidate.name} - ${jc.job.title}`,
          entityType: 'candidate',
          entityId: jc.candidateId,
          isRead: false,
          createdAt: new Date(now.getTime() - 12 * 60 * 60 * 1000),
        });
      }
    }
  }

  // Create notifications
  for (const notification of notificationData) {
    await prisma.notification.create({
      data: notification,
    });
  }
  console.log('🔔 Created', notificationData.length, 'notifications');

  // ============================================
  // Phase 2: SLA Configurations (Requirements 10.5)
  // ============================================
  
  const slaConfigs = [
    { stageName: 'Queue', thresholdDays: 1 },
    { stageName: 'Applied', thresholdDays: 2 },
    { stageName: 'Screening', thresholdDays: 3 },
    { stageName: 'Shortlisted', thresholdDays: 5 },
    { stageName: 'Interview', thresholdDays: 7 },
    { stageName: 'Selected', thresholdDays: 3 },
    { stageName: 'Offer', thresholdDays: 5 },
    { stageName: 'Hired', thresholdDays: 10 },
  ];

  for (const config of slaConfigs) {
    await prisma.sLAConfig.create({
      data: {
        companyId: company.id,
        stageName: config.stageName,
        thresholdDays: config.thresholdDays,
      },
    });
  }
  console.log('⏱️ Created', slaConfigs.length, 'SLA configurations');

  // Create sample tasks for the admin user
  const sampleTasks = [
    { type: 'feedback' as const, text: 'Submit feedback for Priya Sharma - Backend round', severity: 'high' as const },
    { type: 'approval' as const, text: 'Approve offer letter for Vikram Singh', severity: 'high' as const },
    { type: 'reminder' as const, text: 'Follow up with Ankit Patel on offer decision', severity: 'medium' as const },
    { type: 'pipeline' as const, text: 'Review 12 new applications for Data Analyst', severity: 'medium' as const },
  ];

  for (const taskData of sampleTasks) {
    await prisma.task.create({
      data: {
        companyId: company.id,
        userId: adminUser.id,
        type: taskData.type,
        text: taskData.text,
        severity: taskData.severity,
        status: 'open',
      },
    });
  }
  console.log('📋 Created', sampleTasks.length, 'sample tasks');

  console.log('✅ Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - 1 Company: ${company.name}`);
  console.log(`   - ${users.length} Users (recruiters & admins)`);
  console.log(`   - ${jobs.length} Jobs with pipeline stages`);
  console.log(`   - ${candidates.length + additionalCandidates.length + publicCandidates.length} Candidates total`);
  console.log(`   - ${publicCandidates.length} Candidates from public applications`);
  console.log(`   - ${jobCandidateAssociations.length + publicApplicationAssociations.length} Job-Candidate associations`);
  console.log(`   - ${stageHistoryEntries.length} Stage history entries`);
  console.log(`   - ${notificationData.length} Notifications`);
  console.log(`   - ${slaConfigs.length} SLA configurations`);
  console.log(`   - ${sampleTasks.length} Sample tasks`);
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
