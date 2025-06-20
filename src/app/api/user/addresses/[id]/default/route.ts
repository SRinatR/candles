import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

// PUT set address as default
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const addressId = params.id;

    // Check if address belongs to user
    const address = await prisma.address.findFirst({
      where: {
        id: addressId,
        userId: user.id
      }
    });

    if (!address) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // First, unset all default addresses for this user
    await prisma.address.updateMany({
      where: {
        userId: user.id,
        isDefault: true
      },
      data: {
        isDefault: false
      }
    });

    // Then set the specified address as default
    const updatedAddress = await prisma.address.update({
      where: {
        id: addressId
      },
      data: {
        isDefault: true
      }
    });

    return NextResponse.json({
      message: 'Default address updated successfully',
      address: updatedAddress
    });

  } catch (error) {
    console.error('Set default address error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}