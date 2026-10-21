import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { HairColorUpdateSchema, serializeHairColor } from '@/lib/validations/content';
import { memoryStore } from '@/lib/memory-store';
import { safeRevalidatePath } from '@/lib/safe-revalidate';
import { ColorGroup, CareEffort } from '@prisma/client';

function mapColorGroup(groupStr?: string): ColorGroup {
  if (!groupStr) return 'BROWN';
  if (groupStr === 'ASH') return 'ASH_SMOKY';
  if (groupStr === 'CARAMEL') return 'BROWN';
  return groupStr as ColorGroup;
}

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { id } = params;
  let color: any;
  try {
    color = await prisma.hairColor.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });
  } catch {
    color = memoryStore.findHairColorById(id) || memoryStore.hairColors.find((c) => c.code === id);
  }

  if (!color) {
    return NextResponse.json({ error: 'Hair color not found' }, { status: 404 });
  }

  return NextResponse.json(serializeHairColor(color));
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { id } = params;
  let existing: any;
  try {
    existing = await prisma.hairColor.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });
  } catch {
    existing = memoryStore.findHairColorById(id) || memoryStore.hairColors.find((c) => c.code === id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Hair color not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parseResult = HairColorUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu màu tóc không hợp lệ', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  const hex = input.hexCode || input.hexColor;
  const skinTones = input.skinSuitability || input.suitableSkinTones;
  const advice = input.maintenanceAdvice !== undefined ? input.maintenanceAdvice : input.colorFadingAdvice;

  const updateData: any = {};
  if (input.name !== undefined) updateData.name = input.name;
  if (input.code !== undefined) updateData.code = input.code;
  if (hex !== undefined) updateData.hexColor = hex;
  if (input.secondaryHex !== undefined) updateData.secondaryHex = input.secondaryHex;
  if (input.tone !== undefined) updateData.tone = input.tone;
  if (input.group !== undefined) updateData.group = mapColorGroup(input.group);
  if (input.brightnessLevel !== undefined) {
    updateData.brightnessLevel = input.brightnessLevel;
  } else if (input.brightness !== undefined) {
    updateData.brightnessLevel = input.brightness === 'LIGHT' ? 8 : input.brightness === 'DARK' ? 3 : 6;
  }
  if (input.requiresBleach !== undefined) updateData.requiresBleach = input.requiresBleach;
  if (input.bleachRounds !== undefined) updateData.bleachRounds = input.bleachRounds;
  if (skinTones !== undefined) updateData.suitableSkinTones = skinTones;
  if (input.maintenanceLevel !== undefined) {
    updateData.maintenanceLevel = (input.maintenanceLevel === 'EASY' ? 'LOW' : input.maintenanceLevel) as CareEffort;
  }
  if (advice !== undefined) updateData.colorFadingAdvice = advice;
  if (input.swatchImageUrl !== undefined) updateData.swatchImageUrl = input.swatchImageUrl;
  if (input.samplePortraitUrl !== undefined) updateData.samplePortraitUrl = input.samplePortraitUrl;
  if (input.isTrending !== undefined) updateData.isTrending = input.isTrending;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.displayOrder !== undefined) updateData.displayOrder = input.displayOrder;

  let updatedColor: any;
  try {
    updatedColor = await prisma.hairColor.update({
      where: { id: existing.id },
      data: updateData,
    });
  } catch {
    updatedColor = memoryStore.updateHairColor(existing.id, updateData);
  }

  // MANDATORY TC1.12: Entity must be 'HAIR_COLOR'
  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'UPDATE',
    entity: 'HAIR_COLOR',
    entityId: existing.id,
    details: {
      before: { name: existing.name, hexColor: existing.hexColor },
      after: { name: updatedColor.name, hexColor: updatedColor.hexColor },
    },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/colors');
  safeRevalidatePath('/admin/colors');
  safeRevalidatePath('/');

  return NextResponse.json(serializeHairColor(updatedColor));
}

export const PATCH = PUT;

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { id } = params;
  let existing: any;
  try {
    existing = await prisma.hairColor.findFirst({
      where: {
        OR: [{ id }, { code: id }],
      },
    });
  } catch {
    existing = memoryStore.findHairColorById(id) || memoryStore.hairColors.find((c) => c.code === id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Hair color not found' }, { status: 404 });
  }

  try {
    await prisma.hairColor.delete({ where: { id: existing.id } });
  } catch {
    memoryStore.deleteHairColor(existing.id);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'DELETE',
    entity: 'HAIR_COLOR',
    entityId: existing.id,
    details: { name: existing.name },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/colors');
  safeRevalidatePath('/admin/colors');
  safeRevalidatePath('/');

  return NextResponse.json({ success: true, id: existing.id });
}
