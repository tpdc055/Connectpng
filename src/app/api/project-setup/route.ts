import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const { location, projectName, description, coordinates } = await request.json();

    console.log(`🗺️ Updating project location to: ${location}`);

    // Update the main project
    const project = await prisma.project.upsert({
      where: { id: 'maria-pori-project' },
      update: {
        name: projectName || `${location} Road Construction`,
        description: description || `Road construction project in ${location}, Papua New Guinea.`,
        sponsor: 'ITCFA - Exxon Mobile',
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-04-15'),
        totalDistance: 15000,
        teamLead: user.name,
        status: 'IN_PROGRESS'
      },
      create: {
        id: 'maria-pori-project',
        name: projectName || `${location} Road Construction`,
        description: description || `Road construction project in ${location}, Papua New Guinea.`,
        sponsor: 'ITCFA - Exxon Mobile',
        startDate: new Date('2024-01-15'),
        estimatedEndDate: new Date('2024-04-15'),
        totalDistance: 15000,
        teamLead: user.name,
        status: 'IN_PROGRESS'
      }
    });

    // Clear existing test GPS points if requested
    if (coordinates && coordinates.length > 0) {
      await prisma.gpsPoint.deleteMany({
        where: { projectId: project.id }
      });

      console.log('🧹 Cleared existing GPS points for new location');
    }

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'PROJECT_UPDATE',
        description: `Updated project location to ${location}`,
        metadata: JSON.stringify({
          oldLocation: 'Maria Pori Road, Central Province',
          newLocation: location,
          updatedBy: user.email,
          timestamp: new Date().toISOString()
        }),
        userId: user.id,
        projectId: project.id
      }
    });

    console.log('✅ Project location updated successfully');

    return NextResponse.json({
      success: true,
      message: `Project updated to ${location}`,
      project: {
        id: project.id,
        name: project.name,
        description: project.description,
        location: location
      },
      changes: {
        locationUpdated: true,
        gpsPointsCleared: coordinates && coordinates.length > 0,
        readyForNewData: true
      },
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('❌ Project update failed:', error);
    return NextResponse.json({
      error: 'Project update failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    }, { status: 500 });
  }
}

export async function GET() {
  return NextResponse.json({
    message: 'Project Setup API',
    description: 'Updates project location and clears test data',
    usage: 'POST with { location, projectName?, description?, coordinates? }',
    examples: {
      tari: {
        location: 'Tari, Hela Province',
        projectName: 'Tari Road Construction',
        description: 'Road construction project in Tari, Hela Province, Papua New Guinea.'
      }
    }
  });
}
