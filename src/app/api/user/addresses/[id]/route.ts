import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';
import { NextRequest } from 'next/server';

const updateAddressSchema = z.object({
  title: z.string().min(1, 'Title is required').optional(),
  street: z.string().min(1, 'Street is required').optional(),
  house: z.string().min(1, 'House number is required').optional(),
  apartment: z.string().optional(),
  city: z.string().min(1, 'City is required').optional(),
  region: z.string().min(1, 'Region is required').optional(),
  postalCode: z.string().optional(),
  landmark: z.string().optional(),
  comment: z.string().optional(),
  country: z.string().optional(),
  isDefault: z.boolean().optional()
});

// PUT update address
export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check for NextAuth session first
    let userEmail: string | null = null;
    let userId: string | null = null;
    
    if (session?.user?.email) {
      userEmail = session.user.email;
      
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true }
      });
      
      if (user) {
        userId = user.id;
      }
    } else {
      // Check for simulated auth header
      const simulatedUserHeader = request.headers.get('x-simulated-user');
      if (simulatedUserHeader) {
        try {
          const simulatedUser = JSON.parse(simulatedUserHeader);
          if (simulatedUser?.email) {
            userEmail = simulatedUser.email;
            
            // For simulated users, ensure they exist in the database
            let user = await prisma.user.findUnique({
              where: { email: userEmail },
              select: { id: true }
            });
            
            if (!user) {
              // Create the simulated user in the database
              user = await prisma.user.create({
                data: {
                  email: userEmail,
                  firstName: simulatedUser.firstName || 'User',
                  lastName: simulatedUser.lastName || '',
                  middleName: simulatedUser.middleName,
                  phone: simulatedUser.phone,
                  image: simulatedUser.image,
                  role: 'USER',
                  isActive: true
                },
                select: { id: true }
              });
            }
            
            userId = user.id;
          }
        } catch (e) {
          console.error('Error handling simulated user:', e);
        }
      }
    }
    
    if (!userEmail || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const validatedData = updateAddressSchema.parse(body);

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: params.id,
        userId: userId
      }
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    // If this is set as default, unset other default addresses
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: userId,
          isDefault: true,
          id: { not: params.id }
        },
        data: {
          isDefault: false
        }
      });
    }

    const updatedAddress = await prisma.address.update({
      where: { id: params.id },
      data: validatedData
    });

    return NextResponse.json({
      message: 'Address updated successfully',
      address: updatedAddress
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Update address error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE address
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    
    // Check for NextAuth session first
    let userEmail: string | null = null;
    let userId: string | null = null;
    
    if (session?.user?.email) {
      userEmail = session.user.email;
      
      const user = await prisma.user.findUnique({
        where: { email: userEmail },
        select: { id: true }
      });
      
      if (user) {
        userId = user.id;
      }
    } else {
      // Check for simulated auth header
      const simulatedUserHeader = request.headers.get('x-simulated-user');
      if (simulatedUserHeader) {
        try {
          const simulatedUser = JSON.parse(simulatedUserHeader);
          if (simulatedUser?.email) {
            userEmail = simulatedUser.email;
            
            // For simulated users, ensure they exist in the database
            let user = await prisma.user.findUnique({
              where: { email: userEmail },
              select: { id: true }
            });
            
            if (!user) {
              // Create the simulated user in the database
              user = await prisma.user.create({
                data: {
                  email: userEmail,
                  firstName: simulatedUser.firstName || 'User',
                  lastName: simulatedUser.lastName || '',
                  middleName: simulatedUser.middleName,
                  phone: simulatedUser.phone,
                  image: simulatedUser.image,
                  role: 'USER',
                  isActive: true
                },
                select: { id: true }
              });
            }
            
            userId = user.id;
          }
        } catch (e) {
          console.error('Error handling simulated user:', e);
        }
      }
    }
    
    if (!userEmail || !userId) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Check if address belongs to user
    const existingAddress = await prisma.address.findFirst({
      where: {
        id: params.id,
        userId: userId
      }
    });

    if (!existingAddress) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      );
    }

    await prisma.address.delete({
      where: { id: params.id }
    });

    return NextResponse.json({
      message: 'Address deleted successfully'
    });

  } catch (error) {
    console.error('Delete address error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}