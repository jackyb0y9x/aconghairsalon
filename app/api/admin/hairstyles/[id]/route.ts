import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { HairstyleUpdateSchema, serializeHairstyle } from '@/lib/validations/content';
import { memoryStore } from '@/lib/memory-store';
import { slugify } from '@/lib/utils';
import { safeRevalidatePath } from '@/lib/safe-revalidate';
import { FaceShape, HairTexture, CareEffort, StyleVibe } from '@prisma/client';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { id } = params;
  let style: any;
  try {
    style = await prisma.hairstyle.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        services: true,
      },
    });
  } catch {
    style = memoryStore.findHairstyleById(id) || memoryStore.hairstyles.find((h) => h.slug === id);
  }

  if (!style) {
    return NextResponse.json({ error: 'Hairstyle not found' }, { status: 404 });
  }

  return NextResponse.json(serializeHairstyle(style));
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
    existing = await prisma.hairstyle.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
      include: {
        category: true,
        services: true,
      },
    });
  } catch {
    existing = memoryStore.findHairstyleById(id) || memoryStore.hairstyles.find((h) => h.slug === id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Hairstyle not found' }, { status: 404 });
  }

  const body = await request.json().catch(() => ({}));
  const parseResult = HairstyleUpdateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu cập nhật không hợp lệ', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  const updateData: any = {};

  const nameVal = input.name || input.title;
  if (nameVal !== undefined) updateData.title = nameVal;

  if (input.slug !== undefined) {
    updateData.slug = slugify(input.slug);
  } else if (nameVal && !existing.slug) {
    updateData.slug = slugify(nameVal);
  }

  if (input.summary !== undefined) updateData.summary = input.summary;
  if (input.description !== undefined) updateData.description = input.description;

  if (input.coverImageUrl !== undefined) {
    updateData.coverImageUrl = input.coverImageUrl;
  } else if (input.images && input.images.length > 0) {
    updateData.coverImageUrl = input.images[0];
  }

  if (input.galleryImages !== undefined) {
    updateData.galleryImages = input.galleryImages;
  } else if (input.images && input.images.length > 1) {
    updateData.galleryImages = input.images.slice(1);
  }

  if (input.gender !== undefined) updateData.gender = input.gender;
  if (input.length !== undefined) updateData.length = input.length;

  if (input.suitableFaces !== undefined) {
    updateData.suitableFaces = input.suitableFaces;
  } else if (input.faceShape !== undefined) {
    updateData.suitableFaces = Array.isArray(input.faceShape) ? input.faceShape : [input.faceShape];
  }

  if (input.suitableTexture !== undefined) {
    updateData.suitableTexture = input.suitableTexture;
  } else if (input.texture !== undefined) {
    updateData.suitableTexture = Array.isArray(input.texture) ? input.texture : [input.texture];
  }

function mapStyleVibe(rawStyle?: string): StyleVibe {
  if (!rawStyle) return 'KOREAN';
  const s = rawStyle.toUpperCase();
  if (s === 'MODERN' || s === 'KOREAN') return 'KOREAN';
  if (s === 'FRENCH_ELEGANT' || s === 'ELEGANT' || s === 'FRENCH' || s === 'CLASSIC') return 'CLASSIC';
  if (s === 'JAPANESE') return 'JAPANESE';
  if (s === 'MINIMALIST') return 'MINIMALIST';
  if (s === 'STREETWEAR') return 'STREETWEAR';
  if (s === 'BUSINESS') return 'BUSINESS';
  if (s === 'AVANT_GARDE') return 'AVANT_GARDE';
  return 'CLASSIC';
}

function mapCareEffort(careVal?: string): CareEffort {
  if (!careVal) return 'MEDIUM';
  const c = careVal.toUpperCase();
  if (c === 'EASY' || c === 'LOW') return 'LOW';
  if (c === 'HIGH') return 'HIGH';
  return 'MEDIUM';
}

  if (input.careLevel !== undefined || input.careEffort !== undefined) {
    updateData.careEffort = mapCareEffort(input.careLevel || input.careEffort);
  }

  if (input.style !== undefined || input.styleVibe !== undefined) {
    updateData.styleVibe = mapStyleVibe(input.style || input.styleVibe);
  }

  if (input.price !== undefined) {
    updateData.priceRefMin = Number(input.price);
    updateData.priceRefMax = input.priceRefMax !== undefined ? Number(input.priceRefMax) : Number(input.price);
  } else {
    if (input.priceRefMin !== undefined) updateData.priceRefMin = Number(input.priceRefMin);
    if (input.priceRefMax !== undefined) updateData.priceRefMax = Number(input.priceRefMax);
  }

  if (input.careAdvice !== undefined) updateData.careAdvice = input.careAdvice;
  if (input.stylingTips !== undefined) updateData.stylingTips = input.stylingTips;
  if (input.isTrending !== undefined) updateData.isTrending = input.isTrending;
  if (input.isFeatured !== undefined) updateData.isFeatured = input.isFeatured;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;
  if (input.categoryId !== undefined) updateData.categoryId = input.categoryId;

  let updatedStyle: any;
  try {
    updatedStyle = await prisma.hairstyle.update({
      where: { id: existing.id },
      data: updateData,
      include: {
        category: true,
        services: true,
      },
    });
  } catch {
    updatedStyle = memoryStore.updateHairstyle(existing.id, updateData);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'UPDATE',
    entity: 'HAIRSTYLE',
    entityId: existing.id,
    details: {
      before: { title: existing.title, priceRefMin: existing.priceRefMin, careEffort: existing.careEffort },
      after: { title: updatedStyle.title, priceRefMin: updatedStyle.priceRefMin, careEffort: updatedStyle.careEffort },
    },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/hairstyles');
  safeRevalidatePath(`/hairstyles/${existing.slug}`);
  safeRevalidatePath(`/hairstyles/${updatedStyle.slug}`);
  safeRevalidatePath('/admin/hairstyles');
  safeRevalidatePath('/');

  return NextResponse.json(serializeHairstyle(updatedStyle));
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
    existing = await prisma.hairstyle.findFirst({
      where: {
        OR: [{ id }, { slug: id }],
      },
    });
  } catch {
    existing = memoryStore.findHairstyleById(id) || memoryStore.hairstyles.find((h) => h.slug === id);
  }

  if (!existing) {
    return NextResponse.json({ error: 'Hairstyle not found' }, { status: 404 });
  }

  try {
    await prisma.hairstyle.delete({ where: { id: existing.id } });
  } catch {
    memoryStore.deleteHairstyle(existing.id);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'DELETE',
    entity: 'HAIRSTYLE',
    entityId: existing.id,
    details: { name: existing.title, title: existing.title },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/hairstyles');
  safeRevalidatePath('/admin/hairstyles');
  safeRevalidatePath('/');

  return NextResponse.json({ success: true, id: existing.id });
}
