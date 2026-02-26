import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const settings = await prisma.settings.findFirst();
    if (settings) {
      if (settings.bankAccounts) {
        try {
          (settings as unknown as { bankAccounts: unknown }).bankAccounts = JSON.parse(settings.bankAccounts);
        } catch {
          (settings as unknown as { bankAccounts: unknown[] }).bankAccounts = [];
        }
      }
      if (settings.closedDays) {
        try {
          (settings as unknown as { closedDays: unknown }).closedDays = JSON.parse(settings.closedDays);
        } catch {
          (settings as unknown as { closedDays: unknown[] }).closedDays = [];
        }
      }
      // Map database fields to frontend fields
      (settings as unknown as { storeDescription: string }).storeDescription = settings.storeAddress || '';
      (settings as unknown as { operationalHours: string }).operationalHours = settings.openHour || '';
    }
    return NextResponse.json(settings || {});
  } catch {
    return NextResponse.json({ error: 'Gagal mengambil pengaturan' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    console.log('API Settings PUT Body: ', body);
    
    // Whitelist only valid fields for Prisma
    const validFields = [
      'waNumber', 
      'storeName', 'storeAddress', 'openHour', 'closeHour', 'isOpen', 'bankAccounts', 'closedDays'
    ];
    
    const updateData: Record<string, unknown> = {};
    validFields.forEach(field => {
      if (body[field] !== undefined) {
        updateData[field] = body[field];
      }
    });

    // Handle mapping for legacy or misnamed fields if they exist in body
    if (body.storeDescription && !updateData.storeAddress) {
      updateData.storeAddress = body.storeDescription;
    }
    if (body.operationalHours && !updateData.openHour) {
      updateData.openHour = body.operationalHours;
    }

    // Stringify array fields for storage
    if (updateData.bankAccounts && typeof updateData.bankAccounts !== 'string') {
      updateData.bankAccounts = JSON.stringify(updateData.bankAccounts);
    }
    if (updateData.closedDays && typeof updateData.closedDays !== 'string') {
      updateData.closedDays = JSON.stringify(updateData.closedDays);
    }

    console.log('API Settings PUT UpdateData:', updateData);
    
    // Check if settings exist
    const currentSettings = await prisma.settings.findFirst();

    let updatedSettings;
    try {
      if (currentSettings) {
        updatedSettings = await prisma.settings.update({
          where: { id: currentSettings.id },
          data: updateData
        });
      } else {
        updatedSettings = await prisma.settings.create({
          data: updateData
        });
      }
    } catch (prismaError) {
      console.error('Prisma Error in Settings PUT:', prismaError);
      throw prismaError;
    }

    if (updatedSettings && updatedSettings.bankAccounts) {
      try {
        (updatedSettings as unknown as { bankAccounts: unknown }).bankAccounts = JSON.parse(updatedSettings.bankAccounts);
      } catch {
        (updatedSettings as unknown as { bankAccounts: unknown[] }).bankAccounts = [];
      }
    }
    
    if (updatedSettings && updatedSettings.closedDays) {
      try {
        (updatedSettings as unknown as { closedDays: unknown }).closedDays = JSON.parse(updatedSettings.closedDays);
      } catch {
        (updatedSettings as unknown as { closedDays: unknown[] }).closedDays = [];
      }
    }

    return NextResponse.json(updatedSettings);
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : 'Unknown error';
    const errorStack = error instanceof Error ? error.stack : undefined;
    
    return NextResponse.json({ 
      error: 'Gagal menyimpan pengaturan', 
      message: errorMsg,
      stack: errorStack 
    }, { status: 500 });
  }
}
