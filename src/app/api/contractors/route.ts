import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const search = url.searchParams.get('search');
    const specialization = url.searchParams.get('specialization');
    const isActive = url.searchParams.get('isActive');

    // Build search conditions
    const whereConditions: any = {};

    if (search) {
      whereConditions.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { licenseNumber: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (specialization) {
      whereConditions.specializations = {
        has: specialization
      };
    }

    if (isActive !== null) {
      whereConditions.isActive = isActive === 'true';
    }

    // Fetch contractors with project assignments
    const contractors = await prisma.contractor.findMany({
      where: whereConditions,
      include: {
        projectAssignments: {
          include: {
            project: {
              select: {
                id: true,
                name: true,
                status: true,
                province: {
                  select: { name: true }
                }
              }
            }
          }
        },
        roadSections: {
          include: {
            project: {
              select: { name: true }
            }
          }
        },
        _count: {
          select: {
            projectAssignments: true,
            roadSections: true,
            gpsPoints: true
          }
        }
      },
      orderBy: [
        { isActive: 'desc' },
        { name: 'asc' }
      ]
    });

    // Calculate additional metrics
    const contractorsWithMetrics = contractors.map(contractor => {
      const activeProjects = contractor.projectAssignments.filter(
        pa => pa.contractStatus === 'ACTIVE'
      ).length;

      const totalContractValue = contractor.projectAssignments.reduce(
        (sum, pa) => sum + (pa.contractValue || 0), 0
      );

      const averageRating = contractor.projectAssignments.length > 0
        ? contractor.projectAssignments
            .filter(pa => pa.performanceRating)
            .reduce((sum, pa) => sum + (pa.performanceRating || 0), 0) /
          contractor.projectAssignments.filter(pa => pa.performanceRating).length
        : 0;

      return {
        ...contractor,
        metrics: {
          activeProjects,
          totalContractValue,
          averageRating: Math.round(averageRating * 100) / 100,
          totalProjects: contractor._count.projectAssignments,
          assignedSections: contractor._count.roadSections
        }
      };
    });

    return NextResponse.json({
      contractors: contractorsWithMetrics,
      total: contractorsWithMetrics.length,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching contractors:', error);
    return NextResponse.json({
      error: 'Failed to fetch contractors',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin or Manager access required' }, { status: 401 });
    }

    const {
      name,
      licenseNumber,
      contactPerson,
      email,
      phone,
      address,
      specializations,
      activeProvinces,
      certificationLevel,
      establishedDate
    } = await request.json();

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Contractor name is required' }, { status: 400 });
    }

    // Check if contractor with same name or license exists
    const existingContractor = await prisma.contractor.findFirst({
      where: {
        OR: [
          { name: { equals: name.trim(), mode: 'insensitive' } },
          ...(licenseNumber ? [{ licenseNumber: licenseNumber.trim() }] : [])
        ]
      }
    });

    if (existingContractor) {
      return NextResponse.json({
        error: 'Contractor with this name or license number already exists'
      }, { status: 400 });
    }

    // Create new contractor
    const newContractor = await prisma.contractor.create({
      data: {
        name: name.trim(),
        licenseNumber: licenseNumber?.trim() || null,
        contactPerson: contactPerson?.trim() || null,
        email: email?.trim() || null,
        phone: phone?.trim() || null,
        address: address?.trim() || null,
        specializations: specializations || [],
        activeProvinces: activeProvinces || [],
        certificationLevel: certificationLevel?.trim() || null,
        establishedDate: establishedDate ? new Date(establishedDate) : null,
        isActive: true
      },
      include: {
        _count: {
          select: {
            projectAssignments: true,
            roadSections: true
          }
        }
      }
    });

    console.log(`✅ Contractor created: ${name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Contractor created successfully',
      contractor: newContractor,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating contractor:', error);
    return NextResponse.json({
      error: 'Failed to create contractor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
