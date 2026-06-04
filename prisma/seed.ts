import { PrismaClient } from '@prisma/client';
import { createHash } from 'crypto';
import { v4 as uuidv4 } from 'uuid';

const prisma = new PrismaClient();

function generateApiKey(): string {
  return `fsk_${uuidv4().replace(/-/g, '')}`;
}

function hashApiKey(apiKey: string): string {
  return createHash('sha256').update(apiKey).digest('hex');
}

async function main() {
  console.log('🌱 Seeding database...');

  // Create default storage (idempotent)
  const storage = await prisma.storage.upsert({
    where: { name: 'default' },
    update: {},
    create: {
      name: 'default',
      bucket: process.env.AWS_S3_BUCKET || 'my-file-service-bucket',
      region: process.env.AWS_REGION || 'us-east-1',
    },
  });

  console.log(`✅ Storage: ${storage.name} (${storage.id})`);

  // Create default admin client (idempotent — lookup by fixed name)
  const existingAdmin = await prisma.client.findFirst({
    where: { name: 'Default Client', isAdmin: true },
  });

  if (existingAdmin) {
    console.log(`ℹ️  Admin client already exists: "${existingAdmin.name}" (${existingAdmin.id}). API Key not shown for security.`);
    return;
  }

  const apiKey = generateApiKey();
  const client = await prisma.client.create({
    data: {
      name: 'Default Client',
      apiKeyHash: hashApiKey(apiKey),
      active: true,
      isAdmin: true,
    },
  });

  console.log(`✅ Client created: ${client.name} (${client.id})`);
  console.log(`🔑 API Key: ${apiKey}`);
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
