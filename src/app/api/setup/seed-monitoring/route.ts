import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    // Check if monitoring lookups already exist
    const existingFundingSources = await prisma.fundingSource.count();
    if (existingFundingSources > 0) {
      return NextResponse.json({
        message: 'Monitoring lookup data already exists',
        skipped: true
      });
    }

    // Seed Generic Funding Sources (User can customize)
    const fundingSources = [
      { name: 'Government Funding', code: 'GOVERNMENT', description: 'National or regional government funding', color: '#16A34A', sortOrder: 1 },
      { name: 'Corporate Partner 1', code: 'CORPORATE_1', description: 'Corporate funding source 1', color: '#2563EB', sortOrder: 2 },
      { name: 'Corporate Partner 2', code: 'CORPORATE_2', description: 'Corporate funding source 2', color: '#7C3AED', sortOrder: 3 },
      { name: 'Development Bank', code: 'DEV_BANK', description: 'Development bank funding', color: '#EA580C', sortOrder: 4 },
      { name: 'International Bank', code: 'INTL_BANK', description: 'International financial institution', color: '#DC2626', sortOrder: 5 },
      { name: 'International Agency', code: 'INTL_AGENCY', description: 'International development agency', color: '#EC4899', sortOrder: 6 },
      { name: 'Bilateral Aid', code: 'BILATERAL', description: 'Bilateral development assistance', color: '#EAB308', sortOrder: 7 },
      { name: 'Other Sources', code: 'OTHER', description: 'Other funding sources', color: '#6B7280', sortOrder: 8 }
    ];

    // Seed Report Types
    const reportTypes = [
      { name: 'Daily Report', code: 'DAILY', description: 'Daily construction progress report', frequency: 'DAILY', sortOrder: 1 },
      { name: 'Weekly Report', code: 'WEEKLY', description: 'Weekly progress summary report', frequency: 'WEEKLY', sortOrder: 2 },
      { name: 'Monthly Report', code: 'MONTHLY', description: 'Monthly comprehensive progress report', frequency: 'MONTHLY', sortOrder: 3 },
      { name: 'Quarterly Report', code: 'QUARTERLY', description: 'Quarterly program review report', frequency: 'QUARTERLY', sortOrder: 4 },
      { name: 'Ad-hoc Report', code: 'AD_HOC', description: 'Special or emergency progress report', frequency: 'AD_HOC', sortOrder: 5 }
    ];

    // Seed Generic Milestone Categories (User can customize)
    const milestoneCategories = [
      { name: 'Design Completion', code: 'DESIGN_COMPLETION', description: 'Engineering design and planning phase completion', icon: 'FileCheck', color: '#2563EB', sortOrder: 1 },
      { name: 'Mobilization', code: 'MOBILIZATION', description: 'Contractor mobilization and site setup', icon: 'Truck', color: '#7C3AED', sortOrder: 2 },
      { name: 'Construction Start', code: 'CONSTRUCTION_START', description: 'Physical construction work commencement', icon: 'HardHat', color: '#EA580C', sortOrder: 3 },
      { name: 'Sectional Completion', code: 'SECTIONAL_COMPLETION', description: 'Individual section completion', icon: 'Target', color: '#16A34A', sortOrder: 4 },
      { name: 'Practical Completion', code: 'PRACTICAL_COMPLETION', description: 'Practical completion of construction works', icon: 'CheckCircle', color: '#6366F1', sortOrder: 5 },
      { name: 'Handover', code: 'HANDOVER', description: 'Formal handover to client', icon: 'Flag', color: '#DC2626', sortOrder: 6 },
      { name: 'Quality Inspection', code: 'QUALITY_INSPECTION', description: 'Quality audits and inspections', icon: 'Clipboard', color: '#EAB308', sortOrder: 7 },
      { name: 'Environmental Clearance', code: 'ENVIRONMENTAL_CLEARANCE', description: 'Environmental compliance and clearance', icon: 'Leaf', color: '#059669', sortOrder: 8 }
    ];

    // Seed Schedule Statuses
    const scheduleStatuses = [
      { name: 'On Track', code: 'ON_TRACK', description: 'Project progress is on schedule', color: '#16A34A', icon: 'CheckCircle', sortOrder: 1 },
      { name: 'Behind Schedule', code: 'BEHIND', description: 'Project progress is behind schedule', color: '#DC2626', icon: 'AlertTriangle', sortOrder: 2 },
      { name: 'Ahead of Schedule', code: 'AHEAD', description: 'Project progress is ahead of schedule', color: '#2563EB', icon: 'TrendingUp', sortOrder: 3 },
      { name: 'Critical Delay', code: 'CRITICAL_DELAY', description: 'Project has critical delays requiring attention', color: '#7C2D12', icon: 'Clock', sortOrder: 4 }
    ];

    // Seed Milestone Statuses
    const milestoneStatuses = [
      { name: 'Not Started', code: 'NOT_STARTED', description: 'Milestone has not been started', color: '#6B7280', icon: 'Clock', sortOrder: 1 },
      { name: 'In Progress', code: 'IN_PROGRESS', description: 'Milestone is currently in progress', color: '#2563EB', icon: 'Target', sortOrder: 2 },
      { name: 'Completed', code: 'COMPLETED', description: 'Milestone has been completed', color: '#16A34A', icon: 'CheckCircle', sortOrder: 3 },
      { name: 'Delayed', code: 'DELAYED', description: 'Milestone is delayed beyond planned date', color: '#DC2626', icon: 'AlertTriangle', sortOrder: 4 }
    ];

    // Seed Funding Statuses
    const fundingStatuses = [
      { name: 'On Track', code: 'ON_TRACK', description: 'Funding utilization is on track', color: '#16A34A', sortOrder: 1 },
      { name: 'Over Budget', code: 'OVER_BUDGET', description: 'Funding is over allocated budget', color: '#DC2626', sortOrder: 2 },
      { name: 'Under Budget', code: 'UNDER_BUDGET', description: 'Funding utilization is under budget', color: '#2563EB', sortOrder: 3 },
      { name: 'Pending Release', code: 'PENDING_RELEASE', description: 'Waiting for funding release approval', color: '#EA580C', sortOrder: 4 },
      { name: 'Delayed', code: 'DELAYED', description: 'Funding release or utilization is delayed', color: '#7C3AED', sortOrder: 5 }
    ];

    // Create all lookup data
    const [
      createdFundingSources,
      createdReportTypes,
      createdMilestoneCategories,
      createdScheduleStatuses,
      createdMilestoneStatuses,
      createdFundingStatuses
    ] = await Promise.all([
      prisma.fundingSource.createMany({ data: fundingSources }),
      prisma.reportType.createMany({ data: reportTypes }),
      prisma.milestoneCategory.createMany({ data: milestoneCategories }),
      prisma.scheduleStatus.createMany({ data: scheduleStatuses }),
      prisma.milestoneStatus.createMany({ data: milestoneStatuses }),
      prisma.fundingStatus.createMany({ data: fundingStatuses })
    ]);

    console.log(`✅ Monitoring lookup data seeded by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Monitoring lookup data seeded successfully',
      created: {
        fundingSources: createdFundingSources.count,
        reportTypes: createdReportTypes.count,
        milestoneCategories: createdMilestoneCategories.count,
        scheduleStatuses: createdScheduleStatuses.count,
        milestoneStatuses: createdMilestoneStatuses.count,
        fundingStatuses: createdFundingStatuses.count
      },
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error seeding monitoring lookup data:', error);
    return NextResponse.json({
      error: 'Failed to seed monitoring lookup data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
