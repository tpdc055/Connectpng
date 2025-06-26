import { type NextRequest, NextResponse } from 'next/server';
import { writeFile, mkdir } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

const UPLOAD_DIR = process.env.UPLOAD_DIR || './uploads';
const MAX_FILE_SIZE = Number.parseInt(process.env.MAX_FILE_SIZE || '10485760'); // 10MB default

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const gpsPointId = formData.get('gpsPointId') as string;
    const description = formData.get('description') as string || '';

    if (!file) {
      return NextResponse.json(
        { error: 'No file provided' },
        { status: 400 }
      );
    }

    if (!gpsPointId) {
      return NextResponse.json(
        { error: 'GPS point ID is required' },
        { status: 400 }
      );
    }

    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: `File size must be less than ${MAX_FILE_SIZE / 1024 / 1024}MB` },
        { status: 400 }
      );
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: 'Only image files are allowed' },
        { status: 400 }
      );
    }

    // Check if GPS point exists and user has access
    const gpsPoint = await prisma.gpsPoint.findUnique({
      where: { id: gpsPointId },
      include: {
        user: true,
        project: true,
      },
    });

    if (!gpsPoint) {
      return NextResponse.json(
        { error: 'GPS point not found' },
        { status: 404 }
      );
    }

    // Create upload directory if it doesn't exist
    const uploadPath = path.join(process.cwd(), UPLOAD_DIR);
    if (!existsSync(uploadPath)) {
      await mkdir(uploadPath, { recursive: true });
    }

    // Generate unique filename
    const fileExtension = path.extname(file.name);
    const filename = `${uuidv4()}${fileExtension}`;
    const filePath = path.join(uploadPath, filename);

    // Write file to disk
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    await writeFile(filePath, buffer);

    // Save photo record to database
    const photo = await prisma.photo.create({
      data: {
        filename,
        originalName: file.name,
        path: filePath,
        size: file.size,
        mimeType: file.type,
        description,
        userId: user.id,
        gpsPointId,
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
    await prisma.activity.create({
      data: {
        type: 'PHOTO_UPLOADED',
        description: `Photo uploaded for GPS point (${file.name})`,
        metadata: JSON.stringify({
          filename: photo.filename,
          originalName: photo.originalName,
          size: photo.size,
          mimeType: photo.mimeType,
        }),
        userId: user.id,
        projectId: gpsPoint.projectId,
        gpsPointId,
      },
    });

    return NextResponse.json({ photo }, { status: 201 });
  } catch (error) {
    console.error('Error uploading photo:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
