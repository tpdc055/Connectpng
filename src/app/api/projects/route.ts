import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
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
      provinceId,
      startDate,
      estimatedEndDate,
      fundingSource,
      governmentPriority
    } = await request.json();

    // Validate required fields
    if (!name || !name.trim()) {
      return NextResponse.json({ error: 'Project name is required' }, { status: 400 });
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

    // Create new project
    const newProject = await prisma.project.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        totalDistance: totalDistance || null,
        sponsor: sponsor?.trim() || null,
        teamLead: teamLead?.trim() || null,
        projectType: projectType || 'ROAD_CONSTRUCTION',
        status: status || 'PLANNING',
        latitude: latitude !== null && latitude !== undefined ? Number(latitude) : null,
        longitude: longitude !== null && longitude !== undefined ? Number(longitude) : null,
        provinceId: provinceId || null,
        startDate: startDate ? new Date(startDate) : null,
        estimatedEndDate: estimatedEndDate ? new Date(estimatedEndDate) : null,
        fundingSource: fundingSource?.trim() || null,
        governmentPriority: governmentPriority || null,
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

    // Log the creation
    await prisma.activity.create({
      data: {
        type: 'PROJECT_CREATED',
        description: `New project "${name}" created`,
        metadata: JSON.stringify({
          projectId: newProject.id,
          createdBy: user.name,
          province: newProject.province?.name,
          coordinates: latitude && longitude ? { latitude, longitude } : null,
        }),
        userId: user.id,
        projectId: newProject.id,
      },
    });

    console.log(`✅ Project created: ${name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Project created successfully',
      project: newProject,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating project:', error);
    return NextResponse.json({
      error: 'Failed to create project',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch projects with enhanced multi-project data
    const projects = await prisma.project.findMany({
      include: {
        // Province information
        province: {
          select: {
            id: true,
            name: true,
            code: true,
            region: true,
            capital: true,
          },
        },
        // Road sections with contractor assignments
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
        // Contractor projects
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
        // Count aggregations
        _count: {
          select: {
            gpsPoints: true,
            activities: true,
            roadSections: true,
            contractorProjects: true,
            userAccess: true,
          },
        },
        // GPS points for progress calculation
        gpsPoints: {
          select: {
            phase: true,
            side: true,
            distance: true,
            status: true,
            contractorId: true,
            sectionId: true,
          },
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Calculate enhanced progress statistics for each project
    const projectsWithStats = projects.map(project => {
      const gpsPoints = project.gpsPoints;

      // Calculate traditional phase progress (for backward compatibility)
      const phaseStats = {
        DRAIN: {
          left: gpsPoints
            .filter(p => p.phase === 'DRAIN' && p.side === 'LEFT')
            .reduce((sum, p) => sum + (p.distance || 0), 0),
          right: gpsPoints
            .filter(p => p.phase === 'DRAIN' && p.side === 'RIGHT')
            .reduce((sum, p) => sum + (p.distance || 0), 0),
        },
        BASKET: {
          left: gpsPoints
            .filter(p => p.phase === 'BASKET' && p.side === 'LEFT')
            .reduce((sum, p) => sum + (p.distance || 0), 0),
          right: gpsPoints
            .filter(p => p.phase === 'BASKET' && p.side === 'RIGHT')
            .reduce((sum, p) => sum + (p.distance || 0), 0),
        },
        SEALING: {
          left: gpsPoints
            .filter(p => p.phase === 'SEALING' && p.side === 'LEFT')
            .reduce((sum, p) => sum + (p.distance || 0), 0),
          right: gpsPoints
            .filter(p => p.phase === 'SEALING' && p.side === 'RIGHT')
            .reduce((sum, p) => sum + (p.distance || 0), 0),
        },
      };

      // Calculate section-based progress
      const sectionProgress = project.roadSections.map(section => ({
        id: section.id,
        name: section.sectionName,
        progress: section.progressPercentage || 0,
        status: section.status,
        contractor: section.assignedContractor?.name,
        startKm: section.startKm,
        endKm: section.endKm,
        totalLength: section.totalLength,
      }));

      // Calculate overall project progress
      let overallProgress = 0;
      if (project.roadSections.length > 0) {
        // Use road sections progress if available
        const totalSectionProgress = project.roadSections.reduce(
          (sum, section) => sum + (section.progressPercentage || 0),
          0
        );
        overallProgress = totalSectionProgress / project.roadSections.length;
      } else {
        // Fallback to GPS-based calculation
        const totalCompleted = Object.values(phaseStats).reduce(
          (total, phase) => total + phase.left + phase.right,
          0
        );
        const totalExpected = (project.totalDistance || 15000) * 2 * 3; // 2 sides * 3 phases
        overallProgress = totalExpected > 0 ? (totalCompleted / totalExpected) * 100 : 0;
      }

      // Calculate contractor performance
      const contractorStats = project.contractorProjects.map(cp => ({
        contractor: cp.contractor,
        sectionsAssigned: project.roadSections.filter(
          rs => rs.assignedContractorId === cp.contractorId
        ).length,
        performanceRating: cp.performanceRating || 0,
        contractValue: cp.contractValue || 0,
        contractStatus: cp.contractStatus,
      }));

      return {
        ...project,
        stats: {
          phaseStats,
          sectionProgress,
          contractorStats,
          overallProgress: Math.min(Math.max(overallProgress, 0), 100),
          pointCounts: project._count,
          completedSections: project.roadSections.filter(rs => rs.status === 'COMPLETED').length,
          activeSections: project.roadSections.filter(rs => rs.status === 'CONSTRUCTION').length,
        },
        gpsPoints: undefined, // Remove detailed GPS points from response
      };
    });

    return NextResponse.json({ projects: projectsWithStats });
  } catch (error) {
    console.error('Error fetching enhanced projects:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
