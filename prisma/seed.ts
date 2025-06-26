import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🇵🇬 Initializing Clean PNG Road Construction System...');

  // Create default project
  const project = await prisma.project.upsert({
    where: { id: 'maria-pori-project' },
    update: {},
    create: {
      id: 'maria-pori-project',
      name: 'Maria Pori Road Construction',
      description: '15km road construction project connecting remote communities in Central Province, Papua New Guinea.',
      sponsor: 'ITCFA - Exxon Mobile',
      startDate: new Date('2024-01-01'),
      estimatedEndDate: new Date('2024-12-31'),
      totalDistance: 15000, // 15km in meters
    },
  });

  console.log('✅ Project created:', project.name);

  // Create ONLY the initial admin user - no demo users
  const adminPassword = await bcrypt.hash('Admin123!', 10);

  const admin = await prisma.user.upsert({
    where: { email: 'admin@connectpng.com' },
    update: {
      name: 'System Administrator',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
    create: {
      name: 'System Administrator',
      email: 'admin@connectpng.com',
      password: adminPassword,
      role: 'ADMIN',
      isActive: true,
    },
  });

  console.log('✅ Admin user created:', admin.email);

  // NO demo users, NO sample GPS data - clean production system
  console.log('✅ Clean database ready - use admin panel to create users');
  console.log('🔑 Login: admin@connectpng.com / Admin123!');
  console.log('🎉 PNG Road Construction System ready for production use!');
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
