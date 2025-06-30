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
    const projectId = url.searchParams.get('projectId');
    const fundingSource = url.searchParams.get('fundingSource');
    const startDate = url.searchParams.get('startDate');
    const endDate = url.searchParams.get('endDate');

    // Build where clause
    const where: any = {};
    if (projectId) where.projectId = projectId;
    if (fundingSource) where.fundingSource = fundingSource;

    // Fetch project funding sources
    const projectFunding = await prisma.projectFunding.findMany({
      where,
      include: {
        project: {
          select: {
            id: true,
            name: true,
            projectCode: true,
            province: true,
            totalLength: true
          }
        },
        transactions: {
          where: startDate || endDate ? {
            transactionDate: {
              ...(startDate && { gte: new Date(startDate) }),
              ...(endDate && { lte: new Date(endDate) })
            }
          } : undefined,
          orderBy: { transactionDate: 'desc' }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    // Calculate summary statistics
    const summary = {
      totalAllocated: 0,
      totalReleased: 0,
      totalUtilized: 0,
      totalCommitted: 0,
      utilizationRate: 0,
      releaseRate: 0,
      commitmentRate: 0,
      pendingClaims: 0,
      fundingSourcesCount: 0
    };

    projectFunding.forEach(funding => {
      summary.totalAllocated += Number(funding.budgetAllocated);
      summary.totalReleased += Number(funding.fundsReleased);
      summary.totalUtilized += Number(funding.fundsUtilized);
      summary.totalCommitted += Number(funding.fundsCommitted);
      summary.pendingClaims += Number(funding.pendingClaims);
    });

    summary.fundingSourcesCount = projectFunding.length;
    summary.utilizationRate = summary.totalReleased > 0 ? (summary.totalUtilized / summary.totalReleased) * 100 : 0;
    summary.releaseRate = summary.totalAllocated > 0 ? (summary.totalReleased / summary.totalAllocated) * 100 : 0;
    summary.commitmentRate = summary.totalReleased > 0 ? (summary.totalCommitted / summary.totalReleased) * 100 : 0;

    // Funding sources breakdown
    const fundingBreakdown = await prisma.projectFunding.groupBy({
      by: ['fundingSource'],
      where,
      _sum: {
        budgetAllocated: true,
        fundsReleased: true,
        fundsUtilized: true,
        fundsCommitted: true,
        pendingClaims: true
      },
      _count: {
        id: true
      }
    });

    return NextResponse.json({
      projectFunding,
      summary,
      fundingBreakdown,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching financial data:', error);
    return NextResponse.json({
      error: 'Failed to fetch financial data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'FINANCE_OFFICER' && user.role !== 'PROGRAM_MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized - Finance access required' }, { status: 401 });
    }

    const {
      projectId,
      fundingSource,
      sourceName,
      budgetAllocated,
      fundsReleased,
      fundsUtilized,
      fundsCommitted,
      status,
      paymentCertificates,
      pendingClaims,
      notes,
      // Transaction details
      transactionType,
      transactionAmount,
      transactionDescription,
      referenceNumber,
      approvedBy
    } = await request.json();

    // Validate required fields
    if (!projectId || !fundingSource || !budgetAllocated) {
      return NextResponse.json({
        error: 'Missing required fields: projectId, fundingSource, budgetAllocated'
      }, { status: 400 });
    }

    // Validate project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Calculate utilization rate
    const utilizationRate = Number(fundsReleased || 0) > 0 ?
      (Number(fundsUtilized || 0) / Number(fundsReleased || 0)) * 100 : 0;

    // Create or update project funding
    const projectFunding = await prisma.projectFunding.create({
      data: {
        projectId,
        fundingSource,
        sourceName: sourceName || fundingSource,
        budgetAllocated: Number(budgetAllocated),
        fundsReleased: Number(fundsReleased || 0),
        fundsUtilized: Number(fundsUtilized || 0),
        fundsCommitted: Number(fundsCommitted || 0),
        utilizationRate,
        status: status || 'ON_TRACK',
        paymentCertificates: Number(paymentCertificates || 0),
        pendingClaims: Number(pendingClaims || 0),
        notes: notes || null
      },
      include: {
        project: {
          select: { name: true, projectCode: true }
        }
      }
    });

    // Create transaction record if transaction details provided
    if (transactionType && transactionAmount) {
      await prisma.fundingTransaction.create({
        data: {
          fundingId: projectFunding.id,
          transactionType,
          amount: Number(transactionAmount),
          description: transactionDescription || `${transactionType} transaction`,
          transactionDate: new Date(),
          referenceNumber: referenceNumber || null,
          approvedBy: approvedBy || user.name
        }
      });
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        projectId,
        userId: user.id,
        activityType: 'FUNDING_UPDATED',
        category: 'Financial Tracking',
        description: `${fundingSource} funding updated: ${new Intl.NumberFormat('en-US', {
          style: 'currency',
          currency: 'USD'
        }).format(Number(budgetAllocated))} allocated`,
        metadata: {
          fundingId: projectFunding.id,
          fundingSource,
          budgetAllocated: Number(budgetAllocated)
        }
      }
    });

    console.log(`✅ Financial tracking updated for project ${project.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Financial tracking updated successfully',
      projectFunding,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error updating financial tracking:', error);
    return NextResponse.json({
      error: 'Failed to update financial tracking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || (user.role !== 'ADMIN' && user.role !== 'FINANCE_OFFICER' && user.role !== 'PROGRAM_MANAGER')) {
      return NextResponse.json({ error: 'Unauthorized - Finance access required' }, { status: 401 });
    }

    const {
      id,
      fundsReleased,
      fundsUtilized,
      fundsCommitted,
      status,
      paymentCertificates,
      pendingClaims,
      notes
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Funding ID is required' }, { status: 400 });
    }

    // Check if funding record exists
    const existingFunding = await prisma.projectFunding.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!existingFunding) {
      return NextResponse.json({ error: 'Funding record not found' }, { status: 404 });
    }

    // Calculate new utilization rate
    const newFundsReleased = fundsReleased !== undefined ? Number(fundsReleased) : Number(existingFunding.fundsReleased);
    const newFundsUtilized = fundsUtilized !== undefined ? Number(fundsUtilized) : Number(existingFunding.fundsUtilized);
    const utilizationRate = newFundsReleased > 0 ? (newFundsUtilized / newFundsReleased) * 100 : 0;

    const updatedFunding = await prisma.projectFunding.update({
      where: { id },
      data: {
        ...(fundsReleased !== undefined && { fundsReleased: Number(fundsReleased) }),
        ...(fundsUtilized !== undefined && { fundsUtilized: Number(fundsUtilized) }),
        ...(fundsCommitted !== undefined && { fundsCommitted: Number(fundsCommitted) }),
        utilizationRate,
        ...(status !== undefined && { status }),
        ...(paymentCertificates !== undefined && { paymentCertificates: Number(paymentCertificates) }),
        ...(pendingClaims !== undefined && { pendingClaims: Number(pendingClaims) }),
        ...(notes !== undefined && { notes })
      },
      include: {
        project: { select: { name: true, projectCode: true } }
      }
    });

    console.log(`✅ Financial tracking updated for project ${existingFunding.project.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Financial tracking updated successfully',
      projectFunding: updatedFunding,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating financial tracking:', error);
    return NextResponse.json({
      error: 'Failed to update financial tracking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const url = new URL(request.url);
    const id = url.searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Funding ID is required' }, { status: 400 });
    }

    // Check if funding record exists
    const funding = await prisma.projectFunding.findUnique({
      where: { id },
      include: { project: true }
    });

    if (!funding) {
      return NextResponse.json({ error: 'Funding record not found' }, { status: 404 });
    }

    // Delete associated transactions first
    await prisma.fundingTransaction.deleteMany({
      where: { fundingId: id }
    });

    // Delete funding record
    await prisma.projectFunding.delete({
      where: { id }
    });

    console.log(`✅ Financial tracking deleted for project ${funding.project.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Financial tracking deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting financial tracking:', error);
    return NextResponse.json({
      error: 'Failed to delete financial tracking',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
