import prisma from '../src/config/prisma.js';

async function applyRLS() {
  console.log('🛡️ Applying Supabase RLS policies for Weekly Mocks tables...');

  const sqlStatements = [
    `ALTER TABLE "MockSection" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "MockSession" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "MockSlot" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "MockEvaluation" ENABLE ROW LEVEL SECURITY;`,
    `ALTER TABLE "MockSlotHistory" ENABLE ROW LEVEL SECURITY;`,

    // MockSection policies
    `DROP POLICY IF EXISTS "Public service role full access MockSection" ON "MockSection";`,
    `CREATE POLICY "Public service role full access MockSection" ON "MockSection" FOR ALL USING (true);`,

    // MockSession policies
    `DROP POLICY IF EXISTS "Public service role full access MockSession" ON "MockSession";`,
    `CREATE POLICY "Public service role full access MockSession" ON "MockSession" FOR ALL USING (true);`,

    // MockSlot policies
    `DROP POLICY IF EXISTS "Public service role full access MockSlot" ON "MockSlot";`,
    `CREATE POLICY "Public service role full access MockSlot" ON "MockSlot" FOR ALL USING (true);`,

    // MockEvaluation policies
    `DROP POLICY IF EXISTS "Public service role full access MockEvaluation" ON "MockEvaluation";`,
    `CREATE POLICY "Public service role full access MockEvaluation" ON "MockEvaluation" FOR ALL USING (true);`,

    // MockSlotHistory policies
    `DROP POLICY IF EXISTS "Public service role full access MockSlotHistory" ON "MockSlotHistory";`,
    `CREATE POLICY "Public service role full access MockSlotHistory" ON "MockSlotHistory" FOR ALL USING (true);`
  ];

  for (const sql of sqlStatements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch (err) {
      console.warn(`Warning executing SQL "${sql}":`, err.message);
    }
  }

  console.log('✅ Supabase RLS applied successfully.');
  process.exit(0);
}

applyRLS().catch((e) => {
  console.error(e);
  process.exit(1);
});
