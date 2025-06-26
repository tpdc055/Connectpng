import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// Import bcryptjs directly to avoid any conflicts
const bcrypt = require('bcryptjs');

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const setup = url.searchParams.get('setup');

    if (setup === 'true') {
      // Run database setup
      console.log('🇵🇬 Setting up PNG Road Construction Database...');

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

      // Check if any admin users exist
      const existingAdmins = await prisma.user.count({
        where: { role: 'ADMIN' }
      });

      let usersCreated = 0;
      let adminCredentials = null;

      if (existingAdmins === 0) {
        // Create initial admin user only
        const adminData = {
          name: 'System Administrator',
          email: 'admin@connectpng.com',
          password: 'Admin123!',
          role: 'ADMIN',
        };

        // Hash password using bcrypt directly
        const hashedPassword = await bcrypt.hash(adminData.password, 10);

        const admin = await prisma.user.create({
          data: {
            name: adminData.name,
            email: adminData.email,
            password: hashedPassword,
            role: adminData.role,
            isActive: true,
          },
        });

        usersCreated = 1;
        adminCredentials = {
          email: adminData.email,
          password: adminData.password
        };
        console.log(`✅ Initial admin created: ${admin.name} (${admin.email})`);
      } else {
        console.log('✅ Admin users already exist, skipping user creation');
      }

      return NextResponse.json({
        message: 'Database setup completed successfully!',
        details: {
          project: project.name,
          usersCreated,
          adminCreated: usersCreated > 0,
          adminCredentials: adminCredentials ? `${adminCredentials.email} / ${adminCredentials.password}` : 'Admin already exists',
          note: 'Use the admin panel to create additional users'
        },
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      message: 'Setup endpoint is working! Add ?setup=true to initialize database.',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return NextResponse.json({
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST() {
  try {
    console.log('🇵🇬 Setting up PNG Road Construction Database...');

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

    // Check if any admin users exist
    const existingAdmins = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    let usersCreated = 0;
    let adminCredentials = null;

    if (existingAdmins === 0) {
      // Create initial admin user only
      const adminData = {
        name: 'System Administrator',
        email: 'admin@connectpng.com',
        password: 'Admin123!',
        role: 'ADMIN',
      };

      // Hash password using bcrypt directly
      const hashedPassword = await bcrypt.hash(adminData.password, 10);

      const admin = await prisma.user.create({
        data: {
          name: adminData.name,
          email: adminData.email,
          password: hashedPassword,
          role: adminData.role,
          isActive: true,
        },
      });

      usersCreated = 1;
      adminCredentials = {
        email: adminData.email,
        password: adminData.password
      };
      console.log(`✅ Initial admin created: ${admin.name} (${admin.email})`);
    } else {
      console.log('✅ Admin users already exist, skipping user creation');
    }

    return NextResponse.json({
      message: 'Database setup completed successfully!',
      details: {
        project: project.name,
        usersCreated,
        adminCreated: usersCreated > 0,
        adminCredentials: adminCredentials ? `${adminCredentials.email} / ${adminCredentials.password}` : 'Admin already exists',
        note: 'Use the admin panel to create additional users'
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    return NextResponse.json({
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
