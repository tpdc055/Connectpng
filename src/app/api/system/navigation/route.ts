import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser } from '@/lib/auth';

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Fetch navigation items with role-based filtering
    const navigationItems = await prisma.navigationItem.findMany({
      where: {
        isActive: true,
        OR: [
          { requiredRole: null }, // Public items
          { requiredRole: user.role }, // User's exact role
          ...(user.role === 'ADMIN' ? [{ requiredRole: { in: ['MANAGER', 'SUPERVISOR', 'ENGINEER', 'WORKER'] } }] : []),
          ...(user.role === 'MANAGER' ? [{ requiredRole: { in: ['SUPERVISOR', 'ENGINEER', 'WORKER'] } }] : []),
          ...(user.role === 'SUPERVISOR' ? [{ requiredRole: { in: ['ENGINEER', 'WORKER'] } }] : []),
          ...(user.role === 'ENGINEER' ? [{ requiredRole: 'WORKER' }] : [])
        ]
      },
      include: {
        children: {
          where: { isActive: true },
          orderBy: { sortOrder: 'asc' }
        }
      },
      orderBy: { sortOrder: 'asc' }
    });

    // If no navigation items exist, return default structure
    if (navigationItems.length === 0) {
      const defaultNavigation = [
        {
          id: 'reports',
          label: 'Reports',
          icon: 'FileText',
          route: 'reports',
          requiredRole: null,
          sortOrder: 1,
          description: 'View project reports and analytics'
        },
        {
          id: 'progress',
          label: 'Progress Monitoring',
          icon: 'BarChart3',
          route: 'progress',
          requiredRole: null,
          sortOrder: 2,
          description: 'Track construction progress and create progress reports'
        },
        {
          id: 'financial',
          label: 'Financial Monitoring',
          icon: 'DollarSign',
          route: 'financial',
          requiredRole: null,
          sortOrder: 3,
          description: 'Funding tracking and financial management'
        },
        {
          id: 'hse',
          label: 'HSE Management',
          icon: 'Shield',
          route: 'hse',
          requiredRole: null,
          sortOrder: 4,
          description: 'Health, Safety & Environment incident management'
        },
        {
          id: 'quality',
          label: 'Quality Control',
          icon: 'ClipboardCheck',
          route: 'quality',
          requiredRole: null,
          sortOrder: 5,
          description: 'Material testing and quality compliance tracking'
        },
        {
          id: 'monitoring',
          label: 'GPS Monitoring',
          icon: 'MapPin',
          route: 'monitoring',
          requiredRole: null,
          sortOrder: 6,
          description: 'GPS tracking and location monitoring'
        },
        {
          id: 'activities',
          label: 'Activities',
          icon: 'Zap',
          route: 'activities',
          requiredRole: null,
          sortOrder: 7,
          description: 'Manage project activities'
        },
        {
          id: 'users',
          label: 'Users',
          icon: 'Users',
          route: 'users',
          requiredRole: null,
          sortOrder: 8,
          description: 'User management'
        },
        {
          id: 'projects',
          label: 'Projects',
          icon: 'Building',
          route: 'projects',
          requiredRole: null,
          sortOrder: 9,
          description: 'Project information and details'
        },
        ...(user.role === 'ADMIN' || user.role === 'MANAGER' ? [
          {
            id: 'contractors',
            label: 'Contractors',
            icon: 'Building',
            route: 'contractors',
            requiredRole: 'MANAGER',
            sortOrder: 10,
            description: 'Contractor management'
          },
          {
            id: 'contracts',
            label: 'Contracts',
            icon: 'CreditCard',
            route: 'contracts',
            requiredRole: 'MANAGER',
            sortOrder: 11,
            description: 'Contract assignments and values'
          }
        ] : []),
        ...(user.role === 'ADMIN' ? [
          {
            id: 'system',
            label: 'System',
            icon: 'Settings',
            route: 'system',
            requiredRole: 'ADMIN',
            sortOrder: 12,
            description: 'System administration and configuration'
          }
        ] : [])
      ];

      return NextResponse.json({
        navigationItems: defaultNavigation,
        isDefault: true,
        userRole: user.role,
        timestamp: new Date().toISOString()
      });
    }

    return NextResponse.json({
      navigationItems,
      isDefault: false,
      userRole: user.role,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error fetching navigation:', error);
    return NextResponse.json({
      error: 'Failed to fetch navigation',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const {
      label,
      icon,
      route,
      parentId,
      requiredRole,
      description,
      sortOrder
    } = await request.json();

    if (!label || !icon || !route) {
      return NextResponse.json({ error: 'Label, icon, and route are required' }, { status: 400 });
    }

    // Check if route already exists
    const existingItem = await prisma.navigationItem.findFirst({
      where: { route: route.trim() }
    });

    if (existingItem) {
      return NextResponse.json({ error: 'Route already exists' }, { status: 400 });
    }

    const navigationItem = await prisma.navigationItem.create({
      data: {
        label: label.trim(),
        icon: icon.trim(),
        route: route.trim(),
        parentId: parentId?.trim() || null,
        requiredRole: requiredRole?.trim() || null,
        description: description?.trim() || null,
        sortOrder: sortOrder || 0,
        isSystemItem: false
      }
    });

    console.log(`✅ Navigation item created: ${label} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Navigation item created successfully',
      navigationItem,
      timestamp: new Date().toISOString()
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating navigation item:', error);
    return NextResponse.json({
      error: 'Failed to create navigation item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const user = await getAuthUser(request);
    if (!user || user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Admin access required' }, { status: 401 });
    }

    const {
      id,
      label,
      icon,
      route,
      parentId,
      requiredRole,
      description,
      sortOrder,
      isActive
    } = await request.json();

    if (!id) {
      return NextResponse.json({ error: 'Navigation item ID is required' }, { status: 400 });
    }

    const navigationItem = await prisma.navigationItem.update({
      where: { id },
      data: {
        ...(label && { label: label.trim() }),
        ...(icon && { icon: icon.trim() }),
        ...(route && { route: route.trim() }),
        ...(parentId !== undefined && { parentId: parentId?.trim() || null }),
        ...(requiredRole !== undefined && { requiredRole: requiredRole?.trim() || null }),
        ...(description !== undefined && { description: description?.trim() || null }),
        ...(sortOrder !== undefined && { sortOrder }),
        ...(isActive !== undefined && { isActive })
      }
    });

    console.log(`✅ Navigation item updated: ${navigationItem.label} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Navigation item updated successfully',
      navigationItem,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error updating navigation item:', error);
    return NextResponse.json({
      error: 'Failed to update navigation item',
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
      return NextResponse.json({ error: 'Navigation item ID is required' }, { status: 400 });
    }

    // Check if it's a system item (cannot be deleted)
    const navigationItem = await prisma.navigationItem.findUnique({
      where: { id }
    });

    if (!navigationItem) {
      return NextResponse.json({ error: 'Navigation item not found' }, { status: 404 });
    }

    if (navigationItem.isSystemItem) {
      return NextResponse.json({ error: 'System navigation items cannot be deleted' }, { status: 400 });
    }

    await prisma.navigationItem.delete({
      where: { id }
    });

    console.log(`✅ Navigation item deleted: ${navigationItem.label} by ${user.name}`);

    return NextResponse.json({
      success: true,
      message: 'Navigation item deleted successfully',
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error deleting navigation item:', error);
    return NextResponse.json({
      error: 'Failed to delete navigation item',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
