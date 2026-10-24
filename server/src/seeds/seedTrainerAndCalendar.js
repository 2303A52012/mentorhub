import bcrypt from 'bcryptjs';
import prisma from '../config/prisma.js';

async function seedTrainerAndCalendar() {
  if (process.env.NODE_ENV === 'production' && process.env.ALLOW_DESTRUCTIVE_SEED !== 'true') {
    throw new Error(
      'FATAL: Destructive seeding is prohibited in production. ' +
      'To force seeding in production, you must explicitly set ALLOW_DESTRUCTIVE_SEED=true with authorized confirmation.'
    );
  }

  console.log('🌱 Seeding Trainers, Official Training Calendar, and Company POTDs...');

  // 1. Fetch existing batches
  const batches = await prisma.batch.findMany({
    orderBy: { name: 'asc' }
  });

  if (batches.length === 0) {
    console.error('❌ No batches found in database. Please run batch seed first.');
    process.exit(1);
  }

  const batchMap = {};
  batches.forEach((b) => {
    batchMap[b.name] = b.id;
  });

  console.log(`Found ${batches.length} cohorts:`, Object.keys(batchMap).join(', '));

  // 2. Create or ensure Default Trainers
  const seedPassword = process.env.SEED_DEFAULT_PASSWORD;
  if (!seedPassword || seedPassword.length < 8) {
    throw new Error(
      'FATAL: SEED_DEFAULT_PASSWORD environment variable (min 8 characters) must be explicitly configured to run seed scripts.'
    );
  }
  const passwordHash = await bcrypt.hash(seedPassword, 10);

  const trainersData = [
    {
      name: 'Trainer G6-B1',
      email: 'trainer.g6-b1@sru.edu.in',
      designation: 'Corporate Technical Trainer (G6-B1)',
      bio: 'Corporate Trainer dedicated to Batch G6-B1. Specializes in Algorithms, Data Structures, and Placement Readiness.',
      batchNames: ['G6-B1']
    },
    {
      name: 'Trainer G6-B2',
      email: 'trainer.g6-b2@sru.edu.in',
      designation: 'Corporate Technical Trainer (G6-B2)',
      bio: 'Corporate Trainer dedicated to Batch G6-B2. Specializes in Core CS, Problem Solving, and Technical Interview Prep.',
      batchNames: ['G6-B2']
    },
    {
      name: 'Trainer G6-B3',
      email: 'trainer.g6-b3@sru.edu.in',
      designation: 'Corporate Technical Trainer (G6-B3)',
      bio: 'Corporate Trainer dedicated to Batch G6-B3. Specializes in Full Stack Systems, High Performance Computing, and System Design.',
      batchNames: ['G6-B3']
    },
    {
      name: 'Trainer G6-B4',
      email: 'trainer.g6-b4@sru.edu.in',
      designation: 'Corporate Technical Trainer (G6-B4)',
      bio: 'Corporate Trainer dedicated to Batch G6-B4. Specializes in Cloud Architecture, Scalable Backends, and Coding Assessment.',
      batchNames: ['G6-B4']
    }
  ];

  const batchTrainerMap = {};

  for (const tData of trainersData) {
    let user = await prisma.user.findFirst({
      where: { email: { equals: tData.email, mode: 'insensitive' } }
    });

    if (!user) {
      user = await prisma.user.create({
        data: {
          name: tData.name,
          email: tData.email.toLowerCase(),
          passwordHash,
          role: 'TRAINER',
          accountStatus: 'ACTIVE',
          mustChangePassword: true,
          trainerProfile: {
            create: {
              designation: tData.designation,
              bio: tData.bio
            }
          }
        }
      });
      console.log(`✅ Created Trainer: ${user.name} (${user.email})`);
    } else {
      console.log(`ℹ️ Trainer already exists: ${user.name} (${user.email})`);
    }

    // Link trainer to batches
    for (const bName of tData.batchNames) {
      const bId = batchMap[bName];
      if (bId) {
        await prisma.trainerBatch.upsert({
          where: { trainerId_batchId: { trainerId: user.id, batchId: bId } },
          create: { trainerId: user.id, batchId: bId, isPrimary: true },
          update: { isPrimary: true }
        });
        batchTrainerMap[bId] = user.id;
      }
    }
  }

  // 3. Official Training Calendar Dates (Sep, Oct, Nov 2026)
  const officialSchedule = [
    // September 2026
    { date: new Date('2026-09-01T09:30:00Z'), topics: [], notes: '' },
    { date: new Date('2026-09-04T09:30:00Z'), topics: [], notes: '' },
    { date: new Date('2026-09-12T09:30:00Z'), topics: [], notes: '' },
    { date: new Date('2026-09-19T09:30:00Z'), topics: [], notes: '' },

    // October 2026
    { date: new Date('2026-10-03T09:30:00Z'), topics: [], notes: '' },
    { date: new Date('2026-10-07T09:30:00Z'), topics: [], notes: '' },
    { date: new Date('2026-10-10T09:30:00Z'), topics: [], notes: '' },
    { date: new Date('2026-10-17T09:30:00Z'), topics: [], notes: '' },
    { date: new Date('2026-10-23T09:30:00Z'), topics: [], notes: '' },
    { date: new Date('2026-10-24T09:30:00Z'), topics: [], notes: '' },
    { date: new Date('2026-10-31T09:30:00Z'), topics: [], notes: '' },

    // November 2026
    { date: new Date('2026-11-05T09:30:00Z'), topics: [], notes: '' },
    { date: new Date('2026-11-14T09:30:00Z'), topics: [], notes: '' },
    { date: new Date('2026-11-21T09:30:00Z'), topics: [], notes: '' },
    { date: new Date('2026-11-22T09:30:00Z'), topics: [], notes: '' }
  ];

  console.log(`Seeding official training schedule across ${batches.length} cohorts...`);
  let sessionCount = 0;

  for (const b of batches) {
    for (const session of officialSchedule) {
      // Check if session on this date for this batch already exists
      const existing = await prisma.trainingSession.findFirst({
        where: {
          batchId: b.id,
          date: session.date
        }
      });

      if (!existing) {
        await prisma.trainingSession.create({
          data: {
            batchId: b.id,
            trainerId: batchTrainerMap[b.id] || null,
            date: session.date,
            topicsTaught: session.topics,
            notes: session.notes
          }
        });
        sessionCount++;
      }
    }
  }

  console.log(`✅ Seeded ${sessionCount} training calendar sessions.`);

  console.log(`✅ Seeded ${sessionCount} training calendar sessions.`);
  console.log('🎉 Seeding completed successfully!');
  process.exit(0);
}

seedTrainerAndCalendar().catch((err) => {
  console.error('❌ Error during seeding:', err);
  process.exit(1);
});
