import { PrismaClient } from '@prisma/client'
// @ts-ignore
import { PrismaBetterSqlite3 } from '@prisma/adapter-better-sqlite3'
import Database from 'better-sqlite3'

async function main() {
  console.log('Testing Prisma Settings Update with Adapter...');
  
  const dbUrl = 'prisma/dev.db'; // Adjust path if needed
  const sqlite = new Database(dbUrl);
  // @ts-ignore
  const adapter = new PrismaBetterSqlite3(sqlite);
  const prisma = new PrismaClient({ adapter });

  try {
    const currentSettings = await prisma.settings.findFirst();
    console.log('Current Settings:', currentSettings);

    const updateData = {
      storeName: 'KK Dimsum Test',
      bankAccounts: '[]'
    };

    let result;
    if (currentSettings) {
      console.log('Updating settings with ID:', currentSettings.id);
      result = await prisma.settings.update({
        where: { id: currentSettings.id },
        data: updateData
      });
    } else {
      console.log('Creating new settings...');
      result = await prisma.settings.create({
        data: updateData,
      });
    }
    console.log('Result:', result);
  } catch (error) {
    console.error('Test Error:', error);
  } finally {
    await prisma.$disconnect();
  }
}

main();
