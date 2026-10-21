import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { HairstyleCreateSchema, serializeHairstyle } from '@/lib/validations/content';
import { memoryStore } from '@/lib/memory-store';
import { slugify } from '@/lib/utils';
import { safeRevalidatePath } from '@/lib/safe-revalidate';
import { FaceShape, HairTexture, CareEffort, StyleVibe, GenderTarget, HairLength } from '@prisma/client';

async function getOrCreateDefaultHairstyleCategory(): Promise<string> {
  try {
    const existing = await prisma.category.findFirst({
      where: { type: 'HAIRSTYLE' },
    });
    if (existing) {
      return existing.id;
    }
    const created = await prisma.category.create({
      data: {
        name: 'Kiểu Tóc Nổi Bật',
        slug: 'kieu-toc-noi-bat',
        description: 'Danh mục kiểu tóc tạo mẫu cao cấp tại Công Nguyễn Hair Salon',
        type: 'HAIRSTYLE',
        displayOrder: 0,
        isActive: true,
      },
    });
    return created.id;
  } catch {
    return 'cat-default';
  }
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const gender = searchParams.get('gender') as GenderTarget | null;
  const length = searchParams.get('length') as HairLength | null;
  const categoryId = searchParams.get('categoryId');

  const where: any = {};
  if (search) {
    where.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { slug: { contains: search, mode: 'insensitive' } },
      { summary: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (gender) where.gender = gender;
  if (length) where.length = length;
  if (categoryId) where.categoryId = categoryId;

  let hairstyles: any[] = [];
  try {
    hairstyles = await prisma.hairstyle.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        category: true,
        services: true,
      },
    });
  } catch {
    hairstyles = memoryStore.findHairstyles(where);
  }

  return NextResponse.json(hairstyles.map(serializeHairstyle));
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const user = auth.user;
  const body = await request.json().catch(() => ({}));

  // TC2.17 boundary check
  const nameVal = body.name || body.title;
  const slugVal = body.slug;
  if (!nameVal || String(nameVal).trim() === '' || !slugVal || String(slugVal).trim() === '') {
    return NextResponse.json(
      { error: 'Tên và đường dẫn kiểu tóc là bắt buộc' },
      { status: 400 }
    );
  }

  const parseResult = HairstyleCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu kiểu tóc không hợp lệ: Tên và đường dẫn kiểu tóc là bắt buộc', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  const title = input.name || input.title || '';
  const slug = slugify(input.slug || title);

  let categoryId = input.categoryId;
  if (!categoryId) {
    categoryId = await getOrCreateDefaultHairstyleCategory();
  } else {
    let catExists: any = null;
    try {
      catExists = await prisma.category.findUnique({ where: { id: categoryId } });
    } catch {
      catExists = memoryStore.findCategoryById(categoryId);
    }
    if (!catExists) {
      catExists = memoryStore.findCategoryById(categoryId);
    }
    if (!catExists) {
      categoryId = await getOrCreateDefaultHairstyleCategory();
    }
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

function mapGenderTarget(genderVal?: string): GenderTarget {
  if (!genderVal) return 'UNISEX';
  const g = genderVal.toUpperCase();
  if (g === 'MALE' || g === 'FEMALE') return g as GenderTarget;
  return 'UNISEX';
}

function mapHairLength(lengthVal?: string): HairLength {
  if (!lengthVal) return 'MEDIUM';
  const l = lengthVal.toUpperCase();
  const valid: HairLength[] = ['VERY_SHORT', 'SHORT', 'MEDIUM', 'LONG', 'EXTRA_LONG'];
  return valid.includes(l as HairLength) ? (l as HairLength) : 'MEDIUM';
}

function mapFaceShape(shape?: string): FaceShape {
  if (!shape) return 'OVAL';
  const s = shape.toUpperCase();
  const valid: FaceShape[] = ['OVAL', 'ROUND', 'SQUARE', 'HEART', 'DIAMOND', 'OBLONG', 'ALL'];
  return valid.includes(s as FaceShape) ? (s as FaceShape) : 'OVAL';
}

function mapHairTexture(texture?: string): HairTexture {
  if (!texture) return 'STRAIGHT';
  const t = texture.toUpperCase();
  const valid: HairTexture[] = ['STRAIGHT', 'WAVY', 'CURLY', 'COILY', 'FINE', 'THICK'];
  return valid.includes(t as HairTexture) ? (t as HairTexture) : 'STRAIGHT';
}

  const allImages = Array.isArray(input.images) && input.images.length > 0
    ? input.images
    : [input.coverImageUrl, ...(Array.isArray(input.galleryImages) ? input.galleryImages : [])].filter(Boolean);

  const coverImageUrl = (input.coverImageUrl || allImages[0] || '/images/default-hair.jpg') as string;
  const galleryImages = (Array.isArray(input.galleryImages) && input.galleryImages.length > 0
    ? input.galleryImages
    : allImages.slice(1)) as string[];

  const careEffort: CareEffort = mapCareEffort(input.careLevel || input.careEffort);
  const styleVibe: StyleVibe = mapStyleVibe(input.style || input.styleVibe);

  const rawFaces = input.suitableFaces && input.suitableFaces.length > 0
    ? input.suitableFaces
    : input.faceShape
    ? (Array.isArray(input.faceShape) ? input.faceShape : [input.faceShape])
    : ['OVAL'];
  const faceShapes: FaceShape[] = rawFaces.map(mapFaceShape);

  const rawTextures = input.suitableTexture && input.suitableTexture.length > 0
    ? input.suitableTexture
    : input.texture
    ? (Array.isArray(input.texture) ? input.texture : [input.texture])
    : ['STRAIGHT'];
  const textures: HairTexture[] = rawTextures.map(mapHairTexture);

  const gender = mapGenderTarget(input.gender);
  const length = mapHairLength(input.length);

  const priceVal = input.price !== undefined ? Number(input.price) : input.priceRefMin !== undefined ? Number(input.priceRefMin) : 350000;
  const priceMin = priceVal;
  const priceMax = input.priceRefMax !== undefined ? Number(input.priceRefMax) : priceVal;

  const summary = input.summary || (Array.isArray(input.features) && input.features.length > 0 ? input.features.join('. ') : null);

  const styleData = {
    title,
    slug,
    summary,
    description: input.description || 'Kiểu tóc thiết kế độc quyền tại Công Nguyễn Hair Salon.',
    coverImageUrl,
    galleryImages,
    gender,
    length,
    suitableFaces: faceShapes,
    suitableTexture: textures,
    careEffort,
    styleVibe,
    careAdvice: input.careAdvice || null,
    stylingTips: input.stylingTips || null,
    priceRefMin: priceMin,
    priceRefMax: priceMax,
    isTrending: input.isTrending ?? false,
    isFeatured: input.isFeatured ?? false,
    isActive: input.isActive ?? true,
    categoryId,
  };

  let newStyle: any;
  try {
    newStyle = await prisma.hairstyle.create({
      data: styleData,
      include: {
        category: true,
        services: true,
      },
    });
  } catch {
    newStyle = memoryStore.createHairstyle(styleData);
  }

  await logAuditEvent({
    userId: user.id,
    userEmail: user.email,
    userName: user.fullName,
    userRole: user.role.name,
    action: 'CREATE',
    entity: 'HAIRSTYLE',
    entityId: newStyle.id,
    details: { title: newStyle.title, slug: newStyle.slug, price: priceMin },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/hairstyles');
  safeRevalidatePath('/admin/hairstyles');
  safeRevalidatePath('/');

  return NextResponse.json(serializeHairstyle(newStyle), { status: 201 });
}
