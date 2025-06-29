import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    // Check if system settings exist and setup is complete
    const systemSettings = await prisma.systemSettings.findFirst({
      orderBy: { createdAt: 'desc' }
    });

    // Check if any admin users exist
    const adminCount = await prisma.user.count({
      where: { role: 'ADMIN', isActive: true }
    });

    // System requires setup if:
    // 1. No system settings exist, OR
    // 2. System settings exist but isSetupComplete is false, OR
    // 3. No active admin users exist
    const requiresSetup = !systemSettings ||
                         !systemSettings.isSetupComplete ||
                         adminCount === 0;

    return NextResponse.json({
      requiresSetup,
      hasSystemSettings: !!systemSettings,
      isSetupComplete: systemSettings?.isSetupComplete || false,
      adminUsersCount: adminCount,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error checking setup status:', error);

    // If database connection fails, assume setup is required
    return NextResponse.json({
      requiresSetup: true,
      hasSystemSettings: false,
      isSetupComplete: false,
      adminUsersCount: 0,
      error: 'Database connection failed - setup required',
      timestamp: new Date().toISOString()
    });
  }
}
