import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import type { GPSPoint, Project } from '@/types';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const url = new URL(request.url);
    const projectId = url.searchParams.get('projectId');
    const format = url.searchParams.get('format') as 'csv' | 'xlsx' || 'csv';

    if (!projectId) {
      return NextResponse.json(
        { error: 'Missing project ID' },
        { status: 400 }
      );
    }

    // Check if project exists
    const project = await prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: 'Project not found' },
        { status: 404 }
      );
    }

    // Fetch GPS points with related data
    const gpsPoints = await prisma.gpsPoint.findMany({
      where: { projectId },
      include: {
        user: {
          select: {
            name: true,
            email: true,
            role: true,
          },
        },
        photos: {
          select: {
            filename: true,
            originalName: true,
            description: true,
          },
        },
      },
      orderBy: [
        { phase: 'asc' },
        { side: 'asc' },
        { timestamp: 'asc' },
      ],
    });

    if (format === 'csv') {
      const csvContent = generateCSV(gpsPoints, project);

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="maria-pori-road-gps-data.csv"`,
        },
      });
    } else if (format === 'xlsx') {
      // For Excel format, we'll generate a more structured format
      const csvContent = generateDetailedCSV(gpsPoints, project);

      // Since we don't have xlsx library, we'll return enhanced CSV
      // In a real implementation, you'd use a library like 'xlsx' or 'exceljs'
      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'Content-Disposition': `attachment; filename="maria-pori-road-gps-data.xlsx"`,
        },
      });
    }

    return NextResponse.json(
      { error: 'Invalid format' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Export error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function generateCSV(gpsPoints: GPSPoint[], project: Project): string {
  const headers = [
    'Phase',
    'Side',
    'Latitude',
    'Longitude',
    'Distance (m)',
    'Notes',
    'Elevation (m)',
    'Accuracy (m)',
    'Status',
    'Date Added',
    'Added By',
    'User Role',
    'Photos Count'
  ];

  const rows = gpsPoints.map(point => [
    point.phase,
    point.side,
    point.latitude.toString(),
    point.longitude.toString(),
    point.distance.toString(),
    escapeCSVField(point.notes || ''),
    point.elevation?.toString() || '',
    point.accuracy?.toString() || '',
    point.status,
    formatPNGDate(point.timestamp),
    escapeCSVField(point.user.name),
    point.user.role,
    point.photos.length.toString()
  ]);

  const csvLines = [headers.join(',')];

  for (const row of rows) {
    csvLines.push(row.join(','));
  }

  // Add PNG header information
  const pngHeader = [
    '# PNG Road Construction Monitoring System',
    '# Maria Pori Road - 15km Construction Project',
    '# Central Province, Papua New Guinea',
    '# Sponsored by ITCFA - Exxon Mobile',
    '# Connect PNG Program Initiative',
    `# Exported on: ${formatPNGDate(new Date())}`,
    '# GPS coordinates in WGS84 decimal degrees',
    '# Distances and elevations in meters',
    '',
  ].join('\n');

  return pngHeader + csvLines.join('\n');
}

function generateDetailedCSV(gpsPoints: GPSPoint[], project: Project): string {
  const headers = [
    'ID',
    'Project',
    'Phase',
    'Side',
    'Latitude',
    'Longitude',
    'Distance (m)',
    'Notes',
    'Elevation (m)',
    'Accuracy (m)',
    'Status',
    'Date Added (PNG Time)',
    'Added By',
    'User Email',
    'User Role',
    'Photos Count',
    'Photo Names',
    'GPS Quality',
    'Construction Area'
  ];

  const rows = gpsPoints.map(point => {
    const photoNames = point.photos?.map((p: string | { originalName: string }) =>
      typeof p === 'string' ? p : p.originalName
    ).join('; ') || '';
    const gpsQuality = determineGPSQuality(point.accuracy);
    const constructionArea = determineConstructionArea(point.latitude, point.longitude);

    return [
      point.id,
      'Maria Pori Road',
      point.phase.toUpperCase(),
      point.side,
      point.latitude.toString(),
      point.longitude.toString(),
      point.distance.toString(),
      escapeCSVField(point.notes || ''),
      point.elevation?.toString() || '',
      point.accuracy?.toString() || '',
      point.status,
      formatPNGDate(point.timestamp),
      escapeCSVField(point.user.name),
      point.user.email,
      point.user.role,
      point.photos.length.toString(),
      escapeCSVField(photoNames),
      gpsQuality,
      constructionArea
    ];
  });

  const csvLines = [headers.join(',')];

  for (const row of rows) {
    csvLines.push(row.join(','));
  }

  // Enhanced PNG header for detailed export
  const pngHeader = [
    '# PNG ROAD CONSTRUCTION MONITORING SYSTEM',
    '# ==========================================',
    '# Project: Maria Pori Road Construction',
    '# Location: Central Province, Papua New Guinea',
    '# Distance: 15 kilometers',
    '# Sponsor: ITCFA - Exxon Mobile',
    '# Program: Connect PNG Infrastructure Initiative',
    '',
    '# TECHNICAL SPECIFICATIONS:',
    '# - GPS Coordinate System: WGS84 (World Geodetic System 1984)',
    '# - Latitude/Longitude: Decimal degrees',
    '# - Distance Measurements: Meters',
    '# - Elevation: Meters above sea level',
    '# - Accuracy: GPS horizontal accuracy in meters',
    '# - Construction Phases: DRAIN (line drains), BASKET (baskets), SEALING (road surface)',
    '# - Road Sides: LEFT, RIGHT (relative to direction of construction)',
    '',
    '# DATA EXPORT INFORMATION:',
    `# Export Date: ${formatPNGDate(new Date())}`,
    `# Total GPS Points: ${gpsPoints.length}`,
    `# Data Source: PNG Road Construction Monitor`,
    '# Local Time Zone: Pacific/Port_Moresby (UTC+10)',
    '',
    '# CONNECT PNG PROGRAM:',
    '# This data supports Papua New Guinea\'s infrastructure development',
    '# goals and contributes to economic growth in Central Province.',
    '',
  ].join('\n');

  return pngHeader + csvLines.join('\n');
}

function escapeCSVField(field: string): string {
  if (field.includes(',') || field.includes('"') || field.includes('\n')) {
    return `"${field.replace(/"/g, '""')}"`;
  }
  return field;
}

function formatPNGDate(date: Date | string): string {
  const d = new Date(date);
  return d.toLocaleString('en-PG', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    timeZone: 'Pacific/Port_Moresby',
    timeZoneName: 'short'
  });
}

function determineGPSQuality(accuracy?: number): string {
  if (!accuracy) return 'Unknown';
  if (accuracy <= 2) return 'Excellent';
  if (accuracy <= 5) return 'Good';
  if (accuracy <= 10) return 'Fair';
  return 'Poor';
}

function determineConstructionArea(latitude: number, longitude: number): string {
  // Simple area determination based on GPS coordinates
  // This is a simplified example - in reality you'd have more sophisticated area mapping

  if (latitude >= -1.290 && latitude <= -1.285) {
    return 'Northern Section';
  } else if (latitude >= -1.295 && latitude < -1.290) {
    return 'Central Section';
  } else if (latitude >= -1.300 && latitude < -1.295) {
    return 'Southern Section';
  } else {
    return 'Extended Area';
  }
}
