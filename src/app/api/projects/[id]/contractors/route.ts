import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

// Get contractors assigned to a project
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const projectId = params.id;

    // Get project with contractor assignments
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: {
        contractorProjects: {
          include: {
            contractor: {
              select: {
                id: true,
                name: true,
                licenseNumber: true,
                contactPerson: true,
                email: true,
                phone: true,
                specializations: true,
                certificationLevel: true,
                isActive: true
              }
            }
          }
        }
      }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    return NextResponse.json({
      project: {
        id: project.id,
        name: project.name
      },
      contractorAssignments: project.contractorProjects,
      totalContractValue: project.contractorProjects.reduce(
        (sum, cp) => sum + (cp.contractValue || 0), 0
      ),
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching project contractors:', error);
    return NextResponse.json({
      error: 'Failed to fetch project contractors',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Assign contractor to project
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin or Manager access required' }, { status: 401 });
    }

    const projectId = params.id;
    const {
      contractorId,
      contractValue,
      contractStartDate,
      contractEndDate,
      performanceBond,
      sections
    } = await request.json();

    // Validate required fields
    if (!contractorId) {
      return NextResponse.json({ error: 'Contractor ID is required' }, { status: 400 });
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      select: { id: true, name: true }
    });

    if (!project) {
      return NextResponse.json({ error: 'Project not found' }, { status: 404 });
    }

    // Check if contractor exists
    const contractor = await prisma.contractor.findUnique({
      where: { id: contractorId },
      select: { id: true, name: true, isActive: true }
    });

    if (!contractor) {
      return NextResponse.json({ error: 'Contractor not found' }, { status: 404 });
    }

    if (!contractor.isActive) {
      return NextResponse.json({ error: 'Contractor is not active' }, { status: 400 });
    }

    // Check if assignment already exists
    const existingAssignment = await prisma.contractorProject.findUnique({
      where: {
        contractorId_projectId: {
          contractorId,
          projectId
        }
      }
    });

    if (existingAssignment) {
      return NextResponse.json({
        error: 'Contractor is already assigned to this project'
      }, { status: 400 });
    }

    // Create contract assignment
    const contractAssignment = await prisma.contractorProject.create({
      data: {
        contractorId,
        projectId,
        contractValue: contractValue ? Number(contractValue) : null,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : null,
        contractEndDate: contractEndDate ? new Date(contractEndDate) : null,
        performanceBond: performanceBond ? Number(performanceBond) : null,
        sections: sections || [],
        contractStatus: 'ACTIVE'
      },
      include: {
        contractor: {
          select: {
            id: true,
            name: true,
            licenseNumber: true,
            certificationLevel: true
          }
        },
        project: {
          select: {
            id: true,
            name: true
          }
        }
      }
    });

    // Log the assignment
    await prisma.activity.create({
      data: {
        type: 'CONTRACTOR_ASSIGNED',
        description: `${contractor.name} assigned to ${project.name}`,
        metadata: JSON.stringify({
          contractorId,
          contractorName: contractor.name,
          contractValue,
          sections: sections?.length || 0
        }),
        userId: user.id,
        projectId
      }
    });

    console.log(`✅ Contractor assigned: ${contractor.name} to ${project.name} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Contractor assigned successfully',
      assignment: contractAssignment,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error assigning contractor:', error);
    return NextResponse.json({
      error: 'Failed to assign contractor',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// Update contract assignment
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user || !['ADMIN', 'MANAGER'].includes(user.role)) {
      return NextResponse.json({ error: 'Admin or Manager access required' }, { status: 401 });
    }

    const projectId = params.id;
    const {
      contractorId,
      contractValue,
      contractStartDate,
      contractEndDate,
      performanceBond,
      contractStatus,
      performanceRating,
      sections
    } = await request.json();

    // Find existing assignment
    const existingAssignment = await prisma.contractorProject.findUnique({
      where: {
        contractorId_projectId: {
          contractorId,
          projectId
        }
      }
    });

    if (!existingAssignment) {
      return NextResponse.json({ error: 'Contract assignment not found' }, { status: 404 });
    }

    // Update assignment
    const updatedAssignment = await prisma.contractorProject.update({
      where: {
        contractorId_projectId: {
          contractorId,
          projectId
        }
      },
      data: {
        contractValue: contractValue !== undefined ? Number(contractValue) : existingAssignment.contractValue,
        contractStartDate: contractStartDate ? new Date(contractStartDate) : existingAssignment.contractStartDate,
        contractEndDate: contractEndDate ? new Date(contractEndDate) : existingAssignment.contractEndDate,
        performanceBond: performanceBond !== undefined ? Number(performanceBond) : existingAssignment.performanceBond,
        contractStatus: contractStatus || existingAssignment.contractStatus,
        performanceRating: performanceRating !== undefined ? Number(performanceRating) : existingAssignment.performanceRating,
        sections: sections || existingAssignment.sections
      },
      include: {
        contractor: {
          select: {
            name: true,
            licenseNumber: true
          }
        },
        project: {
          select: {
            name: true
          }
        }
      }
    });

    console.log(`✅ Contract updated: ${updatedAssignment.contractor.name} - ${updatedAssignment.project.name}`);

    return NextResponse.json({
      success: true,
      message: 'Contract updated successfully',
      assignment: updatedAssignment,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating contract:', error);
    return NextResponse.json({
      error: 'Failed to update contract',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
