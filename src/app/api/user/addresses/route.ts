import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { prisma } from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/authOptions';

const createAddressSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  street: z.string().min(1, 'Street is required'),
  house: z.string().min(1, 'House number is required'),
  apartment: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  region: z.string().min(1, 'Region is required'),
  postalCode: z.string().optional(),
  landmark: z.string().optional(),
  comment: z.string().optional(),
  country: z.string().default('UZ'),
  isDefault: z.boolean().default(false)
});

// GET user addresses
export async function GET(request: NextRequest) {
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

    const addresses = await prisma.address.findMany({
      where: { userId: userId },
      orderBy: [
        { isDefault: 'desc' },
        { createdAt: 'desc' }
      ]
    });

    return NextResponse.json({ addresses });

  } catch (error) {
    console.error('Get addresses error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST create new address
export async function POST(request: NextRequest) {
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
    const validatedData = createAddressSchema.parse(body);

    // If this is set as default, unset other default addresses
    if (validatedData.isDefault) {
      await prisma.address.updateMany({
        where: {
          userId: userId,
          isDefault: true
        },
        data: {
          isDefault: false
        }
      });
    }

    const address = await prisma.address.create({
      data: {
        ...validatedData,
        userId: userId
      }
    });

    return NextResponse.json({
      message: 'Address created successfully',
      address
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.errors },
        { status: 400 }
      );
    }

    console.error('Create address error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
