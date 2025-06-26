import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
// Import bcryptjs directly to avoid any conflicts
const bcrypt = require('bcryptjs');

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const action = url.searchParams.get('action');

    if (action === 'list') {
      // List all admin users
      const adminUsers = await prisma.user.findMany({
        where: { role: 'ADMIN' },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          isActive: true,
          createdAt: true,
          updatedAt: true
        }
      });

      return NextResponse.json({
        success: true,
        adminUsers,
        count: adminUsers.length,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'reset-admin') {
      // Reset admin@connectpng.com password to Admin123!
      const adminEmail = 'admin@connectpng.com';
      const newPassword = 'Admin123!';

      const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
      });

      if (existingAdmin) {
        // Hash the new password
        const hashedPassword = await bcrypt.hash(newPassword, 10);

        // Update the admin user
        const updatedAdmin = await prisma.user.update({
          where: { email: adminEmail },
          data: {
            password: hashedPassword,
            isActive: true,
            updatedAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Admin password reset successfully!',
          admin: {
            email: updatedAdmin.email,
            name: updatedAdmin.name,
            isActive: updatedAdmin.isActive
          },
          credentials: `${adminEmail} / ${newPassword}`,
          timestamp: new Date().toISOString()
        });
      } else {
        return NextResponse.json({
          success: false,
          error: 'Admin user not found',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }
    }

    if (action === 'force-recreate') {
      // Delete existing admin and create new one
      const adminEmail = 'admin@connectpng.com';
      const adminPassword = 'Admin123!';

      // Delete existing admin if exists
      await prisma.user.deleteMany({
        where: {
          email: adminEmail
        }
      });

      // Create new admin
      const hashedPassword = await bcrypt.hash(adminPassword, 10);
      const newAdmin = await prisma.user.create({
        data: {
          name: 'System Administrator',
          email: adminEmail,
          password: hashedPassword,
          role: 'ADMIN',
          isActive: true
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Admin user recreated successfully!',
        admin: {
          id: newAdmin.id,
          email: newAdmin.email,
          name: newAdmin.name,
          role: newAdmin.role,
          isActive: newAdmin.isActive
        },
        credentials: `${adminEmail} / ${adminPassword}`,
        timestamp: new Date().toISOString()
      });
    }

    if (action === 'create-mariapori-admin') {
      // Create admin@mariapori.com admin
      const adminEmail = 'admin@mariapori.com';
      const adminPassword = 'admin123';

      const existingAdmin = await prisma.user.findUnique({
        where: { email: adminEmail }
      });

      if (existingAdmin) {
        // Update existing user
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const updatedAdmin = await prisma.user.update({
          where: { email: adminEmail },
          data: {
            password: hashedPassword,
            role: 'ADMIN',
            isActive: true,
            updatedAt: new Date()
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Maria Pori admin updated successfully!',
          admin: {
            email: updatedAdmin.email,
            name: updatedAdmin.name,
            isActive: updatedAdmin.isActive
          },
          credentials: `${adminEmail} / ${adminPassword}`,
          timestamp: new Date().toISOString()
        });
      } else {
        // Create new admin
        const hashedPassword = await bcrypt.hash(adminPassword, 10);
        const newAdmin = await prisma.user.create({
          data: {
            name: 'Maria Pori Administrator',
            email: adminEmail,
            password: hashedPassword,
            role: 'ADMIN',
            isActive: true
          }
        });

        return NextResponse.json({
          success: true,
          message: 'Maria Pori admin created successfully!',
          admin: {
            id: newAdmin.id,
            email: newAdmin.email,
            name: newAdmin.name,
            role: newAdmin.role,
            isActive: newAdmin.isActive
          },
          credentials: `${adminEmail} / ${adminPassword}`,
          timestamp: new Date().toISOString()
        });
      }
    }

    return NextResponse.json({
      message: 'PNG Road Construction Admin Manager',
      availableActions: [
        'list - List all admin users',
        'reset-admin - Reset admin@connectpng.com password to Admin123!',
        'force-recreate - Delete and recreate admin@connectpng.com',
        'create-mariapori-admin - Create/update admin@mariapori.com with password admin123'
      ],
      usage: 'Add ?action=<action> to the URL',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Admin manager error:', error);
    return NextResponse.json({
      success: false,
      error: 'Admin management failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const { action, email, password } = await request.json();

    if (action === 'reset-password' && email && password) {
      // Reset specific user password
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (!existingUser) {
        return NextResponse.json({
          success: false,
          error: 'User not found',
          timestamp: new Date().toISOString()
        }, { status: 404 });
      }

      // Hash the new password
      const hashedPassword = await bcrypt.hash(password, 10);

      // Update the user
      const updatedUser = await prisma.user.update({
        where: { email },
        data: {
          password: hashedPassword,
          isActive: true,
          updatedAt: new Date()
        }
      });

      return NextResponse.json({
        success: true,
        message: 'Password reset successfully!',
        user: {
          email: updatedUser.email,
          name: updatedUser.name,
          role: updatedUser.role,
          isActive: updatedUser.isActive
        },
        credentials: `${email} / ${password}`,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      success: false,
      error: 'Invalid action or missing parameters',
      requiredFields: 'action, email, password',
      timestamp: new Date().toISOString()
    }, { status: 400 });

  } catch (error) {
    console.error('❌ Admin manager POST error:', error);
    return NextResponse.json({
      success: false,
      error: 'Admin management failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
