import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { authenticateAdminRequest } from '@/lib/auth';
import { logAuditEvent } from '@/services/audit';
import { HairColorCreateSchema, serializeHairColor } from '@/lib/validations/content';
import { memoryStore } from '@/lib/memory-store';
import { slugify } from '@/lib/utils';
import { safeRevalidatePath } from '@/lib/safe-revalidate';
import { ColorTone, ColorGroup, CareEffort } from '@prisma/client';

function mapColorGroup(groupStr?: string): ColorGroup {
  if (!groupStr) return 'BROWN';
  if (groupStr === 'ASH') return 'ASH_SMOKY';
  if (groupStr === 'CARAMEL') return 'BROWN';
  return groupStr as ColorGroup;
}

export async function GET(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get('search');
  const tone = searchParams.get('tone') as ColorTone | null;
  const group = searchParams.get('group');
  const requiresBleach = searchParams.get('requiresBleach');

  const where: any = {};
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { code: { contains: search, mode: 'insensitive' } },
    ];
  }
  if (tone) where.tone = tone;
  if (group) where.group = mapColorGroup(group);
  if (requiresBleach !== null && requiresBleach !== undefined && requiresBleach !== '') {
    where.requiresBleach = requiresBleach === 'true';
  }

  let colors: any[] = [];
  try {
    colors = await prisma.hairColor.findMany({
      where,
      orderBy: [{ displayOrder: 'asc' }, { createdAt: 'desc' }],
    });
  } catch {
    colors = memoryStore.findHairColors();
  }

  return NextResponse.json(colors.map(serializeHairColor));
}

export async function POST(request: NextRequest) {
  const auth = await authenticateAdminRequest(request);
  if ('errorResponse' in auth) {
    return auth.errorResponse;
  }

  const user = auth.user;
  const body = await request.json().catch(() => ({}));
  const parseResult = HairColorCreateSchema.safeParse(body);
  if (!parseResult.success) {
    return NextResponse.json(
      { error: 'Dữ liệu màu tóc không hợp lệ', details: parseResult.error.flatten().fieldErrors },
      { status: 400 }
    );
  }

  const input = parseResult.data;
  const hex = (input.hexCode || input.hexColor) as string;
  const skinTones = input.skinSuitability || input.suitableSkinTones || ['Da sáng', 'Da trung tính'];
  const advice = input.maintenanceAdvice || input.colorFadingAdvice || null;

  const code =
    input.code ||
    `CLR-${slugify(input.name).toUpperCase().substring(0, 6)}-${Math.floor(100 + Math.random() * 900)}`;

  const brightnessLevel =
    input.brightnessLevel !== undefined
      ? input.brightnessLevel
      : input.brightness === 'LIGHT'
      ? 8
      : input.brightness === 'DARK'
      ? 3
      : 6;

  const group = mapColorGroup(input.group);
  const maintenanceLevel = (input.maintenanceLevel === 'EASY' ? 'LOW' : (input.maintenanceLevel || 'MEDIUM')) as CareEffort;

  const colorData = {
    name: input.name,
    code,
    hexColor: hex,
    secondaryHex: input.secondaryHex || null,
    tone: input.tone || 'NEUTRAL',
    group,
    brightnessLevel,
    requiresBleach: input.requiresBleach ?? false,
    bleachRounds: input.bleachRounds ?? (input.requiresBleach ? 1 : 0),
    suitableSkinTones: skinTones,
    maintenanceLevel,
    colorFadingAdvice: advice,
    swatchImageUrl: input.swatchImageUrl || null,
    samplePortraitUrl: input.samplePortraitUrl || null,
    isTrending: input.isTrending ?? false,
    isActive: input.isActive ?? true,
    displayOrder: input.displayOrder ?? 0,
  };

  let newColor: any;
  try {
    newColor = await prisma.hairColor.create({
      data: colorData,
    });
  } catch {
    newColor = memoryStore.createHairColor(colorData);
  }

  // MANDATORY TC1.12: Entity must be 'HAIR_COLOR'
  await logAuditEvent({
    userId: user.id,
    userEmail: user.email,
    userName: user.fullName,
    userRole: user.role.name,
    action: 'CREATE',
    entity: 'HAIR_COLOR',
    entityId: newColor.id,
    details: { name: newColor.name, hexColor: newColor.hexColor, tone: newColor.tone },
    ipAddress: request.headers.get('x-forwarded-for') || '127.0.0.1',
    userAgent: request.headers.get('user-agent'),
  });

  safeRevalidatePath('/colors');
  safeRevalidatePath('/admin/colors');
  safeRevalidatePath('/');

  return NextResponse.json(serializeHairColor(newColor), { status: 201 });
}
