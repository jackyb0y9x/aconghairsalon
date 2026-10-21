import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { HairstyleUpdateSchema, serializeHairstyle } from '@/lib/validations/content';
import { memoryStore } from '@/lib/memory-store';
import { slugify } from '@/lib/utils';
import { safeRevalidatePath } from '@/lib/safe-revalidate';
import { DEFAULT_HAIRSTYLES } from '@/lib/public-data';
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
  let style: any = null;

  const candidateSlugs = [id, slugify(id)];
  const defaultMatch = DEFAULT_HAIRSTYLES.find(
    (h: any) => h.id === id || h.slug === id || slugify(h.name || h.title) === slugify(id)
  );
  if (defaultMatch) {
    if (defaultMatch.slug) candidateSlugs.push(defaultMatch.slug);
    candidateSlugs.push(slugify(defaultMatch.name || defaultMatch.title));
  }

  try {
    style = await prisma.hairstyle.findFirst({
      where: {
        OR: [
          { id },
          { slug: { in: candidateSlugs } },
          ...(defaultMatch ? [{ title: defaultMatch.name || defaultMatch.title }] : []),
        ],
      },
      include: {
        category: true,
        services: true,
      },
    });
  } catch {
    // Database query failed
  }

  if (!style) {
    style = memoryStore.findHairstyleById(id) || defaultMatch;
  }

  if (!style) {
    style = {
      id,
      title: id,
      slug: slugify(id),
      category: { id: 'cat-featured', name: 'Kiểu Tóc Nổi Bật' },
      createdAt: new Date(),
      updatedAt: new Date(),
    };
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
  let existing: any = null;

  const candidateSlugs = [id, slugify(id)];
  const defaultMatch = DEFAULT_HAIRSTYLES.find(
    (h: any) => h.id === id || h.slug === id || slugify(h.name || h.title) === slugify(id)
  );
  if (defaultMatch) {
    if (defaultMatch.slug) candidateSlugs.push(defaultMatch.slug);
    candidateSlugs.push(slugify(defaultMatch.name || defaultMatch.title));
  }

  try {
    existing = await prisma.hairstyle.findFirst({
      where: {
        OR: [
          { id },
          { slug: { in: candidateSlugs } },
          ...(defaultMatch ? [{ title: defaultMatch.name || defaultMatch.title }] : []),
        ],
      },
      include: {
        category: true,
        services: true,
      },
    });
  } catch {
    // Database query failed
  }

  if (!existing) {
    existing = memoryStore.findHairstyleById(id) || defaultMatch || { id, slug: slugify(id), title: id };
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

  let updatedStyle: any = null;

  // 1. If existing was found in DB with real DB record, update by id
  if (existing && existing.createdAt && existing.id) {
    try {
      updatedStyle = await prisma.hairstyle.update({
        where: { id: existing.id },
        data: updateData,
        include: {
          category: true,
          services: true,
        },
      });
    } catch (updateErr) {
      console.warn('[Hairstyle Update] Prisma update failed:', updateErr);
    }
  }

  // 2. If not updated yet, try upserting by slug in DB
  if (!updatedStyle) {
    try {
      let catId = updateData.categoryId || existing?.categoryId;
      if (!catId) {
        const firstCat = await prisma.category.findFirst({ where: { type: 'HAIRSTYLE' } });
        catId = firstCat?.id;
      }
      const targetSlug = updateData.slug || existing?.slug || slugify(updateData.title || existing?.title || id);

      updatedStyle = await prisma.hairstyle.upsert({
        where: { slug: targetSlug },
        update: updateData,
        create: {
          title: updateData.title || existing?.title || existing?.name || 'Kiểu Tóc Mới',
          slug: targetSlug,
          summary: updateData.summary || existing?.summary || null,
          description: updateData.description || existing?.description || 'Mô tả kiểu tóc',
          coverImageUrl: updateData.coverImageUrl || existing?.coverImageUrl || '/images/default-hair.jpg',
          galleryImages: updateData.galleryImages || existing?.galleryImages || [],
          gender: (updateData.gender || existing?.gender || 'UNISEX') as any,
          length: (updateData.length || existing?.length || 'MEDIUM') as any,
          styleVibe: (updateData.styleVibe || updateData.style || existing?.styleVibe || existing?.style || 'KOREAN') as any,
          suitableFaces: (updateData.suitableFaces || existing?.suitableFaces || ['ALL']) as any,
          suitableTexture: (updateData.suitableTexture || existing?.suitableTexture || ['STRAIGHT']) as any,
          careEffort: (updateData.careEffort || updateData.careLevel || 'LOW') as any,
          priceRefMin: updateData.priceRefMin || existing?.priceRefMin || 350000,
          priceRefMax: updateData.priceRefMax || existing?.priceRefMax || 550000,
          careAdvice: updateData.careAdvice || existing?.careAdvice || null,
          stylingTips: updateData.stylingTips || existing?.stylingTips || null,
          isTrending: updateData.isTrending ?? existing?.isTrending ?? false,
          isFeatured: updateData.isFeatured ?? existing?.isFeatured ?? false,
          isActive: updateData.isActive ?? existing?.isActive ?? true,
          categoryId: catId,
        },
        include: {
          category: true,
          services: true,
        },
      });
    } catch (upsertErr) {
      console.warn('[Hairstyle Update] Prisma upsert failed, saving to memoryStore:', upsertErr);
    }
  }

  // 3. Fallback to memory store if database is offline or unreachable
  if (!updatedStyle) {
    updatedStyle = memoryStore.updateHairstyle(existing?.id || id, updateData) || {
      id: existing?.id || id,
      ...existing,
      ...updateData,
      updatedAt: new Date(),
    };
  } else {
    memoryStore.updateHairstyle(updatedStyle.id, updatedStyle);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'UPDATE',
    entity: 'HAIRSTYLE',
    entityId: existing?.id || id,
    details: {
      before: { title: existing?.title, priceRefMin: existing?.priceRefMin, careEffort: existing?.careEffort },
      after: { title: updatedStyle.title, priceRefMin: updatedStyle.priceRefMin, careEffort: updatedStyle.careEffort },
    },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/hairstyles');
  if (existing?.slug) safeRevalidatePath(`/hairstyles/${existing.slug}`);
  if (updatedStyle.slug) safeRevalidatePath(`/hairstyles/${updatedStyle.slug}`);
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
  const candidateSlugs = [id, slugify(id)];
  const defaultMatch = DEFAULT_HAIRSTYLES.find(
    (h: any) => h.id === id || h.slug === id || slugify(h.name || h.title) === slugify(id)
  );
  if (defaultMatch) {
    if (defaultMatch.slug) candidateSlugs.push(defaultMatch.slug);
    candidateSlugs.push(slugify(defaultMatch.name || defaultMatch.title));
  }

  let existing: any = null;
  try {
    existing = await prisma.hairstyle.findFirst({
      where: {
        OR: [
          { id },
          { slug: { in: candidateSlugs } },
          ...(defaultMatch ? [{ title: defaultMatch.name || defaultMatch.title }] : []),
        ],
      },
    });
  } catch {
    existing = memoryStore.findHairstyleById(id) || defaultMatch;
  }

  if (existing?.id) {
    try {
      await prisma.hairstyle.delete({ where: { id: existing.id } });
    } catch {
      memoryStore.deleteHairstyle(existing.id);
    }
  } else {
    memoryStore.deleteHairstyle(id);
  }

  await logAuditEvent({
    userId: auth.user.id,
    userEmail: auth.user.email,
    userName: auth.user.fullName,
    userRole: auth.user.role.name,
    action: 'DELETE',
    entity: 'HAIRSTYLE',
    entityId: existing?.id || id,
    details: { name: existing?.title || id, title: existing?.title || id },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/hairstyles');
  safeRevalidatePath('/admin/hairstyles');
  safeRevalidatePath('/');

  return NextResponse.json({ success: true, id: existing?.id || id });
}
