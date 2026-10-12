import prisma from './config/prisma.js';

async function verifyFullDatabase() {
  try {
    console.log('🔍 Verifying PostgreSQL Database Tables & Records...\n');

    const users = await prisma.user.findMany({ select: { id: true, name: true, email: true, role: true } });
    console.log(`👤 Users (${users.length}):`);
    users.forEach((u) => console.log(`   - [${u.role}] ${u.name} (${u.email})`));

    const batches = await prisma.batch.findMany({ include: { mentors: true, mentees: true } });
    console.log(`\n📦 Batches (${batches.length}):`);
    batches.forEach((b) => console.log(`   - ${b.name} (${b.mentees.length} mentees, ${b.mentors.length} mentors)`));

    const tasks = await prisma.task.findMany({ include: { problems: true, menteeTasks: true } });
    console.log(`\n📝 Tasks (${tasks.length}):`);
    tasks.forEach((t) => console.log(`   - [Week ${t.weekNo}] ${t.title} (${t.problems.length} problems, ${t.menteeTasks.length} assignments)`));

    const achievements = await prisma.achievement.findMany();
    console.log(`\n🏆 Achievements (${achievements.length}):`);
    achievements.forEach((a) => console.log(`   - ${a.name} [${a.code}] (+${a.points} pts)`));

    const reviews = await prisma.taskReview.findMany({ include: { reviewer: true } });
    console.log(`\n⭐ Reviews (${reviews.length}):`);
    reviews.forEach((r) => console.log(`   - Decision: ${r.decision}, Score: ${r.score}/10 by ${r.reviewer.name}`));

    console.log('\n✅ All PostgreSQL database tables and relationships verified successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Verification failed:', err);
    process.exit(1);
  }
}

verifyFullDatabase();
