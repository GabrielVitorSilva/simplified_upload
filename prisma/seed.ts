import { PrismaClient } from '@prisma/client';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Create default storage
  const storage = await prisma.storage.upsert({
    where: { name: 'default' },
    update: {},
    create: {
      name: 'default',
      bucket: process.env.AWS_S3_BUCKET || 'my-file-service-bucket',
      region: process.env.AWS_REGION || 'us-east-1',
    },
  });

  console.log(`✅ Storage created: ${storage.name} (${storage.id})`);

  // Create default client
  const apiKey = uuidv4();
  const client = await prisma.client.upsert({
    where: { apiKey },
    update: {},
    create: {
      name: 'Default Client',
      apiKey,
      active: true,
    },
  });

  console.log(`✅ Client created: ${client.name}`);
  console.log(`🔑 API Key: ${client.apiKey}`);
  console.log('\n⚠️  Save this API Key — it will not be shown again.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
