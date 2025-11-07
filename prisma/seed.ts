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

  // Create sample waste locations with proper structure
  const wasteLocations = [
    {
      id: 'seed-tps-kampus-ump',
      name: 'TPS Kampus UMP',
      description: 'Tempat Pembuangan Sampah utama kampus Universitas Muhammadiyah Purwokerto',
      address: 'Kampus 1 UMP, Jl. Raya Dukuhwaluh, Purwokerto',
      latitude: -7.4291,
      longitude: 109.2320,
      categories: ['ORGANIK', 'ANORGANIK'],
      image_url: 'https://images.unsplash.com/photo-1532996122724-e3c354a0b15b',
    },
    {
      id: 'seed-bank-sampah-hijau-lestari',
      name: 'Bank Sampah Hijau Lestari',
      description: 'Bank sampah yang menerima sampah organik untuk kompos',
      address: 'Jl. Gatot Subroto, Purwokerto Timur',
      latitude: -7.4250,
      longitude: 109.2400,
      categories: ['ORGANIK'],
      image_url: 'https://images.unsplash.com/photo-1607962837359-5e7e89f86776',
    },
    {
      id: 'seed-tpa-regional-purwokerto',
      name: 'TPA Regional Purwokerto',
      description: 'Tempat Pembuangan Akhir regional untuk wilayah Purwokerto',
      address: 'Jl. Raya TPA, Desa Sumampir, Purwokerto',
      latitude: -7.4500,
      longitude: 109.2500,
      categories: ['ANORGANIK'],
      image_url: 'https://images.unsplash.com/photo-1611284446314-60a58ac0deb9',
    },
    {
      id: 'seed-pusat-pengolahan-limbah-b3',
      name: 'Pusat Pengolahan Limbah B3',
      description: 'Fasilitas khusus untuk pengolahan limbah Bahan Berbahaya dan Beracun',
      address: 'Kawasan Industri Wiradesa, Purwokerto',
      latitude: -7.4100,
      longitude: 109.2200,
      categories: ['B3'],
      image_url: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64',
    },
    {
      id: 'seed-tps-pasar-wage',
      name: 'TPS Pasar Wage',
      description: 'Tempat sampah untuk pasar tradisional Wage',
      address: 'Pasar Wage, Purwokerto Barat',
      latitude: -7.4280,
      longitude: 109.2380,
      categories: ['ORGANIK', 'ANORGANIK'],
      image_url: 'https://images.unsplash.com/photo-1604719312566-8912e9227c6a',
    },
  ];

  for (const location of wasteLocations) {
    const { categories, ...locationData } = location;
    
    // Check if waste location already exists
    const existingLocation = await prisma.wasteLocation.findUnique({
      where: { id: location.id },
    });

    if (existingLocation) {
      console.log('⏭️  Waste location already exists:', location.name);
      continue;
    }

    // Create waste location with categories
    await prisma.wasteLocation.create({
      data: {
        ...locationData,
        createdBy: admin.id,
        categories: {
          create: categories.map((category) => ({ category: category as any })),
        },
      },
    });
    
    console.log('✅ Waste location created:', location.name, `(${categories.join(', ')})`);
  }

  console.log('\n🎉 Seed completed!');
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
  console.log('  - TPS Kampus UMP (ORGANIK, ANORGANIK)');
  console.log('  - Bank Sampah Hijau Lestari (ORGANIK)');
  console.log('  - TPA Regional Purwokerto (ANORGANIK)');
  console.log('  - Pusat Pengolahan Limbah B3 (B3)');
  console.log('  - TPS Pasar Wage (ORGANIK, ANORGANIK)');
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
