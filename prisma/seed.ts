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

  // Create sample eco-green products
  const products = [
    {
      id: 'seed-product-bamboo-toothbrush',
      name: 'Bamboo Toothbrush',
      description: 'Sikat gigi ramah lingkungan terbuat dari bambu organik',
      price: 25000,
      stock: 100,
      category: 'Personal Care',
      image_url: 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04',
    },
    {
      id: 'seed-product-reusable-bag',
      name: 'Reusable Shopping Bag',
      description: 'Tas belanja kain dapat digunakan berkali-kali, mengurangi plastik',
      price: 35000,
      stock: 150,
      category: 'Shopping',
      image_url: 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b',
    },
    {
      id: 'seed-product-steel-straw',
      name: 'Stainless Steel Straw Set',
      description: 'Set sedotan stainless steel dengan sikat pembersih',
      price: 45000,
      stock: 80,
      category: 'Kitchen',
      image_url: 'https://images.unsplash.com/photo-1593113598332-cd9d8c8f7e5c',
    },
    {
      id: 'seed-product-compost-bin',
      name: 'Home Compost Bin',
      description: 'Tempat kompos untuk mengolah sampah organik di rumah',
      price: 150000,
      stock: 50,
      category: 'Home & Garden',
      image_url: 'https://images.unsplash.com/photo-1585659722983-3a675dabf23d',
    },
    {
      id: 'seed-product-beeswax-wrap',
      name: 'Beeswax Food Wrap',
      description: 'Pembungkus makanan dari lilin lebah, alternatif plastik wrap',
      price: 55000,
      stock: 120,
      category: 'Kitchen',
      image_url: 'https://images.unsplash.com/photo-1610701596007-11502861dcfa',
    },
    {
      id: 'seed-product-solar-charger',
      name: 'Solar Power Bank',
      description: 'Power bank tenaga surya 20000mAh untuk charging eco-friendly',
      price: 250000,
      stock: 40,
      category: 'Electronics',
      image_url: 'https://images.unsplash.com/photo-1509390144451-c8c73ddc2b6c',
    },
    {
      id: 'seed-product-organic-soap',
      name: 'Organic Bar Soap',
      description: 'Sabun batangan organik tanpa kemasan plastik',
      price: 30000,
      stock: 200,
      category: 'Personal Care',
      image_url: 'https://images.unsplash.com/photo-1600857544200-242c2fc78e8a',
    },
    {
      id: 'seed-product-glass-bottle',
      name: 'Glass Water Bottle',
      description: 'Botol minum kaca dengan sleeve silikon, BPA free',
      price: 85000,
      stock: 90,
      category: 'Drinkware',
      image_url: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8',
    },
  ];

  for (const product of products) {
    const existingProduct = await prisma.product.findUnique({
      where: { id: product.id },
    });

    if (existingProduct) {
      console.log('⏭️  Product already exists:', product.name);
      continue;
    }

    await prisma.product.create({
      data: product,
    });

    console.log('✅ Product created:', product.name, `(${product.category})`);
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
  console.log('\n🛍️ Sample Eco-Green Products:');
  console.log('  - Bamboo Toothbrush (Rp 25.000)');
  console.log('  - Reusable Shopping Bag (Rp 35.000)');
  console.log('  - Stainless Steel Straw Set (Rp 45.000)');
  console.log('  - Home Compost Bin (Rp 150.000)');
  console.log('  - Beeswax Food Wrap (Rp 55.000)');
  console.log('  - Solar Power Bank (Rp 250.000)');
  console.log('  - Organic Bar Soap (Rp 30.000)');
  console.log('  - Glass Water Bottle (Rp 85.000)');
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
