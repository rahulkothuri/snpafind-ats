import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import { faker } from '@faker-js/faker';

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

async function addInterviewsForDataDriven() {
  console.log('🎤 Adding 20 interviews for DataDriven Inc...');

  // Find DataDriven company
  const dataDrivenCompany = await prisma.company.findFirst({
    where: { name: 'DataDriven Inc' }
  });

  if (!dataDrivenCompany) {
    console.error('❌ DataDriven Inc company not found!');
    return;
  }

  console.log(`✅ Found DataDriven Inc: ${dataDrivenCompany.id}`);

  // Get all job candidates for DataDriven company
  const jobCandidates = await prisma.jobCandidate.findMany({
    where: {
      job: {
        companyId: dataDrivenCompany.id
      }
    },
    include: {
      job: true,
      candidate: true
    }
  });

  if (jobCandidates.length === 0) {
    console.error('❌ No job candidates found for DataDriven Inc!');
    return;
  }

  console.log(`✅ Found ${jobCandidates.length} job candidates for DataDriven Inc`);

  // Get all users from DataDriven company
  const companyUsers = await prisma.user.findMany({
    where: { companyId: dataDrivenCompany.id }
  });

  console.log(`✅ Found ${companyUsers.length} users for DataDriven Inc`);

  const interviewModes = ['google_meet', 'microsoft_teams', 'in_person'] as const;
  const interviewStatuses = ['scheduled', 'completed', 'cancelled', 'no_show'] as const;

  // Create 20 interviews
  for (let i = 0; i < 20; i++) {
    const jobCandidate = faker.helpers.arrayElement(jobCandidates);
    const panelMembers = faker.helpers.arrayElements(companyUsers, { min: 1, max: 3 });
    
    const scheduledAt = faker.date.between({ 
      from: new Date('2024-12-01'), 
      to: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // Next 30 days
    });
    
    const mode = faker.helpers.arrayElement(interviewModes);
    const status = faker.helpers.arrayElement(interviewStatuses);
    
    const interview = await prisma.interview.create({
      data: {
        jobCandidateId: jobCandidate.id,
        scheduledAt,
        duration: faker.helpers.arrayElement([30, 45, 60, 90]),
        timezone: 'Asia/Kolkata',
        mode,
        meetingLink: mode === 'google_meet' ? `https://meet.google.com/${faker.string.alphanumeric(10)}` :
                    mode === 'microsoft_teams' ? `https://teams.microsoft.com/l/meetup-join/${faker.string.uuid()}` : null,
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

    console.log(`✅ Created interview ${i + 1}/20: ${interview.id} for ${jobCandidate.candidate.name} - ${jobCandidate.job.title}`);

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
      console.log(`  ✅ Added feedback for completed interview`);
    }
  }

  console.log('✅ Successfully added 20 interviews for DataDriven Inc!');
}

addInterviewsForDataDriven()
  .catch((e) => {
    console.error('❌ Error adding interviews:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });