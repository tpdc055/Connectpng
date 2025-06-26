import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import type { NextRequest } from 'next/server';

interface BulkGPSPoint {
  latitude: number;
  longitude: number;
  phase: string;
  side: string;
  distance: number;
  status: string;
  notes?: string;
}

const mapPhaseToEnum = (phase: string) => {
  switch (phase.toLowerCase()) {
    case 'line drain construction':
    case 'line drain':
    case 'drain':
      return 'DRAIN';
    case 'basket construction':
    case 'basket':
      return 'BASKET';
    case 'road sealing':
    case 'sealing':
      return 'SEALING';
    default:
      return 'DRAIN';
  }
};

const mapSideToEnum = (side: string) => {
  switch (side.toLowerCase()) {
    case 'left':
      return 'LEFT';
    case 'right':
      return 'RIGHT';
    case 'both':
    case 'center line':
    case 'center':
      return 'BOTH';
    default:
      return 'LEFT';
  }
};

const mapStatusToEnum = (status: string) => {
  switch (status.toLowerCase()) {
    case 'completed':
      return 'COMPLETED';
    case 'in progress':
    case 'in_progress':
      return 'IN_PROGRESS';
    case 'verified':
      return 'VERIFIED';
    case 'pending':
    default:
      return 'PENDING';
  }
};

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { gpsPoints }: { gpsPoints: BulkGPSPoint[] } = await request.json();

    if (!gpsPoints || !Array.isArray(gpsPoints) || gpsPoints.length === 0) {
      return NextResponse.json({
        error: 'Invalid GPS points data. Expected array of GPS coordinates.'
      }, { status: 400 });
    }

    // Validate PNG coordinates
    const validPoints = gpsPoints.filter(point => {
      return point.latitude >= -12 && point.latitude <= -1 &&
             point.longitude >= 140 && point.longitude <= 160 &&
             point.latitude !== 0 && point.longitude !== 0;
    });

    if (validPoints.length === 0) {
      return NextResponse.json({
        error: 'No valid PNG coordinates found. Latitude should be -1 to -12, Longitude 140 to 160.'
      }, { status: 400 });
    }

    // Get the default project (Maria Pori Road)
    const project = await prisma.project.findFirst({
      where: { name: { contains: 'Maria Pori' } }
    });

    if (!project) {
      return NextResponse.json({
        error: 'Maria Pori Road project not found'
      }, { status: 404 });
    }

    // Prepare GPS points for database insertion
    const gpsPointsData = validPoints.map(point => ({
      latitude: point.latitude,
      longitude: point.longitude,
      phase: mapPhaseToEnum(point.phase),
      side: mapSideToEnum(point.side),
      distance: point.distance,
      status: mapStatusToEnum(point.status),
      notes: point.notes || '',
      userId: user.id,
      projectId: project.id,
      timestamp: new Date(),
    }));

    // Insert GPS points in batches
    const createdPoints = await prisma.gpsPoint.createMany({
      data: gpsPointsData,
      skipDuplicates: true
    });

    // Create activity log
    await prisma.activity.create({
      data: {
        type: 'BULK_GPS_IMPORT',
        description: `Imported ${createdPoints.count} GPS points for Maria Pori Road construction`,
        metadata: JSON.stringify({
          pointsCount: createdPoints.count,
          phases: [...new Set(validPoints.map(p => p.phase))],
          source: 'CSV Import'
        }),
        userId: user.id,
        projectId: project.id
      }
    });

    // Trigger real-time update
    const eventData = {
      type: 'bulk-gps-import',
      message: `${createdPoints.count} GPS points imported successfully`,
      data: {
        count: createdPoints.count,
        projectId: project.id,
        userId: user.id
      }
    };

    // Dispatch custom event for real-time updates
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('gps-bulk-import', { detail: eventData }));
    }

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdPoints.count} GPS points`,
      data: {
        imported: createdPoints.count,
        total: gpsPoints.length,
        valid: validPoints.length,
        invalid: gpsPoints.length - validPoints.length,
        projectId: project.id,
        phases: [...new Set(validPoints.map(p => p.phase))]
      }
    });

  } catch (error) {
    console.error('Bulk GPS import error:', error);
    return NextResponse.json({
      error: 'Failed to import GPS points',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Bulk GPS Import API',
    usage: 'POST with { gpsPoints: Array<GPSPoint> }',
    format: {
      latitude: 'number (-1 to -12 for PNG)',
      longitude: 'number (140 to 160 for PNG)',
      phase: 'string (Line Drain Construction, Basket Construction, Road Sealing)',
      side: 'string (Left, Right, Both)',
      distance: 'number (meters)',
      status: 'string (Pending, In Progress, Completed, Verified)',
      notes: 'string (optional)'
    }
  });
}
