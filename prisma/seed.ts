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

  // Create sample waste locations
  const wasteLocations = [
    {
      name: 'TPS Kampus UMP',
      description: 'Tempat Pembuangan Sampah utama kampus Universitas Muhammadiyah Purwokerto',
      latitude: -7.4291,
      longitude: 109.2320,
      category: 'ANORGANIK' as const,
    },
    {
      name: 'Bank Sampah Hijau Lestari',
      description: 'Bank sampah yang menerima sampah organik untuk kompos',
      latitude: -7.4250,
      longitude: 109.2400,
      category: 'ORGANIK' as const,
    },
    {
      name: 'TPA Regional Purwokerto',
      description: 'Tempat Pembuangan Akhir regional untuk wilayah Purwokerto',
      latitude: -7.4500,
      longitude: 109.2500,
      category: 'ANORGANIK' as const,
    },
    {
      name: 'Pusat Pengolahan Limbah B3',
      description: 'Fasilitas khusus untuk pengolahan limbah Bahan Berbahaya dan Beracun',
      latitude: -7.4100,
      longitude: 109.2200,
      category: 'B3' as const,
    },
    {
      name: 'TPS Pasar Wage',
      description: 'Tempat sampah untuk pasar tradisional Wage',
      latitude: -7.4280,
      longitude: 109.2380,
      category: 'ORGANIK' as const,
    },
  ];

  for (const location of wasteLocations) {
    await prisma.wasteLocation.upsert({
      where: { 
        // Use compound unique constraint if exists, otherwise use id
        id: `seed-${location.name.toLowerCase().replace(/\s+/g, '-')}`,
      },
      update: {},
      create: {
        id: `seed-${location.name.toLowerCase().replace(/\s+/g, '-')}`,
        ...location,
        createdBy: admin.id,
      },
    });
    console.log('✅ Waste location created:', location.name);
  }

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
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📍 Sample Waste Locations:');
  console.log('  - TPS Kampus UMP (ANORGANIK)');
  console.log('  - Bank Sampah Hijau Lestari (ORGANIK)');
  console.log('  - TPA Regional Purwokerto (ANORGANIK)');
  console.log('  - Pusat Pengolahan Limbah B3 (B3)');
  console.log('  - TPS Pasar Wage (ORGANIK)');
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
