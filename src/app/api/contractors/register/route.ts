import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(request: NextRequest) {
  try {
    const data = await request.json();
    const {
      name,
      licenseNumber,
      contactPerson,
      email,
      phone,
      address,
      establishedDate,
      certificationLevel,
      specializations,
      activeProvinces,
      // User account creation data
      userPassword = 'TempPass123!', // Default password, contractor should change
    } = data;

    // Validate required fields
    if (!name || !licenseNumber || !email || !contactPerson) {
      return NextResponse.json(
        { error: 'Missing required fields: name, licenseNumber, email, contactPerson' },
        { status: 400 }
      );
    }

    // Check if contractor with this license number already exists
    const existingContractor = await prisma.contractor.findUnique({
      where: { licenseNumber }
    });

    if (existingContractor) {
      return NextResponse.json(
        { error: 'Contractor with this license number already exists' },
        { status: 409 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    if (existingUser) {
      return NextResponse.json(
        { error: 'User with this email address already exists' },
        { status: 409 }
      );
    }

    // Create contractor and user account in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // Create the contractor
      const contractor = await tx.contractor.create({
        data: {
          name,
          licenseNumber,
          contactPerson,
          email,
          phone,
          address,
          establishedDate: establishedDate ? new Date(establishedDate) : null,
          certificationLevel,
          specializations: Array.isArray(specializations) ? specializations : [],
          activeProvinces: Array.isArray(activeProvinces) ? activeProvinces : [],
          isActive: true,
        },
      });

      // Create user account for contractor (Manager role)
      const hashedPassword = await bcrypt.hash(userPassword, 10);
      const user = await tx.user.create({
        data: {
          name: contactPerson,
          email,
          password: hashedPassword,
          role: 'MANAGER', // Contractors get Manager role by default
          isActive: true,
        },
      });

      return { contractor, user };
    });

    // Return success response (don't include password hash)
    return NextResponse.json({
      success: true,
      message: 'Contractor registered successfully',
      contractor: {
        id: result.contractor.id,
        name: result.contractor.name,
        licenseNumber: result.contractor.licenseNumber,
        contactPerson: result.contractor.contactPerson,
        email: result.contractor.email,
        certificationLevel: result.contractor.certificationLevel,
        specializations: result.contractor.specializations,
        activeProvinces: result.contractor.activeProvinces,
      },
      user: {
        id: result.user.id,
        name: result.user.name,
        email: result.user.email,
        role: result.user.role,
      },
      temporaryPassword: userPassword, // Send back for initial setup
    });
  } catch (error) {
    console.error('Error registering contractor:', error);
    return NextResponse.json(
      { error: 'Internal server error during contractor registration' },
      { status: 500 }
    );
  }
}

// GET endpoint to fetch contractors (for admin/public listing)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const provinceId = searchParams.get('provinceId');
    const certificationLevel = searchParams.get('certificationLevel');
    const specialization = searchParams.get('specialization');

    // Build filter conditions
    const whereConditions: any = {
      isActive: true,
    };

    if (provinceId) {
      whereConditions.activeProvinces = {
        has: provinceId,
      };
    }

    if (certificationLevel) {
      whereConditions.certificationLevel = certificationLevel;
    }

    if (specialization) {
      whereConditions.specializations = {
        has: specialization,
      };
    }

    // Fetch contractors with project statistics
    const contractors = await prisma.contractor.findMany({
      where: whereConditions,
      include: {
        _count: {
          select: {
            projectAssignments: true,
            roadSections: true,
          },
        },
        projectAssignments: {
          select: {
            project: {
              select: {
                name: true,
                status: true,
              },
            },
            contractStatus: true,
            performanceRating: true,
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calculate contractor statistics
    const contractorsWithStats = contractors.map(contractor => {
      const activeProjects = contractor.projectAssignments.filter(
        pa => pa.contractStatus === 'ACTIVE'
      ).length;

      const averageRating = contractor.projectAssignments.length > 0
        ? contractor.projectAssignments
            .filter(pa => pa.performanceRating)
            .reduce((sum, pa) => sum + (pa.performanceRating || 0), 0) /
          contractor.projectAssignments.filter(pa => pa.performanceRating).length
        : 0;

      return {
        id: contractor.id,
        name: contractor.name,
        licenseNumber: contractor.licenseNumber,
        contactPerson: contractor.contactPerson,
        email: contractor.email,
        phone: contractor.phone,
        certificationLevel: contractor.certificationLevel,
        specializations: contractor.specializations,
        activeProvinces: contractor.activeProvinces,
        establishedDate: contractor.establishedDate,
        stats: {
          totalProjects: contractor._count.projectAssignments,
          activeProjects,
          roadSections: contractor._count.roadSections,
          averageRating: Math.round(averageRating * 100) / 100,
        },
      };
    });

    return NextResponse.json({
      contractors: contractorsWithStats,
      summary: {
        total: contractors.length,
        byCertification: {
          A: contractors.filter(c => c.certificationLevel === 'A').length,
          B: contractors.filter(c => c.certificationLevel === 'B').length,
          C: contractors.filter(c => c.certificationLevel === 'C').length,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching contractors:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
