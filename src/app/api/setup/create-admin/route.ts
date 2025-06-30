import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password } = await request.json();

    // Validate required fields
    if (!name || !email || !password) {
      return NextResponse.json({
        error: 'Name, email, and password are required'
      }, { status: 400 });
    }

    // Validate password strength
    if (password.length < 8) {
      return NextResponse.json({
        error: 'Password must be at least 8 characters long'
      }, { status: 400 });
    }

    // Check if any admin users already exist (security check)
    const existingAdminCount = await prisma.user.count({
      where: { role: 'ADMIN' }
    });

    if (existingAdminCount > 0) {
      return NextResponse.json({
        error: 'Admin user already exists. Use user management to create additional administrators.'
      }, { status: 403 });
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create the admin user
    const adminUser = await prisma.user.create({
      data: {
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password: hashedPassword,
        role: 'ADMIN',
        isActive: true
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        isActive: true,
        createdAt: true
      }
    });

    console.log(`✅ Initial admin user created: ${adminUser.email}`);

    return NextResponse.json({
      success: true,
      message: 'Initial administrator account created successfully',
      admin: adminUser,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error creating admin user:', error);

    // Handle unique constraint violation (email already exists)
    if (error instanceof Error && error.message.includes('Unique constraint')) {
      return NextResponse.json({
        error: 'An account with this email address already exists'
      }, { status: 409 });
    }

    return NextResponse.json({
      error: 'Failed to create administrator account',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
