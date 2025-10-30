import 'dotenv/config';
import { PrismaClient, UserRole } from '../generated/prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting seed...');

  // Create ADMIN
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@hijauin.com' },
    update: {},
    create: {
      email: 'admin@hijauin.com',
      username: 'admin',
      password: adminPassword,
      nama_panggilan: 'Admin',
      role: UserRole.ADMIN,
    },
  });
  console.log('✅ Admin created:', admin.email);

  // Create test USER - Arya Fathdillah
  const aryaPassword = await bcrypt.hash('arya123', 10);
  const arya = await prisma.user.upsert({
    where: { email: 'coderea9@gmail.com' },
    update: {},
    create: {
      email: 'coderea9@gmail.com',
      username: 'aryafath',
      password: aryaPassword,
      nama_panggilan: 'Arya Fathdillah',
      role: UserRole.USER,
    },
  });
  console.log('✅ Test User (Arya) created:', arya.email);

  // Create regular USER for testing
  const userPassword = await bcrypt.hash('user123', 10);
  const user = await prisma.user.upsert({
    where: { email: 'user@hijauin.com' },
    update: {},
    create: {
      email: 'user@hijauin.com',
      username: 'testuser',
      password: userPassword,
      nama_panggilan: 'Test User',
      role: UserRole.USER,
    },
  });
  console.log('✅ User created:', user.email);

  console.log('🎉 Seed completed!');
  console.log('\n📝 Test Credentials:');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('ADMIN:');
  console.log('  Email: admin@hijauin.com');
  console.log('  Password: admin123');
  console.log('\nTEST USER (Arya Fathdillah):');
  console.log('  Email: coderea9@gmail.com');
  console.log('  Password: arya123');
  console.log('\nREGULAR USER:');
  console.log('  Email: user@hijauin.com');
  console.log('  Password: user123');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
}

main()
  .catch((e) => {
    console.error('❌ Seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
