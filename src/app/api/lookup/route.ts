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
    const type = url.searchParams.get('type');

    // If specific type requested, return only that
    if (type) {
      let data;
      switch (type) {
        case 'projectTypes':
          data = await prisma.projectType.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
          });
          break;
        case 'projectStatuses':
          data = await prisma.projectStatus.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
          });
          break;
        case 'specializations':
          data = await prisma.specialization.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
          });
          break;
        case 'certificationLevels':
          data = await prisma.certificationLevel.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
          });
          break;
        case 'contractStatuses':
          data = await prisma.contractStatus.findMany({
            where: { isActive: true },
            orderBy: { name: 'asc' }
          });
          break;
        // Dynamic monitoring lookup tables
        case 'fundingSources':
          data = await prisma.fundingSource.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
          });
          break;
        case 'reportTypes':
          data = await prisma.reportType.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
          });
          break;
        case 'milestoneCategories':
          data = await prisma.milestoneCategory.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
          });
          break;
        case 'scheduleStatuses':
          data = await prisma.scheduleStatus.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
          });
          break;
        case 'milestoneStatuses':
          data = await prisma.milestoneStatus.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
          });
          break;
        case 'fundingStatuses':
          data = await prisma.fundingStatus.findMany({
            where: { isActive: true },
            orderBy: { sortOrder: 'asc' }
          });
          break;
        default:
          return NextResponse.json({ error: 'Invalid lookup type' }, { status: 400 });
      }

      return NextResponse.json({ data, type });
    }

    // Return all lookup data
    const [
      projectTypes,
      projectStatuses,
      specializations,
      certificationLevels,
      contractStatuses,
      // Dynamic monitoring lookup tables
      fundingSources,
      reportTypes,
      milestoneCategories,
      scheduleStatuses,
      milestoneStatuses,
      fundingStatuses
    ] = await Promise.all([
      prisma.projectType.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      }),
      prisma.projectStatus.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      }),
      prisma.specialization.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      }),
      prisma.certificationLevel.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      }),
      prisma.contractStatus.findMany({
        where: { isActive: true },
        orderBy: { name: 'asc' }
      }),
      // Dynamic monitoring lookup tables
      prisma.fundingSource.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.reportType.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.milestoneCategory.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.scheduleStatus.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.milestoneStatus.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      }),
      prisma.fundingStatus.findMany({
        where: { isActive: true },
        orderBy: { sortOrder: 'asc' }
      })
    ]);

    return NextResponse.json({
      projectTypes,
      projectStatuses,
      specializations,
      certificationLevels,
      contractStatuses,
      // Dynamic monitoring lookup tables
      fundingSources,
      reportTypes,
      milestoneCategories,
      scheduleStatuses,
      milestoneStatuses,
      fundingStatuses,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching lookup data:', error);
    return NextResponse.json({
      error: 'Failed to fetch lookup data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const { type, name, description, color, requirements, icon, code, frequency, sortOrder } = await request.json();

    if (!type || !name) {
      return NextResponse.json({ error: 'Type and name are required' }, { status: 400 });
    }

    let result;
    switch (type) {
      case 'projectType':
        result = await prisma.projectType.create({
          data: { name: name.trim(), description: description?.trim() || null }
        });
        break;
      case 'projectStatus':
        result = await prisma.projectStatus.create({
          data: {
            name: name.trim(),
            description: description?.trim() || null,
            color: color?.trim() || null
          }
        });
        break;
      case 'specialization':
        result = await prisma.specialization.create({
          data: { name: name.trim(), description: description?.trim() || null }
        });
        break;
      case 'certificationLevel':
        result = await prisma.certificationLevel.create({
          data: {
            name: name.trim(),
            description: description?.trim() || null,
            requirements: requirements?.trim() || null
          }
        });
        break;
      case 'contractStatus':
        result = await prisma.contractStatus.create({
          data: {
            name: name.trim(),
            description: description?.trim() || null,
            color: color?.trim() || null
          }
        });
        break;
      // Dynamic monitoring lookup tables
      case 'fundingSource':
        result = await prisma.fundingSource.create({
          data: {
            name: name.trim(),
            code: code?.trim() || name.trim().toUpperCase().replace(/\s+/g, '_'),
            description: description?.trim() || null,
            color: color?.trim() || '#3B82F6',
            sortOrder: sortOrder || 0
          }
        });
        break;
      case 'reportType':
        result = await prisma.reportType.create({
          data: {
            name: name.trim(),
            code: code?.trim() || name.trim().toUpperCase().replace(/\s+/g, '_'),
            description: description?.trim() || null,
            frequency: frequency?.trim() || null,
            sortOrder: sortOrder || 0
          }
        });
        break;
      case 'milestoneCategory':
        result = await prisma.milestoneCategory.create({
          data: {
            name: name.trim(),
            code: code?.trim() || name.trim().toUpperCase().replace(/\s+/g, '_'),
            description: description?.trim() || null,
            icon: icon?.trim() || 'Target',
            color: color?.trim() || '#3B82F6',
            sortOrder: sortOrder || 0
          }
        });
        break;
      case 'scheduleStatus':
        result = await prisma.scheduleStatus.create({
          data: {
            name: name.trim(),
            code: code?.trim() || name.trim().toUpperCase().replace(/\s+/g, '_'),
            description: description?.trim() || null,
            color: color?.trim() || '#3B82F6',
            icon: icon?.trim() || 'Clock',
            sortOrder: sortOrder || 0
          }
        });
        break;
      case 'milestoneStatus':
        result = await prisma.milestoneStatus.create({
          data: {
            name: name.trim(),
            code: code?.trim() || name.trim().toUpperCase().replace(/\s+/g, '_'),
            description: description?.trim() || null,
            color: color?.trim() || '#3B82F6',
            icon: icon?.trim() || 'Clock',
            sortOrder: sortOrder || 0
          }
        });
        break;
      case 'fundingStatus':
        result = await prisma.fundingStatus.create({
          data: {
            name: name.trim(),
            code: code?.trim() || name.trim().toUpperCase().replace(/\s+/g, '_'),
            description: description?.trim() || null,
            color: color?.trim() || '#3B82F6',
            sortOrder: sortOrder || 0
          }
        });
        break;
      default:
        return NextResponse.json({ error: 'Invalid lookup type' }, { status: 400 });
    }

    console.log(`✅ Created ${type}: ${name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: `${type} created successfully`,
      data: result,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating lookup data:', error);
    return NextResponse.json({
      error: 'Failed to create lookup data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
