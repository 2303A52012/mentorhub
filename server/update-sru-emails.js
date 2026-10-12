import prisma from './src/config/prisma.js';

async function updateEmails() {
  console.log('🔄 Starting SRU email migration...');
  const users = await prisma.user.findMany({
    include: {
      menteeProfile: true,
      mentorProfile: true
    }
  });

  console.log(`Found ${users.length} users to inspect.`);
  let updatedCount = 0;

  for (const user of users) {
    let newEmail = '';

    if (user.role === 'MENTEE') {
      const roll = user.menteeProfile?.rollNumber || user.menteeProfile?.studentId;
      if (roll && roll.trim()) {
        newEmail = `${roll.trim().toLowerCase()}@sru.edu.in`;
      } else {
        const prefix = user.email.split('@')[0].toLowerCase();
        newEmail = `${prefix}@sru.edu.in`;
      }
    } else if (user.role === 'MENTOR') {
      const roll = user.mentorProfile?.rollNumber;
      if (roll && roll.trim()) {
        newEmail = `${roll.trim().toLowerCase()}@sru.edu.in`;
      } else if (user.email.startsWith('mentor.')) {
        const prefix = user.email.replace(/^mentor\./, '').split('@')[0].toLowerCase();
        newEmail = `${prefix}@sru.edu.in`;
      } else {
        const prefix = user.email.split('@')[0].toLowerCase();
        newEmail = `${prefix}@sru.edu.in`;
      }
    } else if (user.role === 'ADMIN') {
      newEmail = 'admin@sru.edu.in';
    } else {
      const prefix = user.email.split('@')[0].toLowerCase();
      newEmail = `${prefix}@sru.edu.in`;
    }

    if (newEmail && newEmail !== user.email) {
      console.log(`Updating [${user.role}] ${user.name}: "${user.email}" -> "${newEmail}"`);
      await prisma.user.update({
        where: { id: user.id },
        data: { email: newEmail }
      });
      updatedCount++;
    } else {
      console.log(`Skipping [${user.role}] ${user.name}: already "${user.email}"`);
    }
  }

  console.log(`\n✅ Completed migration! Updated ${updatedCount} users.`);
  process.exit(0);
}

updateEmails().catch((err) => {
  console.error('❌ Migration failed:', err);
  process.exit(1);
});
