import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const project = await prisma.project.findUnique({
      where: { id: params.id },
      include: {
        province: {
          select: {
            id: true,
            name: true,
            code: true,
            region: true,
            capital: true,
          },
        },
        roadSections: {
          include: {
            assignedContractor: {
              select: {
                id: true,
                name: true,
                licenseNumber: true,
                certificationLevel: true,
              },
            },
          },
          orderBy: {
            startKm: 'asc',
          },
        },
        contractorProjects: {
          include: {
            contractor: {
              select: {
                id: true,
                name: true,
                licenseNumber: true,
                specializations: true,
                certificationLevel: true,
              },
            },
          },
        },
        _count: {
          select: {
            gpsPoints: true,
            activities: true,
            roadSections: true,
            contractorProjects: true,
            userAccess: true,
          },
        },
      },
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({ project });
  } catch (error) {
    console.error('Error fetching project:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin or Manager access required' }, { status: 401 });
    }

    const {
      name,
      description,
      totalDistance,
      sponsor,
      teamLead,
      projectType,
      status,
      latitude,
      longitude,
      provinceId
    } = await request.json();

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
    }

    // Check if project exists
    const existingProject = await prisma.project.findUnique({
      where: { id: params.id }
    });

    if (!existingProject) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Validate province exists if provided
    if (provinceId) {
      const province = await prisma.province.findUnique({
        where: { id: provinceId }
      });
      if (!province) {
        return NextResponse.json({ error: 'Invalid province' }, { status: 400 });
      }
    }

    // Validate coordinates if provided
    if ((latitude !== null && latitude !== undefined) || (longitude !== null && longitude !== undefined)) {
      if (latitude === null || latitude === undefined || longitude === null || longitude === undefined) {
        return NextResponse.json({
          error: 'Both latitude and longitude must be provided together'
        }, { status: 400 });
      }

      // Validate coordinate ranges for PNG
      if (latitude < -12 || latitude > -1 || longitude < 140 || longitude > 160) {
        return NextResponse.json({
          error: 'Coordinates must be within Papua New Guinea boundaries'
        }, { status: 400 });
      }
    }

    // Update project
    const updatedProject = await prisma.project.update({
      where: { id: params.id },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        totalDistance: totalDistance || null,
        sponsor: sponsor?.trim() || null,
        teamLead: teamLead?.trim() || null,
        projectType: projectType || null,
        status: status || existingProject.status,
        latitude: latitude !== null && latitude !== undefined ? Number(latitude) : null,
        longitude: longitude !== null && longitude !== undefined ? Number(longitude) : null,
        provinceId: provinceId || null,
        updatedAt: new Date(),
      },
      include: {
        province: {
          select: {
            id: true,
            name: true,
            code: true,
            region: true,
            capital: true,
          },
        },
        _count: {
          select: {
            gpsPoints: true,
            activities: true,
            roadSections: true,
            contractorProjects: true,
          },
        },
      },
    });

    // Log the update
    await prisma.activity.create({
      data: {
        type: 'PROJECT_UPDATED',
        description: `Project "${name}" details updated`,
        metadata: JSON.stringify({
          projectId: params.id,
          updatedFields: Object.keys({ name, description, totalDistance, sponsor, teamLead, projectType, status, latitude, longitude, provinceId }).filter(key =>
            (key === 'latitude' || key === 'longitude') ?
              (latitude !== null && longitude !== null) :
              eval(key) !== null && eval(key) !== undefined
          ),
          coordinates: latitude && longitude ? { latitude, longitude } : null,
          province: updatedProject.province?.name,
        }),
        userId: user.id,
        projectId: params.id,
      },
    });

    console.log(`✅ Project updated: ${name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Project updated successfully',
      project: updatedProject,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating project:', error);
    return NextResponse.json({
      error: 'Failed to update project',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}
