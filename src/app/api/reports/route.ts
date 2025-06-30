import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const reportType = searchParams.get('type') || 'overview';
    const projectId = searchParams.get('projectId');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const provinceId = searchParams.get('provinceId');
    const contractorId = searchParams.get('contractorId');

    let reportData: any = {};

    switch (reportType) {
      case 'overview':
        reportData = await generateOverviewReport(projectId, startDate, endDate);
        break;
      case 'progress':
        reportData = await generateProgressReport(projectId, startDate, endDate);
        break;
      case 'contractor':
        reportData = await generateContractorReport(contractorId, projectId, startDate, endDate);
        break;
      case 'province':
        reportData = await generateProvinceReport(provinceId, startDate, endDate);
        break;
      case 'gps':
        reportData = await generateGPSReport(projectId, startDate, endDate);
        break;
      case 'financial':
        reportData = await generateFinancialReport(projectId, startDate, endDate);
        break;
      default:
        return NextResponse.json({ error: 'Invalid report type' }, { status: 400 });
    }

    return NextResponse.json({
      reportType,
      generatedAt: new Date().toISOString(),
      filters: {
        projectId,
        startDate,
        endDate,
        provinceId,
        contractorId,
      },
      data: reportData,
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Report generation functions
async function generateOverviewReport(projectId?: string, startDate?: string, endDate?: string) {
  const whereConditions: any = {};

  if (projectId) {
    whereConditions.id = projectId;
  }

  if (startDate && endDate) {
    whereConditions.createdAt = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const projects = await prisma.project.findMany({
    where: whereConditions,
    include: {
      province: true,
      roadSections: {
        include: {
          assignedContractor: true,
        },
      },
      contractorProjects: {
        include: {
          contractor: true,
        },
      },
      _count: {
        select: {
          gpsPoints: true,
          roadSections: true,
          contractorProjects: true,
        },
      },
    },
  });

  const totalProjects = projects.length;
  const totalContractors = await prisma.contractor.count({ where: { isActive: true } });
  const totalProvinces = await prisma.province.count();
  const totalGpsPoints = await prisma.gpsPoint.count();

  const projectsByStatus = projects.reduce((acc, project) => {
    acc[project.status] = (acc[project.status] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const projectsByProvince = projects.reduce((acc, project) => {
    const provinceName = project.province?.name || 'Unknown';
    acc[provinceName] = (acc[provinceName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return {
    summary: {
      totalProjects,
      totalContractors,
      totalProvinces,
      totalGpsPoints,
    },
    projectsByStatus,
    projectsByProvince,
    projects: projects.map(project => ({
      id: project.id,
      name: project.name,
      province: project.province?.name,
      status: project.status,
      progress: calculateProjectProgress(project.roadSections),
      totalSections: project.roadSections.length,
      activeContractors: project.contractorProjects.filter(cp => cp.contractStatus === 'ACTIVE').length,
      gpsPoints: project._count.gpsPoints,
    })),
  };
}

async function generateProgressReport(projectId?: string, startDate?: string, endDate?: string) {
  const whereConditions: any = {};

  if (projectId) whereConditions.projectId = projectId;
  if (startDate && endDate) {
    whereConditions.timestamp = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const gpsPoints = await prisma.gpsPoint.findMany({
    where: whereConditions,
    include: {
      project: {
        select: { name: true, province: { select: { name: true } } },
      },
      user: {
        select: { name: true, role: true },
      },
      section: {
        select: { sectionName: true },
      },
    },
    orderBy: { timestamp: 'desc' },
  });

  const progressByPhase = gpsPoints.reduce((acc, point) => {
    if (!acc[point.phase]) {
      acc[point.phase] = { count: 0, totalDistance: 0 };
    }
    acc[point.phase].count++;
    acc[point.phase].totalDistance += point.distance || 0;
    return acc;
  }, {} as Record<string, { count: number; totalDistance: number }>);

  const progressByProject = gpsPoints.reduce((acc, point) => {
    const projectName = point.project.name;
    if (!acc[projectName]) {
      acc[projectName] = { count: 0, totalDistance: 0, phases: {} };
    }
    acc[projectName].count++;
    acc[projectName].totalDistance += point.distance || 0;

    if (!acc[projectName].phases[point.phase]) {
      acc[projectName].phases[point.phase] = 0;
    }
    acc[projectName].phases[point.phase]++;

    return acc;
  }, {} as Record<string, any>);

  return {
    totalGpsPoints: gpsPoints.length,
    progressByPhase,
    progressByProject,
    recentActivity: gpsPoints.slice(0, 50).map(point => ({
      id: point.id,
      project: point.project.name,
      province: point.project.province?.name,
      phase: point.phase,
      side: point.side,
      distance: point.distance,
      status: point.status,
      user: point.user.name,
      section: point.section?.sectionName,
      timestamp: point.timestamp,
    })),
  };
}

async function generateContractorReport(contractorId?: string, projectId?: string, startDate?: string, endDate?: string) {
  const whereConditions: any = { isActive: true };

  if (contractorId) {
    whereConditions.id = contractorId;
  }

  const contractors = await prisma.contractor.findMany({
    where: whereConditions,
    include: {
      projectAssignments: {
        where: projectId ? { projectId } : {},
        include: {
          project: {
            select: { name: true, province: { select: { name: true } } },
          },
        },
      },
      roadSections: {
        where: projectId ? { projectId } : {},
        include: {
          project: {
            select: { name: true },
          },
        },
      },
      _count: {
        select: {
          projectAssignments: true,
          roadSections: true,
        },
      },
    },
  });

  return {
    totalContractors: contractors.length,
    contractors: contractors.map(contractor => {
      const activeProjects = contractor.projectAssignments.filter(
        pa => pa.contractStatus === 'ACTIVE'
      );

      const averageRating = contractor.projectAssignments.length > 0
        ? contractor.projectAssignments
            .filter(pa => pa.performanceRating)
            .reduce((sum, pa) => sum + (pa.performanceRating || 0), 0) /
          contractor.projectAssignments.filter(pa => pa.performanceRating).length
        : 0;

      const totalContractValue = contractor.projectAssignments.reduce(
        (sum, pa) => sum + (pa.contractValue || 0), 0
      );

      return {
        id: contractor.id,
        name: contractor.name,
        licenseNumber: contractor.licenseNumber,
        certificationLevel: contractor.certificationLevel,
        specializations: contractor.specializations,
        activeProjects: activeProjects.length,
        totalProjects: contractor._count.projectAssignments,
        assignedSections: contractor._count.roadSections,
        averageRating: Math.round(averageRating * 100) / 100,
        totalContractValue,
        projects: contractor.projectAssignments.map(pa => ({
          project: pa.project.name,
          province: pa.project.province?.name,
          contractValue: pa.contractValue,
          status: pa.contractStatus,
          rating: pa.performanceRating,
        })),
      };
    }),
  };
}

async function generateProvinceReport(provinceId?: string, startDate?: string, endDate?: string) {
  const whereConditions: any = {};

  if (provinceId) {
    whereConditions.id = provinceId;
  }

  const provinces = await prisma.province.findMany({
    where: whereConditions,
    include: {
      projects: {
        include: {
          roadSections: true,
          contractorProjects: {
            include: {
              contractor: true,
            },
          },
          _count: {
            select: {
              gpsPoints: true,
            },
          },
        },
      },
    },
    orderBy: { name: 'asc' },
  });

  return {
    totalProvinces: provinces.length,
    provinces: provinces.map(province => {
      const totalProjects = province.projects.length;
      const activeProjects = province.projects.filter(p => p.status === 'IN_PROGRESS').length;
      const completedProjects = province.projects.filter(p => p.status === 'COMPLETED').length;
      const totalSections = province.projects.reduce((sum, p) => sum + p.roadSections.length, 0);
      const totalGpsPoints = province.projects.reduce((sum, p) => sum + p._count.gpsPoints, 0);
      const uniqueContractors = new Set(
        province.projects.flatMap(p => p.contractorProjects.map(cp => cp.contractorId))
      ).size;

      return {
        id: province.id,
        name: province.name,
        code: province.code,
        region: province.region,
        capital: province.capital,
        population: province.population,
        infrastructure: {
          totalProjects,
          activeProjects,
          completedProjects,
          totalSections,
          totalGpsPoints,
          uniqueContractors,
        },
        projects: province.projects.map(project => ({
          name: project.name,
          status: project.status,
          totalDistance: project.totalDistance,
          sections: project.roadSections.length,
          gpsPoints: project._count.gpsPoints,
        })),
      };
    }),
  };
}

async function generateGPSReport(projectId?: string, startDate?: string, endDate?: string) {
  const whereConditions: any = {};

  if (projectId) whereConditions.projectId = projectId;
  if (startDate && endDate) {
    whereConditions.timestamp = {
      gte: new Date(startDate),
      lte: new Date(endDate),
    };
  }

  const gpsPoints = await prisma.gpsPoint.findMany({
    where: whereConditions,
    include: {
      project: {
        select: { name: true, province: { select: { name: true } } },
      },
      user: {
        select: { name: true, role: true },
      },
      section: {
        select: { sectionName: true },
      },
      contractor: {
        select: { name: true },
      },
    },
    orderBy: { timestamp: 'desc' },
  });

  const coordinateBounds = gpsPoints.length > 0 ? {
    north: Math.max(...gpsPoints.map(p => p.latitude)),
    south: Math.min(...gpsPoints.map(p => p.latitude)),
    east: Math.max(...gpsPoints.map(p => p.longitude)),
    west: Math.min(...gpsPoints.map(p => p.longitude)),
  } : null;

  return {
    totalPoints: gpsPoints.length,
    coordinateBounds,
    accuracyStats: {
      averageAccuracy: gpsPoints.reduce((sum, p) => sum + (p.accuracy || 0), 0) / gpsPoints.length,
      highAccuracyPoints: gpsPoints.filter(p => (p.accuracy || 0) < 5).length,
    },
    pointsByPhase: gpsPoints.reduce((acc, point) => {
      acc[point.phase] = (acc[point.phase] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    pointsByStatus: gpsPoints.reduce((acc, point) => {
      acc[point.status] = (acc[point.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    dailyActivity: getDailyActivity(gpsPoints),
    exportData: gpsPoints.map(point => ({
      id: point.id,
      project: point.project.name,
      province: point.project.province?.name,
      latitude: point.latitude,
      longitude: point.longitude,
      elevation: point.elevation,
      accuracy: point.accuracy,
      phase: point.phase,
      side: point.side,
      distance: point.distance,
      status: point.status,
      notes: point.notes,
      user: point.user.name,
      section: point.section?.sectionName,
      contractor: point.contractor?.name,
      timestamp: point.timestamp,
    })),
  };
}

async function generateFinancialReport(projectId?: string, startDate?: string, endDate?: string) {
  const whereConditions: any = {};

  if (projectId) whereConditions.projectId = projectId;

  const contractorProjects = await prisma.contractorProject.findMany({
    where: whereConditions,
    include: {
      project: {
        select: { name: true, province: { select: { name: true } } },
      },
      contractor: {
        select: { name: true, certificationLevel: true },
      },
    },
  });

  const roadSections = await prisma.roadSection.findMany({
    where: projectId ? { projectId } : {},
    include: {
      project: {
        select: { name: true },
      },
      assignedContractor: {
        select: { name: true },
      },
    },
  });

  const totalContractValue = contractorProjects.reduce(
    (sum, cp) => sum + (cp.contractValue || 0), 0
  );

  const totalBudgetAllocated = roadSections.reduce(
    (sum, rs) => sum + (rs.budgetAllocated || 0), 0
  );

  const totalBudgetSpent = roadSections.reduce(
    (sum, rs) => sum + (rs.budgetSpent || 0), 0
  );

  return {
    overview: {
      totalContractValue,
      totalBudgetAllocated,
      totalBudgetSpent,
      budgetUtilization: totalBudgetAllocated > 0
        ? (totalBudgetSpent / totalBudgetAllocated) * 100
        : 0,
      remainingBudget: totalBudgetAllocated - totalBudgetSpent,
    },
    contractorBreakdown: contractorProjects.map(cp => ({
      project: cp.project.name,
      province: cp.project.province?.name,
      contractor: cp.contractor.name,
      certification: cp.contractor.certificationLevel,
      contractValue: cp.contractValue,
      status: cp.contractStatus,
      performanceRating: cp.performanceRating,
    })),
    sectionBreakdown: roadSections.map(rs => ({
      project: rs.project.name,
      section: rs.sectionName,
      contractor: rs.assignedContractor?.name,
      budgetAllocated: rs.budgetAllocated,
      budgetSpent: rs.budgetSpent,
      utilization: rs.budgetAllocated > 0
        ? ((rs.budgetSpent || 0) / rs.budgetAllocated) * 100
        : 0,
      progress: rs.progressPercentage,
    })),
  };
}

// Helper functions
function calculateProjectProgress(roadSections: any[]): number {
  if (roadSections.length === 0) return 0;

  const totalProgress = roadSections.reduce(
    (sum, section) => sum + (section.progressPercentage || 0),
    0
  );

  return totalProgress / roadSections.length;
}

function getDailyActivity(gpsPoints: any[]): Record<string, number> {
  return gpsPoints.reduce((acc, point) => {
    const date = new Date(point.timestamp).toISOString().split('T')[0];
    acc[date] = (acc[date] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}
