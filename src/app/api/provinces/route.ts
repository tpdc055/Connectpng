import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    // For provinces, we can allow public access since it's geographic data
    // But we'll still validate auth for consistency
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch all PNG provinces
    const provinces = await prisma.province.findMany({
      orderBy: [
        { region: 'asc' },
        { name: 'asc' }
      ],
      include: {
        _count: {
          select: {
            projects: true
          }
        }
      }
    });

    // Group provinces by region for easier UI consumption
    const provincesByRegion = provinces.reduce((groups, province) => {
      if (!groups[province.region]) {
        groups[province.region] = [];
      }
      groups[province.region].push({
        id: province.id,
        name: province.name,
        code: province.code,
        capital: province.capital,
        population: province.population,
        projectCount: province._count.projects
      });
      return groups;
    }, {} as Record<string, any[]>);

    return NextResponse.json({
      provinces: provinces.map(p => ({
        id: p.id,
        name: p.name,
        code: p.code,
        region: p.region,
        capital: p.capital,
        population: p.population,
        projectCount: p._count.projects
      })),
      provincesByRegion,
      summary: {
        total: provinces.length,
        byRegion: {
          Papua: provinces.filter(p => p.region === 'Papua').length,
          Highlands: provinces.filter(p => p.region === 'Highlands').length,
          Momase: provinces.filter(p => p.region === 'Momase').length,
          Islands: provinces.filter(p => p.region === 'Islands').length,
        }
      }
    });
  } catch (error) {
    console.error('Error fetching PNG provinces:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
