import { type NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getAuthUser, hashPassword } from '@/lib/auth';

// PATCH /api/users/[id] - Update user (Admin/Manager with restrictions)
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const userId = params.id;
    const updates = await request.json();

    // Get target user
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, role: true, email: true },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Permission checks
    const canEdit = canUserEdit(user, targetUser);
    if (!canEdit) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Validate updates
    const allowedUpdates = ['name', 'email', 'role', 'isActive', 'password'];
    const validUpdates: any = {};

    for (const [key, value] of Object.entries(updates)) {
      if (allowedUpdates.includes(key)) {
        if (key === 'email' && typeof value === 'string') {
          // Validate email format
          const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
          if (!emailRegex.test(value)) {
            return NextResponse.json(
              { error: 'Invalid email format' },
              { status: 400 }
            );
          }

          // Check if email is already taken by another user
          const existingUser = await prisma.user.findUnique({
            where: { email: value },
          });
          if (existingUser && existingUser.id !== userId) {
            return NextResponse.json(
              { error: 'Email already in use' },
              { status: 400 }
            );
          }
        }

        if (key === 'role' && typeof value === 'string') {
          // Only admins can change roles
          if (user.role !== 'ADMIN') {
            return NextResponse.json(
              { error: 'Only administrators can change user roles' },
              { status: 403 }
            );
          }

          const validRoles = ['ENGINEER', 'SUPERVISOR', 'MANAGER', 'ADMIN'];
          if (!validRoles.includes(value)) {
            return NextResponse.json(
              { error: 'Invalid role' },
              { status: 400 }
            );
          }
        }

        if (key === 'password' && typeof value === 'string') {
          if (value.length < 8) {
            return NextResponse.json(
              { error: 'Password must be at least 8 characters long' },
              { status: 400 }
            );
          }
          validUpdates[key] = await hashPassword(value);
        } else {
          validUpdates[key] = value;
        }
      }
    }

    // Prevent users from deactivating themselves
    if ('isActive' in validUpdates && validUpdates.isActive === false && user.id === userId) {
      return NextResponse.json(
        { error: 'You cannot deactivate your own account' },
        { status: 400 }
      );
    }

    // Update user
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: validUpdates,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    });

    return NextResponse.json({
      message: 'User updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error updating user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/users/[id] - Delete user (Admin only, with restrictions)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthUser(request);
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins can delete users
    if (user.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const userId = params.id;

    // Prevent deleting yourself
    if (user.id === userId) {
      return NextResponse.json(
        { error: 'You cannot delete your own account' },
        { status: 400 }
      );
    }

    // Check if user exists
    const targetUser = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!targetUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Prevent deleting the last admin
    if (targetUser.role === 'ADMIN') {
      const adminCount = await prisma.user.count({
        where: { role: 'ADMIN', isActive: true },
      });

      if (adminCount <= 1) {
        return NextResponse.json(
          { error: 'Cannot delete the last active administrator' },
          { status: 400 }
        );
      }
    }

    // Delete user
    await prisma.user.delete({
      where: { id: userId },
    });

    return NextResponse.json({
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Helper function to check if user can edit target user
function canUserEdit(editor: any, target: any): boolean {
  // Admins can edit anyone except they can't delete themselves
  if (editor.role === 'ADMIN') return true;

  // Managers can edit Engineers and Supervisors
  if (editor.role === 'MANAGER') {
    const hierarchy = { ENGINEER: 1, SUPERVISOR: 2, MANAGER: 3, ADMIN: 4 };
    const editorLevel = hierarchy[editor.role as keyof typeof hierarchy] || 0;
    const targetLevel = hierarchy[target.role as keyof typeof hierarchy] || 0;
    return targetLevel < editorLevel;
  }

  return false;
}
