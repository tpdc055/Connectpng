import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';
import { broadcastGpsPointAdded, broadcastActivity } from '@/app/api/events/route';
import { type ConstructionPhase, type RoadSide, PointStatus } from '@prisma/client';

interface ParsedRow {
  phase: string;
  side: string;
  latitude: number;
  longitude: number;
  distance: number;
  notes?: string;
  elevation?: number;
  accuracy?: number;
}

interface ImportResult {
  totalRows: number;
  successCount: number;
  errorCount: number;
  errors: Array<{ row: number; error: string }>;
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const projectId = formData.get('projectId') as string;

    if (!file || !projectId) {
      return NextResponse.json(
        { error: 'Missing file or project ID' },
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

    // Parse file content
    const content = await file.text();
    const rows = parseCSVContent(content);

    const result: ImportResult = {
      totalRows: rows.length,
      successCount: 0,
      errorCount: 0,
      errors: [],
    };

    // Process each row
    for (let i = 0; i < rows.length; i++) {
      const rowIndex = i + 2; // +2 because we skip header and arrays are 0-indexed

      try {
        const parsedRow = validateAndParseRow(rows[i], rowIndex);

        // Create GPS point
        const gpsPoint = await prisma.gpsPoint.create({
          data: {
            latitude: parsedRow.latitude,
            longitude: parsedRow.longitude,
            phase: parsedRow.phase as ConstructionPhase,
            side: parsedRow.side as RoadSide,
            distance: parsedRow.distance,
            notes: parsedRow.notes,
            elevation: parsedRow.elevation,
            accuracy: parsedRow.accuracy,
            status: PointStatus.PENDING,
            userId: user.id,
            projectId,
          },
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                role: true,
              },
            },
          },
        });

        // Create activity log
        const activity = await prisma.activity.create({
          data: {
            type: 'GPS_POINT_ADDED',
            description: `GPS point imported from spreadsheet for ${parsedRow.phase} construction on ${parsedRow.side} side (${parsedRow.distance}m)`,
            metadata: JSON.stringify({
              latitude: gpsPoint.latitude,
              longitude: gpsPoint.longitude,
              distance: gpsPoint.distance,
              phase: gpsPoint.phase,
              side: gpsPoint.side,
              importSource: 'spreadsheet',
            }),
            userId: user.id,
            projectId,
            gpsPointId: gpsPoint.id,
          },
          include: {
            user: {
              select: {
                name: true,
                role: true,
              },
            },
          },
        });

        // Broadcast real-time updates
        try {
          broadcastGpsPointAdded(gpsPoint, projectId);
          broadcastActivity(activity, projectId);
        } catch (error) {
          console.error('Broadcast error:', error);
        }

        result.successCount++;
      } catch (error) {
        result.errorCount++;
        result.errors.push({
          row: rowIndex,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error('Import error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function parseCSVContent(content: string): string[][] {
  const lines = content.split('\n').filter(line => line.trim());
  const rows: string[][] = [];

  for (let i = 1; i < lines.length; i++) { // Skip header row
    const line = lines[i].trim();
    if (!line) continue;

    const row = parseCSVLine(line);
    if (row.length > 0) {
      rows.push(row);
    }
  }

  return rows;
}

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  result.push(current.trim());
  return result;
}

function validateAndParseRow(row: string[], rowIndex: number): ParsedRow {
  if (row.length < 4) {
    throw new Error('Insufficient columns - requires at least Phase, Side, Latitude, Longitude');
  }

  const phase = row[0]?.toLowerCase().trim();
  const side = row[1]?.toUpperCase().trim();
  const latStr = row[2]?.trim();
  const lngStr = row[3]?.trim();
  const distStr = row[4]?.trim() || '0';
  const notes = row[5]?.trim() || '';
  const elevStr = row[6]?.trim();
  const accStr = row[7]?.trim();

  // Validate phase
  if (!phase || !['drain', 'basket', 'sealing'].includes(phase)) {
    throw new Error('Invalid phase - must be: drain, basket, or sealing');
  }

  // Validate side
  if (!side || !['LEFT', 'RIGHT'].includes(side)) {
    throw new Error('Invalid side - must be: LEFT or RIGHT');
  }

  // Validate latitude
  const latitude = Number.parseFloat(latStr);
  if (Number.isNaN(latitude) || latitude < -90 || latitude > 90) {
    throw new Error('Invalid latitude - must be between -90 and 90');
  }

  // Validate longitude
  const longitude = Number.parseFloat(lngStr);
  if (Number.isNaN(longitude) || longitude < -180 || longitude > 180) {
    throw new Error('Invalid longitude - must be between -180 and 180');
  }

  // Validate distance
  const distance = Number.parseFloat(distStr);
  if (Number.isNaN(distance) || distance < 0) {
    throw new Error('Invalid distance - must be a positive number');
  }

  // Parse optional fields
  let elevation: number | undefined;
  if (elevStr) {
    elevation = Number.parseFloat(elevStr);
    if (Number.isNaN(elevation)) {
      throw new Error('Invalid elevation - must be a number');
    }
  }

  let accuracy: number | undefined;
  if (accStr) {
    accuracy = Number.parseFloat(accStr);
    if (Number.isNaN(accuracy) || accuracy < 0) {
      throw new Error('Invalid accuracy - must be a positive number');
    }
  }

  // PNG-specific validation for Maria Pori Road area
  if (latitude < -2.0 || latitude > -1.0 || longitude < 36.0 || longitude > 37.0) {
    console.warn(`GPS point outside expected PNG Central Province area: ${latitude}, ${longitude}`);
  }

  return {
    phase,
    side,
    latitude,
    longitude,
    distance,
    notes: notes || undefined,
    elevation,
    accuracy,
  };
}
