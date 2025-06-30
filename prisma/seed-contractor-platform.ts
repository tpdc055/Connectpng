import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// PNG Provinces Data (Essential Infrastructure)
const pngProvinces = [
  { name: "Central Province", code: "CPV", region: "Papua", capital: "Port Moresby", population: 269000 },
  { name: "Western Province", code: "WPV", region: "Papua", capital: "Daru", population: 201000 },
  { name: "Gulf Province", code: "GPV", region: "Papua", capital: "Kerema", population: 106000 },
  { name: "Milne Bay Province", code: "MBP", region: "Papua", capital: "Alotau", population: 276000 },
  { name: "Northern Province", code: "NPV", region: "Papua", capital: "Popondetta", population: 186000 },
  { name: "Southern Highlands", code: "SHP", region: "Highlands", capital: "Mendi", population: 510000 },
  { name: "Western Highlands", code: "WHP", region: "Highlands", capital: "Mount Hagen", population: 362000 },
  { name: "Eastern Highlands", code: "EHP", region: "Highlands", capital: "Goroka", population: 579000 },
  { name: "Simbu Province", code: "SIM", region: "Highlands", capital: "Kundiawa", population: 259000 },
  { name: "Enga Province", code: "ENG", region: "Highlands", capital: "Wabag", population: 432000 },
  { name: "Morobe Province", code: "MOR", region: "Momase", capital: "Lae", population: 674000 },
  { name: "Madang Province", code: "MAD", region: "Momase", capital: "Madang", population: 493000 },
  { name: "East Sepik Province", code: "ESP", region: "Momase", capital: "Wewak", population: 433000 },
  { name: "West Sepik Province", code: "WSP", region: "Momase", capital: "Vanimo", population: 248000 },
  { name: "Manus Province", code: "MAN", region: "Islands", capital: "Lorengau", population: 60000 },
  { name: "New Ireland Province", code: "NIP", region: "Islands", capital: "Kavieng", population: 194000 },
  { name: "East New Britain", code: "ENB", region: "Islands", capital: "Kokopo", population: 328000 },
  { name: "West New Britain", code: "WNB", region: "Islands", capital: "Kimbe", population: 264000 },
  { name: "Bougainville", code: "ARB", region: "Islands", capital: "Buka", population: 300000 },
  { name: "Hela Province", code: "HLA", region: "Highlands", capital: "Tari", population: 249000 },
  { name: "Jiwaka Province", code: "JWK", region: "Highlands", capital: "Kurumul", population: 343000 },
  { name: "National Capital District", code: "NCD", region: "Papua", capital: "Port Moresby", population: 364000 }
];

// Default Construction Activities (Available to all contractors)
const defaultActivities = [
  {
    name: "Line Drain Construction",
    description: "Construction of roadside drainage systems",
    color: "#3b82f6"
  },
  {
    name: "Basket Construction",
    description: "Road base preparation and basket installation",
    color: "#10b981"
  },
  {
    name: "Road Sealing",
    description: "Final road surface sealing and finishing",
    color: "#ef4444"
  },
  {
    name: "Bridge Construction",
    description: "Bridge and culvert construction",
    color: "#8b5cf6"
  },
  {
    name: "Access Road Development",
    description: "Community and rural access road construction",
    color: "#f59e0b"
  },
  {
    name: "Highway Upgrade",
    description: "Major highway improvement and upgrade works",
    color: "#06b6d4"
  }
];

async function main() {
  console.log('🇵🇬 Setting up PNG Contractor Self-Service Platform...');

  // Create PNG Provinces (Essential Infrastructure)
  console.log('📍 Creating PNG Provinces...');
  const provinces = [];
  for (const provinceData of pngProvinces) {
    const province = await prisma.province.upsert({
      where: { code: provinceData.code },
      update: provinceData,
      create: provinceData,
    });
    provinces.push(province);
    console.log(`✅ ${province.name}`);
  }

  // Create Platform Admin (System Administrator)
  console.log('👤 Creating Platform Administrator...');
  const hashedPassword = await bcrypt.hash('Admin123!', 10);

  const platformAdmin = await prisma.user.upsert({
    where: { email: 'admin@connectpng.com' },
    update: {
      name: 'PNG Infrastructure Platform Admin',
      role: 'ADMIN',
      password: hashedPassword,
    },
    create: {
      name: 'PNG Infrastructure Platform Admin',
      email: 'admin@connectpng.com',
      password: hashedPassword,
      role: 'ADMIN',
    },
  });
  console.log(`✅ Platform admin: ${platformAdmin.name}`);

  // Create Default Construction Activities (Available to all contractors)
  console.log('🏗️ Creating Default Construction Activities...');
  for (const activityData of defaultActivities) {
    await prisma.constructionActivity.upsert({
      where: { name: activityData.name },
      update: activityData,
      create: {
        ...activityData,
        createdBy: platformAdmin.id,
      },
    });
    console.log(`✅ Activity: ${activityData.name}`);
  }

  console.log('\n🎉 PNG Contractor Platform Setup Complete!');
  console.log('\n📋 Platform Ready For:');
  console.log('   ✅ 22 PNG Provinces configured');
  console.log('   ✅ 6 Default construction activities available');
  console.log('   ✅ Contractor self-registration enabled');
  console.log('   ✅ Self-service project creation ready');

  console.log('\n🏗️ Next Steps for Contractors:');
  console.log('   1. Register contractor account');
  console.log('   2. Create 3-4 road projects in their provinces');
  console.log('   3. Add team members and assign roles');
  console.log('   4. Start GPS tracking and progress monitoring');

  console.log('\n🔑 Platform Admin Login:');
  console.log('   Email: admin@connectpng.com');
  console.log('   Password: Admin123!');

  console.log('\n🇵🇬 Ready for PNG-wide contractor deployment!');
}

main()
  .catch((e) => {
    console.error('❌ Error setting up platform:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
