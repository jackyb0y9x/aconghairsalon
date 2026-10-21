import {
  PrismaClient,
  RoleName,
  CategoryType,
  GenderTarget,
  HairLength,
  FaceShape,
  HairTexture,
  CareEffort,
  StyleVibe,
  ColorTone,
  ColorGroup,
  BookingStatus,
  AuditAction,
} from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed for Lumière Hair Atelier...');

  // 1. CLEANUP EXISTING DATA (in reverse dependency order)
  console.log('🧹 Cleaning existing tables...');
  await prisma.auditLog.deleteMany();
  await prisma.session.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.beforeAfter.deleteMany();
  await prisma.banner.deleteMany();
  await prisma.article.deleteMany();
  await prisma.serviceCombo.deleteMany();
  await prisma.hairstyle.deleteMany();
  await prisma.service.deleteMany();
  await prisma.hairColor.deleteMany();
  await prisma.category.deleteMany();
  await prisma.user.deleteMany();
  await prisma.role.deleteMany();
  await prisma.siteSetting.deleteMany();

  // 2. SEED ROLES
  console.log('👥 Creating RBAC roles...');
  const roleSuperAdmin = await prisma.role.create({
    data: {
      name: RoleName.SUPER_ADMIN,
      description: 'Tổng quản trị hệ thống: toàn quyền cấu hình, nhân sự, tài chính và nghiệp vụ.',
      permissions: ['*'],
    },
  });

  const roleContentAdmin = await prisma.role.create({
    data: {
      name: RoleName.CONTENT_ADMIN,
      description: 'Quản trị nội dung: quản lý danh mục, kiểu tóc, bảng màu, dịch vụ, before/after và bài viết.',
      permissions: ['content:*', 'hairstyles:*', 'colors:*', 'services:*', 'banners:*', 'articles:*', 'before-after:*'],
    },
  });

  const roleBookingStaff = await prisma.role.create({
    data: {
      name: RoleName.BOOKING_STAFF,
      description: 'Lễ tân điều phối: quản lý và cập nhật trạng thái lịch hẹn, gán stylist, ghi chú lịch đặt.',
      permissions: ['bookings:*', 'hairstyles:read', 'services:read', 'stylists:read'],
    },
  });

  const roleEditor = await prisma.role.create({
    data: {
      name: RoleName.EDITOR,
      description: 'Biên tập viên: soạn thảo và tối ưu bài viết tin tức, cẩm nang chăm sóc tóc chuẩn SEO.',
      permissions: ['articles:*', 'hairstyles:read', 'colors:read'],
    },
  });

  // 3. SEED USERS & STYLISTS
  console.log('👤 Creating staff and master stylist accounts...');
  const defaultPasswordHash = bcrypt.hashSync('Admin@123456', 10);

  const superAdmin = await prisma.user.create({
    data: {
      email: 'admin@lumierehair.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Nguyễn Hoàng Nam',
      phone: '0908123456',
      avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
      roleId: roleSuperAdmin.id,
      isActive: true,
    },
  });

  const contentAdmin = await prisma.user.create({
    data: {
      email: 'content@lumierehair.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Trần Thu Thảo',
      phone: '0908111222',
      avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
      roleId: roleContentAdmin.id,
      isActive: true,
    },
  });

  const bookingStaff = await prisma.user.create({
    data: {
      email: 'booking@lumierehair.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Lê Minh Khang',
      phone: '0908333444',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
      roleId: roleBookingStaff.id,
      isActive: true,
    },
  });

  const editor = await prisma.user.create({
    data: {
      email: 'editor@lumierehair.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Phạm Hoàng Yến',
      phone: '0908555666',
      avatarUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=400&q=80',
      roleId: roleEditor.id,
      isActive: true,
    },
  });

  // Master Stylists
  const stylistKenji = await prisma.user.create({
    data: {
      email: 'stylist.kenji@lumierehair.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Kenji Đặng',
      phone: '0908777888',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80',
      roleId: roleContentAdmin.id,
      isStylist: true,
      bio: 'Artistic Director với 12 năm tu nghiệp tại Tokyo & Seoul. Chuyên gia hàng đầu về uốn sóng lơi tự nhiên và kỹ thuật cắt tóc hình khối Nhật Bản.',
      experienceYears: 12,
      specialties: ['Uốn sóng lơi Nhật - Hàn', 'Cắt Layer hình khối', 'Phục hồi cấu trúc Keratin'],
    },
  });

  const stylistElena = await prisma.user.create({
    data: {
      email: 'stylist.elena@lumierehair.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Elena Vũ',
      phone: '0908999000',
      avatarUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=400&q=80',
      roleId: roleContentAdmin.id,
      isStylist: true,
      bio: 'Master Colorist được chứng nhận bởi Olaplex & L’Oréal Professionnel. Bậc thầy kỹ thuật Balayage, nâng tone bạch kim và xử lý tóc tẩy hư tổn nặng.',
      experienceYears: 9,
      specialties: ['Tẩy màu Bạch Kim & Pastel', 'Balayage & Ombre chuyển sắc', 'Trị liệu phục hồi chuyên sâu'],
    },
  });

  const stylistAlex = await prisma.user.create({
    data: {
      email: 'stylist.alex@lumierehair.vn',
      passwordHash: defaultPasswordHash,
      fullName: 'Alex Trần',
      phone: '0908123789',
      avatarUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80',
      roleId: roleBookingStaff.id,
      isStylist: true,
      bio: 'Lead Barber & Men’s Stylist với 8 năm kinh nghiệm. Bậc thầy kỹ thuật Skin Fade, Pompadour cổ điển và Textured Crop phong cách Modern Urban.',
      experienceYears: 8,
      specialties: ['Skin Fade & Barbering', 'Textured Crop Hàn Quốc', 'Uốn phồng chân tóc nam'],
    },
  });

  // 4. SEED CATEGORIES
  console.log('📂 Creating categories...');
  const catMenHair = await prisma.category.create({
    data: {
      name: 'Kiểu Tóc Nam',
      slug: 'toc-nam',
      description: 'Bộ sưu tập kiểu tóc nam thời thượng từ Pompadour cổ điển đến Textured Crop cá tính.',
      type: CategoryType.HAIRSTYLE,
      imageUrl: 'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?auto=format&fit=crop&w=800&q=80',
      displayOrder: 1,
    },
  });

  const catWomenHair = await prisma.category.create({
    data: {
      name: 'Kiểu Tóc Nữ',
      slug: 'toc-nu',
      description: 'Những mẫu tóc nữ tinh tế, bồng bềnh chuẩn phong cách nàng thơ Hàn Quốc và Parisienne.',
      type: CategoryType.HAIRSTYLE,
      imageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80',
      displayOrder: 2,
    },
  });

  const catHairColors = await prisma.category.create({
    data: {
      name: 'Màu Nhuộm Thời Trang',
      slug: 'nhuom-mau-thoi-trang',
      description: 'Bảng màu nhuộm đa sắc từ tone nâu trầm ấm đến các gam màu khói, pastel sáng tạo.',
      type: CategoryType.SERVICE,
      imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
      displayOrder: 3,
    },
  });

  const catCareServices = await prisma.category.create({
    data: {
      name: 'Chăm Sóc & Phục Hồi',
      slug: 'cham-soc-phuc-hoi',
      description: 'Dịch vụ trị liệu da đầu dưỡng sinh, phục hồi tóc phủ lụa Nano Keratin và Olaplex.',
      type: CategoryType.SERVICE,
      imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80',
      displayOrder: 4,
    },
  });

  const catCutStyle = await prisma.category.create({
    data: {
      name: 'Cắt & Tạo Kiểu Master',
      slug: 'cat-tao-kieu',
      description: 'Thiết kế form tóc cá nhân hóa theo tỷ lệ khuôn mặt và chất tóc độc bản.',
      type: CategoryType.SERVICE,
      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
      displayOrder: 5,
    },
  });

  const catWavePerm = await prisma.category.create({
    data: {
      name: 'Uốn Sóng & Nâng Phồng',
      slug: 'uon-dinh-hinh',
      description: 'Công nghệ uốn sóng nước, uốn lạnh và nâng phồng chân tóc không gây khô xơ.',
      type: CategoryType.SERVICE,
      imageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80',
      displayOrder: 6,
    },
  });

  const catArticles = await prisma.category.create({
    data: {
      name: 'Cẩm Nang Tóc Đẹp',
      slug: 'kien-thuc-toc',
      description: 'Kiến thức chuyên sâu về chăm sóc tóc tẩy, xu hướng làm đẹp và bí quyết giữ màu bền lâu.',
      type: CategoryType.ARTICLE,
      imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      displayOrder: 7,
    },
  });

  // 5. SEED SERVICES
  console.log('✂️ Creating salon services & combos...');
  const serviceCutMen = await prisma.service.create({
    data: {
      title: 'Cắt Tạo Kiểu Master Stylist',
      slug: 'cat-tao-kieu-master-stylist',
      shortSummary: 'Tư vấn form tóc theo cấu trúc khuôn mặt, cắt tỉa chi tiết và sấy vuốt tạo kiểu cao cấp.',
      description: 'Dịch vụ cắt tóc chuẩn salon cao cấp bao gồm: Khảo sát chất tóc và dáng mặt, gội thư giãn massage da đầu bằng dầu gội thảo dược cao cấp, cắt định hình đường nét bằng kéo chuyên dụng Nhật Bản, cạo viền sắc nét, và sấy tạo kiểu bằng sáp/pomade chính hãng.',
      durationMinutes: 45,
      priceMin: 200000,
      priceMax: 350000,
      preCareAdvice: 'Nên chia sẻ trước với stylist về thói quen chăm sóc tóc hàng ngày và mong muốn độ dài mong muốn.',
      postCareAdvice: 'Sử dụng sáp mờ hoặc xịt muối biển để giữ nếp bồng bềnh tự nhiên suốt cả ngày.',
      imageUrl: 'https://images.unsplash.com/photo-1503951914875-452162b0f3f1?auto=format&fit=crop&w=800&q=80',
      isPopular: true,
      displayOrder: 1,
      categoryId: catCutStyle.id,
    },
  });

  const servicePerm = await prisma.service.create({
    data: {
      title: 'Uốn Máy Phục Hồi Protein Hàn Quốc',
      slug: 'uon-may-phuc-hoi-protein-han-quoc',
      shortSummary: 'Công nghệ uốn sóng setting nhiệt độ kiểm soát vi xử lý kết hợp khóa ẩm Protein tái sinh tủy tóc.',
      description: 'Kỹ thuật uốn setting hiện đại ứng dụng dòng thuốc uốn chứa 80% tinh chất dưỡng ẩm từ đậu nành và tơ tằm. Giúp lọn tóc vào nếp xoăn lơi mềm mại, bóng mượt tự nhiên, hoàn toàn không bị khô giòn ngọn tóc.',
      durationMinutes: 120,
      priceMin: 900000,
      priceMax: 1600000,
      preCareAdvice: 'Không nên gội đầu trước khi đến uốn tóc ít nhất 12 giờ.',
      postCareAdvice: 'Không gội đầu trong 48 giờ đầu tiên. Sử dụng kẹp càng cua cuộn tròn khi đi ngủ để giữ sóng bền trên 6 tháng.',
      imageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=800&q=80',
      isPopular: true,
      displayOrder: 2,
      categoryId: catWavePerm.id,
    },
  });

  const serviceDye = await prisma.service.create({
    data: {
      title: 'Nhuộm Màu Thời Trang Organic Không Amoniac',
      slug: 'nhuom-mau-thoi-trang-organic',
      shortSummary: 'Hạt màu siêu mịn thẩm thấu sâu, êm dịu cho da đầu nhạy cảm, độ bóng đa chiều.',
      description: 'Dòng sản phẩm màu nhuộm thuần chay chiết xuất từ tinh dầu Argan và hạt macca tự nhiên. Đảm bảo 100% không mùi hắc amoniac, không xót da đầu, giữ màu bền bỉ với độ ánh quang rực rỡ.',
      durationMinutes: 90,
      priceMin: 800000,
      priceMax: 1500000,
      preCareAdvice: 'Tránh gãi mạnh da đầu 24 giờ trước khi nhuộm.',
      postCareAdvice: 'Dùng dầu gội chuyên dụng không chứa sulfate (Color-safe) để tránh làm trôi hạt màu.',
      imageUrl: 'https://images.unsplash.com/photo-1527799820374-dcf8d9d4a388?auto=format&fit=crop&w=800&q=80',
      isPopular: true,
      displayOrder: 3,
      categoryId: catHairColors.id,
    },
  });

  const serviceBleach = await prisma.service.create({
    data: {
      title: 'Tẩy Tóc Bảo Vệ Liên Kết Olaplex Chuẩn Quốc Tế',
      slug: 'tay-toc-olaplex-chuan-quoc-te',
      shortSummary: 'Nâng sáng tông màu tóc an toàn với tinh chất nhân đôi liên kết lưu huỳnh Olaplex No.1.',
      description: 'Quy trình tẩy tóc cao cấp bảo vệ tối đa cấu trúc sợi tóc. Bột tẩy giàu dưỡng chất kết hợp Olaplex No.1 giúp tóc nâng sáng lên tới cấp độ 9-10 mà vẫn giữ được độ dai, đàn hồi và bóng khỏe tự nhiên.',
      durationMinutes: 90,
      priceMin: 950000,
      priceMax: 2000000,
      preCareAdvice: 'Ngưng sử dụng các sản phẩm hóa chất nhiệt ít nhất 1 tuần trước khi tẩy.',
      postCareAdvice: 'Bắt buộc sử dụng mặt nạ ủ tóc phục hồi và dầu gội tím khử vàng định kỳ 1-2 lần/tuần.',
      imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
      isPopular: false,
      displayOrder: 4,
      categoryId: catHairColors.id,
    },
  });

  const serviceKeratin = await prisma.service.create({
    data: {
      title: 'Phục Hồi Tóc Phủ Lụa Nano Keratin',
      slug: 'phuc-hoi-nano-keratin',
      shortSummary: 'Bổ sung Keratin thủy phân vào lõi tóc xơ rối, khóa ẩm và tái tạo biểu bì tóc suôn mượt.',
      description: 'Liệu trình đặc trị tóc cháy, tóc xơ nát do lạm dụng tẩy nhuộm. Phân tử Nano Keratin siêu nhỏ lấp đầy các lỗ hổng trên thân tóc, tạo lớp màng bọc bảo vệ óng ả như tơ lụa kéo dài suốt 3-4 tháng.',
      durationMinutes: 75,
      priceMin: 650000,
      priceMax: 1200000,
      preCareAdvice: 'Thích hợp thực hiện ngay sau các liệu trình tẩy hoặc nhuộm màu.',
      postCareAdvice: 'Sấy khô tóc hoàn toàn sau khi gội để kích hoạt lại lớp màng Keratin.',
      imageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80',
      isPopular: true,
      displayOrder: 5,
      categoryId: catCareServices.id,
    },
  });

  const serviceSpa = await prisma.service.create({
    data: {
      title: 'Gội Dưỡng Sinh Thảo Dược Hoàng Cung',
      slug: 'goi-duong-sinh-thao-duoc-hoang-cung',
      shortSummary: 'Thanh lọc da đầu với nước thảo dược nấu tươi, đả thông kinh lạc vùng cổ vai gáy.',
      description: 'Trải nghiệm spa thư giãn đỉnh cao với nước thảo mộc 12 vị thiên nhiên (bồ kết, hương nhu, sả chanh, vỏ bưởi). Kết hợp massage bấm huyệt cổ vai gáy, chườm mắt thảo dược và ngâm chân nước nóng đá muối Himalaya.',
      durationMinutes: 60,
      priceMin: 250000,
      priceMax: 450000,
      preCareAdvice: 'Mặc trang phục thoải mái để tận hưởng trọn vẹn quy trình massage cổ vai gáy.',
      postCareAdvice: 'Uống 1 tách trà hoa cúc ấm sau dịch vụ để cơ thể thải độc hiệu quả nhất.',
      imageUrl: 'https://images.unsplash.com/photo-1540555700478-4be289fbecef?auto=format&fit=crop&w=800&q=80',
      isPopular: false,
      displayOrder: 6,
      categoryId: catCareServices.id,
    },
  });

  // Combos
  const comboGentleman = await prisma.serviceCombo.create({
    data: {
      title: 'Gentleman Luxe Experience',
      slug: 'gentleman-luxe-experience',
      description: 'Gói đặc quyền dành riêng cho phái mạnh: Cắt tạo kiểu Master + Gội massage thảo dược + Uốn phồng chân tóc định hình + Vuốt Pomade cao cấp.',
      packagePrice: 490000,
      originalPrice: 650000,
      durationMinutes: 75,
      savingsPercent: 25,
      imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
      isFeatured: true,
      displayOrder: 1,
      services: {
        connect: [{ id: serviceCutMen.id }, { id: serviceSpa.id }],
      },
    },
  });

  const comboGoddess = await prisma.serviceCombo.create({
    data: {
      title: 'Seoul Goddess Wave & Care',
      slug: 'seoul-goddess-wave-and-care',
      description: 'Biến hóa diện mạo thần thái với combo toàn diện: Cắt Layer phong cách Hàn Quốc + Uốn sóng lơi trục lớn + Phục hồi phủ lụa Nano Keratin.',
      packagePrice: 1750000,
      originalPrice: 2350000,
      durationMinutes: 180,
      savingsPercent: 26,
      imageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
      isFeatured: true,
      displayOrder: 2,
      services: {
        connect: [{ id: servicePerm.id }, { id: serviceKeratin.id }],
      },
    },
  });

  const comboPlatinum = await prisma.serviceCombo.create({
    data: {
      title: 'Platinum Trendsetter Makeover',
      slug: 'platinum-trendsetter-makeover',
      description: 'Gói tẩy nhuộm đỉnh cao: 2 lần tẩy nâng sáng Olaplex + Nhuộm màu khói/bạch kim cao cấp + Hấp khóa hạt màu chuyên sâu.',
      packagePrice: 2600000,
      originalPrice: 3500000,
      durationMinutes: 240,
      savingsPercent: 26,
      imageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
      isFeatured: true,
      displayOrder: 3,
      services: {
        connect: [{ id: serviceBleach.id }, { id: serviceDye.id }],
      },
    },
  });

  // 6. SEED HAIRSTYLES (13 STYLES)
  console.log('💇 Creating hairstyles catalog...');
  const hairstylesData = [
    {
      title: 'Textured Crop Châu Á',
      slug: 'textured-crop-han-quoc',
      summary: 'Kiểu tóc ngắn năng động với lớp layer dập nhẹ phía trên, viền fade gọn gàng tôn trán.',
      description: 'Textured Crop là sự pha trộn hoàn hảo giữa vẻ nam tính và sự trẻ trung. Phần mái được cắt ngang trên lông mày tỉa texture nhấp nhô, hai bên mai được fade gọn giúp làm nổi bật góc hàm sắc sảo.',
      coverImageUrl: 'https://images.unsplash.com/photo-1507152832244-10d45c7eda57?auto=format&fit=crop&w=800&q=80',
      galleryImages: [
        'https://images.unsplash.com/photo-1507152832244-10d45c7eda57?auto=format&fit=crop&w=800&q=80',
        'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=800&q=80',
      ],
      gender: GenderTarget.MALE,
      length: HairLength.SHORT,
      suitableFaces: [FaceShape.OVAL, FaceShape.ROUND, FaceShape.HEART],
      suitableTexture: [HairTexture.STRAIGHT, HairTexture.THICK],
      careEffort: CareEffort.LOW,
      styleVibe: StyleVibe.KOREAN,
      careAdvice: 'Chỉ cần sấy khô tự nhiên và xoa một lượng nhỏ sáp mờ matte clay là tóc đã vào phom.',
      stylingTips: 'Sử dụng thêm một lớp xịt phồng muối biển pre-styling khi tóc còn hơi ẩm.',
      priceRefMin: 180000,
      priceRefMax: 250000,
      isTrending: true,
      isFeatured: true,
      categoryId: catMenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Side Part Pompadour Lịch Lãm',
      slug: 'modern-pompadour-quy-toc',
      summary: 'Biểu tượng lịch lãm của quý ông hiện đại với phần mái hất ngược tạo phồng cổ điển.',
      description: 'Kiểu tóc Pompadour mang lại khí chất thành đạt và tự tin. Phần tóc trên đỉnh được giữ độ dài lý tưởng 8-10cm, vuốt phồng ngược về sau kết hợp fade tàng hình mượt mà hai bên.',
      coverImageUrl: 'https://images.unsplash.com/photo-1563240619-44ec0047592c?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1563240619-44ec0047592c?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.MALE,
      length: HairLength.MEDIUM,
      suitableFaces: [FaceShape.SQUARE, FaceShape.OVAL, FaceShape.DIAMOND],
      suitableTexture: [HairTexture.THICK, HairTexture.STRAIGHT],
      careEffort: CareEffort.HIGH,
      styleVibe: StyleVibe.CLASSIC,
      careAdvice: 'Cần sấy định hình với lược tròn chuyên dụng và cố định bằng pomade gốc nước.',
      stylingTips: 'Sấy ngược hướng gió từ chân tóc để đạt được độ phồng tối đa 5-7cm.',
      priceRefMin: 250000,
      priceRefMax: 350000,
      isTrending: false,
      isFeatured: true,
      categoryId: catMenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Two-Block Layer Idol',
      slug: 'two-block-layer-lang-tu',
      summary: 'Thiết kế 2 tầng đặc trưng của các idol xứ kim chi, che khuyết điểm trán cao hoàn hảo.',
      description: 'Tóc Two-Block phân tách thành 2 khối rõ rệt: Khối dưới cắt ngắn gọn sát gáy, khối trên phủ xuống tỉa layer mềm mại giúp mái tóc có độ bay và nét thư sinh quyến rũ.',
      coverImageUrl: 'https://images.unsplash.com/photo-1581803118522-7b72a50f7e9f?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1581803118522-7b72a50f7e9f?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.MALE,
      length: HairLength.MEDIUM,
      suitableFaces: [FaceShape.OVAL, FaceShape.HEART, FaceShape.OBLONG],
      suitableTexture: [HairTexture.STRAIGHT, HairTexture.WAVY, HairTexture.FINE],
      careEffort: CareEffort.MEDIUM,
      styleVibe: StyleVibe.KOREAN,
      careAdvice: 'Nên kết hợp uốn nhẹ chân tóc để mái tóc luôn giữ được độ phồng bồng bềnh sau khi ngủ dậy.',
      stylingTips: 'Dùng ngón tay luồn nhẹ vuốt bung tự nhiên, không cần chải lược cứng.',
      priceRefMin: 200000,
      priceRefMax: 300000,
      isTrending: true,
      isFeatured: true,
      categoryId: catMenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Side Part 7/3 Rủ Hàn Quốc',
      slug: 'side-part-7-3-ru-hien-dai',
      summary: 'Tỷ lệ chia ngôi 7/3 kinh điển kết hợp phần mái rủ nhẹ tạo cảm giác ấm áp, lịch lãm.',
      description: 'Kiểu tóc linh hoạt phù hợp cả môi trường công sở sang trọng lẫn những buổi hẹn hò lãng mạn. Ranh giới chia ngôi tự nhiên uốn nhẹ hình chữ C tạo điểm nhấn tinh tế.',
      coverImageUrl: 'https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1617127365659-c47fa864d8bc?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.MALE,
      length: HairLength.MEDIUM,
      suitableFaces: [FaceShape.ALL],
      suitableTexture: [HairTexture.STRAIGHT, HairTexture.THICK],
      careEffort: CareEffort.MEDIUM,
      styleVibe: StyleVibe.BUSINESS,
      careAdvice: 'Dùng dầu dưỡng nhẹ và sấy nếp rẽ ngôi ngay sau khi gội đầu.',
      stylingTips: 'Xịt gôm mềm để giữ form mà không làm cứng sợi tóc.',
      priceRefMin: 220000,
      priceRefMax: 320000,
      isTrending: false,
      isFeatured: false,
      categoryId: catMenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Mullet Layer Phá Cách',
      slug: 'mullet-layer-pha-cach',
      summary: 'Phong cách nổi loạn hiện đại với phần đuôi gáy dài chạm cổ và mái tỉa bất đối xứng.',
      description: 'Mullet hiện đại được biến tấu với các lớp layer mềm mại, loại bỏ cảm giác nặng nề cổ điển. Thích hợp cho những bạn trẻ yêu thích thời trang đường phố và gu thẩm mỹ phá cách.',
      coverImageUrl: 'https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1542909168-82c3e7fdca5c?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.UNISEX,
      length: HairLength.MEDIUM,
      suitableFaces: [FaceShape.OVAL, FaceShape.ROUND, FaceShape.DIAMOND],
      suitableTexture: [HairTexture.WAVY, HairTexture.THICK],
      careEffort: CareEffort.MEDIUM,
      styleVibe: StyleVibe.STREETWEAR,
      careAdvice: 'Gội đầu với dầu gội dưỡng ẩm và sấy bung nhẹ phần đuôi tóc.',
      stylingTips: 'Vuốt một chút mousse tạo nếp uốn nhẹ ở ngọn tóc phía sau.',
      priceRefMin: 250000,
      priceRefMax: 400000,
      isTrending: true,
      isFeatured: false,
      categoryId: catMenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Buzz Cut Fade Sắc Nét',
      slug: 'buzz-cut-fade-sac-net',
      summary: 'Kiểu đầu đinh tối giản làm bật trọn vẹn từng đường nét góc cạnh trên khuôn mặt.',
      description: 'Đỉnh cao của sự gọn gàng và nam tính tối thượng. Đòi hỏi kỹ thuật Fade cạo sát tay nghề cao để tạo nên dải chuyển tiếp độ dài từ 0.5mm lên 6mm mượt mà như nhung.',
      coverImageUrl: 'https://images.unsplash.com/photo-1506634572416-48cdfe530110?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1506634572416-48cdfe530110?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.MALE,
      length: HairLength.VERY_SHORT,
      suitableFaces: [FaceShape.OVAL, FaceShape.SQUARE],
      suitableTexture: [HairTexture.THICK, HairTexture.COILY],
      careEffort: CareEffort.LOW,
      styleVibe: StyleVibe.MINIMALIST,
      careAdvice: 'Chăm sóc da đầu chống nắng và dưỡng ẩm, cắt dặm lại sau mỗi 2-3 tuần.',
      stylingTips: 'Không cần tạo kiểu, rửa mặt kiêm gội đầu cực kỳ tiện lợi.',
      priceRefMin: 150000,
      priceRefMax: 200000,
      isTrending: false,
      isFeatured: false,
      categoryId: catMenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Layer Nữ Phồng Chữ C',
      slug: 'layer-nu-phong-chu-c',
      summary: 'Các tầng layer ôm nhẹ gương mặt, ngọn tóc uốn cụp hình chữ C tạo hiệu ứng mặt thon gọn.',
      description: 'Mẫu tóc quốc dân được phái đẹp yêu thích nhất nhiều năm liền. Từng lọn tóc được cắt tỉa bậc thang tinh tế, đuôi tóc cụp nhẹ che phủ xương quai hàm và tôn nét thanh tú.',
      coverImageUrl: 'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.FEMALE,
      length: HairLength.LONG,
      suitableFaces: [FaceShape.ALL],
      suitableTexture: [HairTexture.STRAIGHT, HairTexture.FINE],
      careEffort: CareEffort.LOW,
      styleVibe: StyleVibe.KOREAN,
      careAdvice: 'Dùng lược tròn cuộn ngọn tóc khi sấy ấm là tóc sẽ tự động cụp vào nếp.',
      stylingTips: 'Thoa một giọt tinh dầu dưỡng bóng ở phần đuôi tóc để tránh chẻ ngọn.',
      priceRefMin: 350000,
      priceRefMax: 550000,
      isTrending: true,
      isFeatured: true,
      categoryId: catWomenHair.id,
      services: [serviceCutMen.id, servicePerm.id],
    },
    {
      title: 'Bob Ngắn Cá Tính Tự Nhiên',
      slug: 'bob-tia-tang-nhat-ban',
      summary: 'Mái tóc ngắn cá tính phong cách trẻ trung Á Đông, nhẹ tênh và tôn bờ vai gợi cảm.',
      description: 'Mẫu tóc ngắn năng động cắt ngang xương hàm kết hợp tỉa so le tinh tế. Giúp mái tóc trông dày dặn hơn gấp đôi và mang lại vẻ ngoài thông minh, sắc sảo cho quý cô hiện đại.',
      coverImageUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.FEMALE,
      length: HairLength.SHORT,
      suitableFaces: [FaceShape.OVAL, FaceShape.DIAMOND, FaceShape.HEART],
      suitableTexture: [HairTexture.STRAIGHT, HairTexture.THICK],
      careEffort: CareEffort.LOW,
      styleVibe: StyleVibe.JAPANESE,
      careAdvice: 'Sấy tóc hướng về phía trước và dùng một lượng dầu dưỡng nhẹ tạo độ bóng ướt (wet look).',
      stylingTips: 'Kẹp một bên tóc sau tai để khoe trọn khuyên tai và đường xương hàm.',
      priceRefMin: 300000,
      priceRefMax: 450000,
      isTrending: false,
      isFeatured: true,
      categoryId: catWomenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Uốn Sóng Lơi Dịu Dàng Nữ Tính',
      slug: 'uon-song-loi-nuoc-phap',
      summary: 'Những lọn sóng lơi buông lơi tự nhiên như nước chảy, mang lại thần thái kiêu sa thanh lịch.',
      description: 'Không cầu kỳ vào lọn tròn cứng nhắc, sóng lơi tự nhiên tạo cảm giác bồng bềnh thanh thoát. Mái tóc bồng bềnh chuyển động theo từng bước chân đầy mê hoặc.',
      coverImageUrl: 'https://images.unsplash.com/photo-1588516903720-8ceb67f9ef84?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1588516903720-8ceb67f9ef84?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.FEMALE,
      length: HairLength.LONG,
      suitableFaces: [FaceShape.OVAL, FaceShape.OBLONG, FaceShape.ROUND],
      suitableTexture: [HairTexture.WAVY, HairTexture.FINE],
      careEffort: CareEffort.MEDIUM,
      styleVibe: StyleVibe.AVANT_GARDE,
      careAdvice: 'Dùng kẹp càng cua cuộn nhẹ sau khi sấy tóc khô 80%.',
      stylingTips: 'Xịt một lớp khoáng dưỡng ẩm trước khi ra ngoài để bảo vệ sợi tóc trước khói bụi.',
      priceRefMin: 800000,
      priceRefMax: 1500000,
      isTrending: true,
      isFeatured: true,
      categoryId: catWomenHair.id,
      services: [servicePerm.id],
    },
    {
      title: 'Butterfly Cut Thần Thái (Layer Cánh Bướm)',
      slug: 'butterfly-cut-than-thai',
      summary: 'Các tầng tóc đan xen bồng bềnh mô phỏng sải cánh bướm, bay bổng và đầy sức sống.',
      description: 'Cơn sốt thời trang với sự hòa trộn của 2 độ dài: Tầng ngắn ôm sát cằm tạo hiệu ứng gương mặt thon và tầng dài thướt tha, tạo độ phồng tối đa cho mái tóc mỏng.',
      coverImageUrl: 'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.FEMALE,
      length: HairLength.LONG,
      suitableFaces: [FaceShape.ROUND, FaceShape.SQUARE, FaceShape.OVAL],
      suitableTexture: [HairTexture.THICK, HairTexture.WAVY],
      careEffort: CareEffort.MEDIUM,
      styleVibe: StyleVibe.CLASSIC,
      careAdvice: 'Sấy ngửa ra sau bằng lô cuốn cỡ lớn để tạo độ bay cho các tầng tóc.',
      stylingTips: 'Sử dụng xịt tạo kết cấu texture spray giúp các nếp tóc tách lớp rõ rệt.',
      priceRefMin: 400000,
      priceRefMax: 650000,
      isTrending: true,
      isFeatured: false,
      categoryId: catWomenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Wolf Cut Thập Niên 90',
      slug: 'wolf-cut-thap-nien-90',
      summary: 'Sự giao thoa đầy hoang dại giữa Mullet và Shag, biểu tượng phong cách phi giới tính.',
      description: 'Đặc trưng với phần đỉnh đầu phồng dày và xẹp dần về phía đuôi tóc với vô số lớp cắt xơ nhám. Mang đến nét đẹp bụi bặm, hoang dại và đậm chất Rock & Roll.',
      coverImageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.UNISEX,
      length: HairLength.MEDIUM,
      suitableFaces: [FaceShape.ALL],
      suitableTexture: [HairTexture.WAVY, HairTexture.THICK],
      careEffort: CareEffort.MEDIUM,
      styleVibe: StyleVibe.STREETWEAR,
      careAdvice: 'Để tóc khô tự nhiên kết hợp bóp nhẹ dầu dưỡng tạo nếp nhăn ngẫu hứng.',
      stylingTips: 'Nhuộm highlight ẩn (peekaboo) sẽ làm các lớp cắt wolf cut nổi bật hơn bao giờ hết.',
      priceRefMin: 350000,
      priceRefMax: 500000,
      isTrending: false,
      isFeatured: false,
      categoryId: catWomenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Pixie Cut Năng Động Quý Phái',
      slug: 'pixie-cut-nang-dong-quy-phai',
      summary: 'Tóc tém ngắn táo bạo làm nổi bật cổ thon, xương quai xanh và đôi mắt tinh anh.',
      description: 'Lựa chọn của những người phụ nữ bản lĩnh và tự tin. Từng đường kéo ôm trọn gáy, mái lệch dài vuốt xéo đem lại nét quyến rũ không thể cưỡng lại.',
      coverImageUrl: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.FEMALE,
      length: HairLength.VERY_SHORT,
      suitableFaces: [FaceShape.OVAL, FaceShape.HEART],
      suitableTexture: [HairTexture.FINE, HairTexture.STRAIGHT],
      careEffort: CareEffort.MEDIUM,
      styleVibe: StyleVibe.MINIMALIST,
      careAdvice: 'Cần sấy định hình mỗi sáng để giữ form ôm gáy hoàn hảo.',
      stylingTips: 'Dùng một chút gel tạo kiểu bóng nhẹ để tôn vẻ sang trọng.',
      priceRefMin: 300000,
      priceRefMax: 450000,
      isTrending: false,
      isFeatured: false,
      categoryId: catWomenHair.id,
      services: [serviceCutMen.id],
    },
    {
      title: 'Curtain Bangs Uốn Cụp Dịu Dàng',
      slug: 'curtain-bangs-uon-cup',
      summary: 'Mái bay rẽ đôi mềm mại như rèm cửa sổ, hóa giải mọi khuyết điểm thái dương lõm.',
      description: 'Phần tóc mái bay dài ngang gò má rẽ ngôi giữa hoặc 6/4 uốn cong nhẹ nhàng về sau. Giúp gương mặt trông thon dài, thanh thoát và đậm chất tiểu thư kiêu kỳ.',
      coverImageUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80',
      galleryImages: ['https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=800&q=80'],
      gender: GenderTarget.FEMALE,
      length: HairLength.MEDIUM,
      suitableFaces: [FaceShape.ROUND, FaceShape.OVAL, FaceShape.SQUARE],
      suitableTexture: [HairTexture.FINE, HairTexture.STRAIGHT],
      careEffort: CareEffort.LOW,
      styleVibe: StyleVibe.KOREAN,
      careAdvice: 'Cuộn lô mái 15 phút mỗi sáng khi trang điểm.',
      stylingTips: 'Sấy ấm vào lô cuốn và sấy lạnh 5 giây để khóa nếp cong hoàn hảo.',
      priceRefMin: 280000,
      priceRefMax: 420000,
      isTrending: true,
      isFeatured: false,
      categoryId: catWomenHair.id,
      services: [serviceCutMen.id, servicePerm.id],
    },
  ];

  for (const style of hairstylesData) {
    const { services, ...rest } = style;
    await prisma.hairstyle.create({
      data: {
        ...rest,
        services: {
          connect: services.map((sId) => ({ id: sId })),
        },
      },
    });
  }

  // 7. SEED HAIR COLORS (11 SWATCHES)
  console.log('🎨 Creating hair color swatches...');
  const colorsData = [
    {
      name: 'Nâu Tây Lạnh (Cold Mocha)',
      code: 'MOCHA-6.1',
      hexColor: '#59493E',
      secondaryHex: '#7C6A5D',
      tone: ColorTone.COOL,
      group: ColorGroup.BROWN,
      brightnessLevel: 6,
      requiresBleach: false,
      bleachRounds: 0,
      suitableSkinTones: ['Da sáng', 'Da trung tính', 'Da ngăm bánh mật'],
      maintenanceLevel: CareEffort.LOW,
      colorFadingAdvice: 'Màu phai chậm ra tông nâu trầm tự nhiên, không bao giờ lo bị ánh vàng cháy ngọn.',
      isTrending: true,
      displayOrder: 1,
    },
    {
      name: 'Xám Khói Ánh Bạc (Silver Smoke)',
      code: 'SILVER-9.11',
      hexColor: '#9E9D9B',
      secondaryHex: '#D1D5DB',
      tone: ColorTone.COOL,
      group: ColorGroup.ASH_SMOKY,
      brightnessLevel: 9,
      requiresBleach: true,
      bleachRounds: 2,
      suitableSkinTones: ['Da trắng sáng', 'Da hồng hào'],
      maintenanceLevel: CareEffort.HIGH,
      colorFadingAdvice: 'Cần gội dầu gội tím (Silver Shampoo) 2 lần/tuần để khử ánh vàng ố, màu sẽ phai ra bạch kim.',
      isTrending: true,
      displayOrder: 2,
    },
    {
      name: 'Trà Sữa Caramel (Caramel Milk Tea)',
      code: 'CARAMEL-7.32',
      hexColor: '#BFA082',
      secondaryHex: '#E5D3B8',
      tone: ColorTone.WARM,
      group: ColorGroup.BROWN,
      brightnessLevel: 7,
      requiresBleach: true,
      bleachRounds: 1,
      suitableSkinTones: ['Da sáng', 'Da trung tính'],
      maintenanceLevel: CareEffort.MEDIUM,
      colorFadingAdvice: 'Phai dần ra màu nâu hạt dẻ sáng dịu ngọt, dễ nhuộm đè màu khác sau 3 tháng.',
      isTrending: true,
      displayOrder: 3,
    },
    {
      name: 'Đỏ Rượu Cherry (Burgundy Velvet)',
      code: 'BURGUNDY-5.66',
      hexColor: '#6E2639',
      secondaryHex: '#9E3B53',
      tone: ColorTone.COOL,
      group: ColorGroup.RED_BURGUNDY,
      brightnessLevel: 5,
      requiresBleach: false,
      bleachRounds: 0,
      suitableSkinTones: ['Mọi tông da', 'Đặc biệt tôn da ngăm'],
      maintenanceLevel: CareEffort.LOW,
      colorFadingAdvice: 'Cực kỳ bền màu, phai dần sang màu nâu ánh đỏ quý phái.',
      isTrending: false,
      displayOrder: 4,
    },
    {
      name: 'Bạch Kim Nordic (Platinum Ice)',
      code: 'PLATINUM-10.0',
      hexColor: '#E5E3D8',
      secondaryHex: '#FAF7EE',
      tone: ColorTone.COOL,
      group: ColorGroup.BLONDE,
      brightnessLevel: 10,
      requiresBleach: true,
      bleachRounds: 3,
      suitableSkinTones: ['Da trắng hồng'],
      maintenanceLevel: CareEffort.HIGH,
      colorFadingAdvice: 'Bắt buộc chăm sóc phục hồi chuyên sâu Olaplex tại nhà để tránh gãy rụng.',
      isTrending: true,
      displayOrder: 5,
    },
    {
      name: 'Nâu Hạt Dẻ Cổ Điển (Classic Chestnut)',
      code: 'CHESTNUT-5.0',
      hexColor: '#4A3728',
      secondaryHex: '#6B4F3B',
      tone: ColorTone.NEUTRAL,
      group: ColorGroup.BROWN,
      brightnessLevel: 5,
      requiresBleach: false,
      bleachRounds: 0,
      suitableSkinTones: ['Mọi loại da'],
      maintenanceLevel: CareEffort.LOW,
      colorFadingAdvice: 'Màu nhuộm an toàn tuyệt đối, bóng khỏe và không lộ chân tóc khi mọc dài.',
      isTrending: false,
      displayOrder: 6,
    },
    {
      name: 'Nâu Rêu Khói Mờ (Smoky Matcha)',
      code: 'MATCHA-7.21',
      hexColor: '#686E5E',
      secondaryHex: '#8C9480',
      tone: ColorTone.COOL,
      group: ColorGroup.ASH_SMOKY,
      brightnessLevel: 7,
      requiresBleach: true,
      bleachRounds: 1,
      suitableSkinTones: ['Da sáng', 'Da trung tính'],
      maintenanceLevel: CareEffort.MEDIUM,
      colorFadingAdvice: 'Sau 4-6 tuần sẽ phai dần ra nâu rêu sáng nhẹ nhàng.',
      isTrending: true,
      displayOrder: 7,
    },
    {
      name: 'Hồng Pastel Ánh Khói (Smoky Rose)',
      code: 'ROSE-9.26',
      hexColor: '#D8A4AC',
      secondaryHex: '#F2CCD2',
      tone: ColorTone.WARM,
      group: ColorGroup.PASTEL,
      brightnessLevel: 9,
      requiresBleach: true,
      bleachRounds: 2,
      suitableSkinTones: ['Da trắng sáng'],
      maintenanceLevel: CareEffort.HIGH,
      colorFadingAdvice: 'Phai dần ra màu vàng kem bạch kim sau khoảng 3-4 tuần.',
      isTrending: true,
      displayOrder: 8,
    },
    {
      name: 'Đen Ánh Xanh Sapphire (Midnight Blue)',
      code: 'MIDNIGHT-2.1',
      hexColor: '#1E2530',
      secondaryHex: '#2E3A4D',
      tone: ColorTone.COOL,
      group: ColorGroup.BLACK_DARK,
      brightnessLevel: 2,
      requiresBleach: false,
      bleachRounds: 0,
      suitableSkinTones: ['Mọi loại da'],
      maintenanceLevel: CareEffort.LOW,
      colorFadingAdvice: 'Trong phòng nhìn đen tự nhiên, ra nắng bừng sáng ánh xanh sapphire huyền bí.',
      isTrending: false,
      displayOrder: 9,
    },
    {
      name: 'Vàng Mật Ong Ánh Đồng (Honey Amber)',
      code: 'HONEY-8.34',
      hexColor: '#C88A42',
      secondaryHex: '#E3AB67',
      tone: ColorTone.WARM,
      group: ColorGroup.BLONDE,
      brightnessLevel: 8,
      requiresBleach: true,
      bleachRounds: 1,
      suitableSkinTones: ['Da sáng', 'Da trung tính ấm'],
      maintenanceLevel: CareEffort.MEDIUM,
      colorFadingAdvice: 'Mang lại vẻ ấm áp rạng rỡ mùa lễ hội, phai ra tông vàng tây sang trọng.',
      isTrending: false,
      displayOrder: 10,
    },
    {
      name: 'Tím Khói Huyền Bí (Mystic Lavender)',
      code: 'LAVENDER-8.22',
      hexColor: '#8A7B94',
      secondaryHex: '#B2A3BC',
      tone: ColorTone.COOL,
      group: ColorGroup.FASHION_VIBRANT,
      brightnessLevel: 8,
      requiresBleach: true,
      bleachRounds: 2,
      suitableSkinTones: ['Da trắng sáng'],
      maintenanceLevel: CareEffort.HIGH,
      colorFadingAdvice: 'Phai dần sang ánh khói xám bạc cực tây sau 10 lần gội.',
      isTrending: true,
      displayOrder: 11,
    },
  ];

  for (const c of colorsData) {
    await prisma.hairColor.create({ data: c });
  }

  // 8. SEED BEFORE & AFTER SHOWCASE (4 ITEMS)
  console.log('🔄 Creating Before/After transformations...');
  const styleTwoBlock = await prisma.hairstyle.findUnique({ where: { slug: 'two-block-layer-lang-tu' } });
  const styleWaterWave = await prisma.hairstyle.findUnique({ where: { slug: 'uon-song-loi-nuoc-phap' } });
  const styleButterfly = await prisma.hairstyle.findUnique({ where: { slug: 'butterfly-cut-than-thai' } });

  await prisma.beforeAfter.createMany({
    data: [
      {
        title: 'Lột xác mái tóc xơ rối thành Two-Block Hàn Quốc lãng tử',
        description: 'Khách hàng có mái tóc chỉa, khô xơ do dùng gel sai cách. Master Alex Trần đã xử lý ép side định hình và cắt tỉa Two-Block mềm mại.',
        beforeImageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
        afterImageUrl: 'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=800&q=80',
        customerGender: GenderTarget.MALE,
        serviceId: serviceCutMen.id,
        hairstyleId: styleTwoBlock?.id,
        stylistId: stylistAlex.id,
        isFeatured: true,
        displayOrder: 1,
      },
      {
        title: 'Tái sinh mái tóc cháy ngọn thành sóng lơi Pháp bồng bềnh',
        description: 'Tóc khách hàng bị hư tổn độ 4 do uốn nhiệt sai cách trước đó. Master Kenji Đặng phục hồi Keratin trước khi vào thuốc uốn sóng lơi.',
        beforeImageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
        afterImageUrl: 'https://images.unsplash.com/photo-1580618672591-eb180b1a973f?auto=format&fit=crop&w=800&q=80',
        customerGender: GenderTarget.FEMALE,
        serviceId: servicePerm.id,
        hairstyleId: styleWaterWave?.id,
        stylistId: stylistKenji.id,
        isFeatured: true,
        displayOrder: 2,
      },
      {
        title: 'Biến hóa diện mạo ngoạn mục cùng tóc tẩy Bạch Kim Nordic',
        description: 'Nâng sáng an toàn 3 cấp độ từ nền tóc đen tự nhiên bằng Olaplex No.1, phủ màu bạch kim lạnh óng ả bởi Chuyên gia Elena Vũ.',
        beforeImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
        afterImageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
        customerGender: GenderTarget.FEMALE,
        serviceId: serviceBleach.id,
        stylistId: stylistElena.id,
        isFeatured: true,
        displayOrder: 3,
      },
      {
        title: 'Giải cứu tóc mỏng xẹp với Butterfly Cut tầng lớp sống động',
        description: 'Kỹ thuật cắt tỉa layer cánh bướm giúp tăng độ dày thị giác lên 200%, ngọn tóc bay bổng tự nhiên không cần sấy cầu kỳ.',
        beforeImageUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=800&q=80',
        afterImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
        customerGender: GenderTarget.FEMALE,
        serviceId: serviceCutMen.id,
        hairstyleId: styleButterfly?.id,
        stylistId: stylistKenji.id,
        isFeatured: false,
        displayOrder: 4,
      },
    ],
  });

  // 9. SEED BANNERS (4 ITEMS)
  console.log('🖼️ Creating dynamic hero banners...');
  await prisma.banner.createMany({
    data: [
      {
        title: 'Bộ Sưu Tập Tóc Thời Trang Công Nguyễn 2026',
        subtitle: 'Khám phá phong cách thanh lịch cùng Stylist hàng đầu tại Hải Phòng',
        badgeText: 'BỘ SƯU TẬP MỚI 2026',
        imageUrl: '/images/banners/hero-banner-bloganchoi-1.jpg',
        mobileImageUrl: '/images/banners/hero-banner-bloganchoi-1.jpg',
        linkUrl: '/hairstyles',
        ctaText: 'Khám Phá Bộ Sưu Tập',
        displayOrder: 1,
        isActive: true,
      },
      {
        title: 'Sắc Nâu Trà Sữa Tôn Da Xu Hướng 2026',
        subtitle: 'Tôn vinh làn da sáng mịn tự nhiên với bảng màu nhuộm cao cấp không amoniac',
        badgeText: 'MÀU NHUỘM HOT TREND',
        imageUrl: '/images/banners/hero-banner-bloganchoi-3.jpg',
        mobileImageUrl: '/images/banners/hero-banner-bloganchoi-3.jpg',
        linkUrl: '/colors',
        ctaText: 'Khám Phá Bảng Màu',
        displayOrder: 2,
        isActive: true,
      },
      {
        title: 'Nghệ Thuật Uốn Sóng & Nhuộm Nâu Tro Mờ Hải Phòng',
        subtitle: 'Độ bóng mượt hoàn hảo, không xơ rối với kỹ thuật phục hồi chuyên sâu',
        badgeText: 'DỊCH VỤ NỔI BẬT',
        imageUrl: '/images/banners/hero-banner-bloganchoi-2.jpg',
        mobileImageUrl: '/images/banners/hero-banner-bloganchoi-2.jpg',
        linkUrl: '/colors',
        ctaText: 'Tư Vấn Màu Nhuộm',
        displayOrder: 3,
        isActive: true,
      },
      {
        title: 'Nhuộm Nâu Xám Lanh Sang Trọng & Tôn Da',
        subtitle: 'Sắc màu thời thượng chuẩn xu hướng 2025-2026, nâng tầm khí chất',
        badgeText: 'MÀU NHUỘM HOT TREND',
        imageUrl: '/images/banners/hero-banner-bloganchoi-4.jpg',
        mobileImageUrl: '/images/banners/hero-banner-bloganchoi-4.jpg',
        linkUrl: '/booking',
        ctaText: 'Đặt Lịch Trải Nghiệm',
        displayOrder: 4,
        isActive: true,
      },
    ],
  });

  // 10. SEED ARTICLES (3 ARTICLES)
  console.log('📰 Creating SEO care advisory articles...');
  await prisma.article.createMany({
    data: [
      {
        title: 'Bí Quyết Giữ Màu Tóc Tẩy Lâu Phai: Hướng Dẫn Toàn Diện Từ Chuyên Gia',
        slug: 'bi-quyet-giu-mau-toc-tay-lau-phai',
        excerpt: 'Khám phá quy tắc vàng trong việc sử dụng dầu gội tím, nhiệt độ nước và chu kỳ ủ tóc giúp mái tóc tẩy giữ màu sáng trong veo suốt nhiều tháng.',
        content: `### 1. Tại sao tóc tẩy lại nhanh phai màu?
Khi tẩy tóc, hóa chất mở bung lớp biểu bì sợi tóc để loại bỏ hạt sắc tố melanin tự nhiên. Điều này vô tình khiến các hạt màu nhân tạo dễ dàng bị rửa trôi dưới tác động của nước và dầu gội có tính tẩy mạnh.

### 2. Ba nguyên tắc vàng giữ màu bền bỉ
* **Hạ nhiệt độ nước gội:** Luôn sử dụng nước mát hoặc hơi ấm nhẹ. Nước nóng làm biểu bì tóc giãn nở và cuốn trôi hạt màu chỉ sau vài lần gội.
* **Đầu tư dầu gội tím chuyên dụng:** Dầu gội tím chứa các hạt màu tím đối xứng trên bánh xe màu sắc, có nhiệm vụ trung hòa ánh vàng và đồng đỏ xỉn màu.
* **Ủ dưỡng phục hồi liên kết:** Các dòng sản phẩm bổ sung protein và liên kết lưu huỳnh như Olaplex No.3 giúp hàn gắn thân tóc, giữ hạt màu ở lại lâu hơn trong lõi tóc.`,
        coverImageUrl: 'https://images.unsplash.com/photo-1562322140-8baeececf3df?auto=format&fit=crop&w=800&q=80',
        tags: ['Dưỡng tóc tẩy', 'Chăm sóc màu', 'Olaplex', 'Mẹo salon'],
        metaTitle: 'Bí Quyết Giữ Màu Tóc Tẩy Lâu Phai Chuẩn Salon | Lumière Hair Atelier',
        metaDescription: 'Hướng dẫn chi tiết từ Master Colorist cách chăm sóc tóc tẩy, quy trình dùng dầu gội tím và mẹo phục hồi tóc sau tẩy an toàn.',
        authorId: stylistElena.id,
        categoryId: catArticles.id,
        isPublished: true,
        publishedAt: new Date('2026-10-01T08:00:00Z'),
        viewCount: 1420,
      },
      {
        title: 'Cách Chọn Kiểu Tóc Phù Hợp Từng Dáng Khuôn Mặt: Tròn, Vuông, Trái Xoan',
        slug: 'cach-chon-kieu-toc-phu-hop-tung-dang-mat',
        excerpt: 'Không có kiểu tóc đẹp nhất, chỉ có kiểu tóc hài hòa nhất với tỷ lệ khuôn mặt của bạn. Cùng chuyên gia phân tích bí quyết cân đối diện mạo.',
        content: `### 1. Mặt tròn (Round Face)
Ưu tiên kiểu tóc có độ phồng ở đỉnh đầu hoặc layer dài quá cằm như Curtain Bangs hoặc Layer chữ C để tạo cảm giác khuôn mặt thon dài thanh thoát. Tránh tóc bằng mái dày ngang trán.

### 2. Mặt vuông (Square Face)
Cần những đường cắt uốn lượn mềm mại như sóng lơi, mullet nhẹ hoặc tóc bob tỉa đuôi mềm để làm dịu góc xương hàm sắc sảo.

### 3. Mặt trái xoan (Oval Face)
Dáng mặt chuẩn tỉ lệ vàng! Bạn có thể tự tin trải nghiệm mọi phong cách từ Pixie siêu ngắn, Textured Crop cá tính cho đến tóc dài bồng bềnh.`,
        coverImageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=800&q=80',
        tags: ['Tư vấn kiểu tóc', 'Dáng mặt', 'Xu hướng tóc', 'Phong cách'],
        metaTitle: 'Hướng Dẫn Chọn Kiểu Tóc Phù Hợp Dáng Mặt | Lumière Hair Atelier',
        metaDescription: 'Khám phá bí quyết chọn mẫu tóc tôn vinh nét đẹp tự nhiên cho mặt tròn, mặt vuông và mặt trái xoan cùng các Master Stylist.',
        authorId: stylistKenji.id,
        categoryId: catArticles.id,
        isPublished: true,
        publishedAt: new Date('2026-10-08T09:30:00Z'),
        viewCount: 2310,
      },
      {
        title: 'Quy Trình Phục Hồi Tóc Hư Tổn Nặng Do Nhiệt & Hóa Chất Tại Nhà',
        slug: 'quy-trinh-phuc-hoi-toc-hu-ton-tai-nha',
        excerpt: 'Lộ trình 4 tuần cấp cứu mái tóc chẻ ngọn, khô xơ xác xơ với các bước trị liệu khoa học và liệu pháp massage kích thích nang tóc.',
        content: `### Giai đoạn 1: Thanh lọc và dừng nhiệt (Tuần 1)
Hạn chế tối đa máy sấy nhiệt độ cao, máy uốn và máy là. Để tóc khô tự nhiên 80% trước khi sấy gió mát.

### Giai đoạn 2: Cấp ẩm tầng sâu (Tuần 2-3)
Áp dụng phương pháp ủ nóng bằng tinh dầu tự nhiên (Argan, Jojoba) kết hợp mặt nạ ủ giàu Keratin 2 lần/tuần trong 20 phút.

### Giai đoạn 3: Khóa dưỡng chất và phục hồi biểu bì (Tuần 4)
Sử dụng serum dưỡng bóng chứa silicone hòa tan và bổ sung thực phẩm giàu biotin, kẽm trong khẩu phần ăn uống.`,
        coverImageUrl: 'https://images.unsplash.com/photo-1516975080664-ed2fc6a32937?auto=format&fit=crop&w=800&q=80',
        tags: ['Phục hồi tóc', 'Keratin', 'Tóc hư tổn', 'Dưỡng sinh'],
        metaTitle: 'Quy Trình 4 Tuần Phục Hồi Tóc Hư Tổn Tại Nhà | Lumière Hair Atelier',
        metaDescription: 'Cẩm nang phục hồi tóc cháy, tóc gãy rụng do uốn nhuộm nhiều lần với liệu trình chuẩn salon thực hiện ngay tại nhà.',
        authorId: editor.id,
        categoryId: catArticles.id,
        isPublished: true,
        publishedAt: new Date('2026-10-15T14:15:00Z'),
        viewCount: 980,
      },
    ],
  });

  // 11. SEED SITE SETTINGS
  console.log('⚙️ Creating site settings...');
  await prisma.siteSetting.create({
    data: {
      id: 'default_setting',
      brandName: 'Công Nguyễn Hair Salon',
      brandSlogan: 'Định Hình Phong Cách — Tỏa Sáng Khí Chất',
      logoUrl: '/images/brand/logo.svg',
      faviconUrl: '/favicon.ico',
      hotlinePrimary: '0988 888 888',
      hotlineSecondary: '0988 888 888',
      emailContact: 'contact@congnguyenhairsalon.vn',
      addressFull: 'Nguyệt Áng 3, An Khánh, Hải Phòng',
      googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3728.5!2d106.6!3d20.85!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x0%3A0x0!2zQW4gS2jDoW5oLCBI4bqjaSBQaMOybmc!5e0!3m2!1svi!2svn!4v1700000000000!5m2!1svi!2svn',
      openingHours: {
        monday_friday: '08:30 - 20:30',
        saturday_sunday: '08:00 - 21:00',
        holiday_notes: 'Mở cửa phục vụ xuyên suốt tất cả các ngày lễ trong năm',
      },
      socialLinks: {
        facebook: 'https://facebook.com/congnguyenhairsalon',
        instagram: 'https://instagram.com/congnguyenhairsalon',
        tiktok: 'https://tiktok.com/@congnguyenhairsalon',
        zalo: 'https://zalo.me/0988888888',
        youtube: 'https://youtube.com/@congnguyenhairsalon',
      },
      defaultSeoMetadata: {
        title: 'Công Nguyễn Hair Salon | Salon Tóc Nam & Nữ Hiện Đại Hải Phòng',
        description: 'Trải nghiệm dịch vụ làm tóc nam nữ hiện đại hàng đầu tại Nguyệt Áng 3, An Khánh, Hải Phòng với đội ngũ Stylist chuyên nghiệp và công nghệ thử tóc trực quan.',
        keywords: 'salon toc hai phong, cong nguyen hair salon, an khanh hai phong, cat toc nam nu, uon toc dep, nhuom toc dep',
        ogImageUrl: '/images/brand/og-cover.jpg',
      },
      footerContent: {
        copyright: '© 2026 Lumière Hair Atelier. Tất cả các quyền được bảo lưu.',
        licenseText: 'Giấy chứng nhận đăng ký kinh doanh số: 0316888999 do Sở Kế hoạch & Đầu tư TP.HCM cấp.',
        taxCode: '0316888999',
      },
    },
  });

  // 12. SEED SAMPLE BOOKINGS (5 STATES)
  console.log('📅 Creating sample bookings across 5 workflow states...');
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  await prisma.booking.createMany({
    data: [
      {
        bookingCode: 'LMR-20261019-001',
        customerName: 'Trịnh Hoàng Long',
        customerPhone: '0912345678',
        customerEmail: 'long.trinh@gmail.com',
        bookingDate: today,
        timeSlot: '09:30',
        comboId: comboGentleman.id,
        status: BookingStatus.PENDING,
        notes: 'Muốn cắt ngắn gọn gàng để đi dự tiệc cưới cuối tuần.',
        internalNotes: 'Khách mới từ kênh TikTok, cần gọi xác nhận trước 30 phút.',
        estimatedPrice: 490000,
        idempotencyKey: 'a1b2c3d4-e5f6-7890-abcd-111111111111',
      },
      {
        bookingCode: 'LMR-20261019-002',
        customerName: 'Vũ Thảo My',
        customerPhone: '0987654321',
        customerEmail: 'thaomy.vu@gmail.com',
        bookingDate: today,
        timeSlot: '14:00',
        serviceId: servicePerm.id,
        hairstyleRefId: styleWaterWave?.id,
        assignedStylistId: stylistKenji.id,
        status: BookingStatus.CONFIRMED,
        notes: 'Chỉ định làm với Master Kenji.',
        internalNotes: 'Đã gọi điện thoại xác nhận cọc lịch, chuẩn bị sẵn lô uốn trục 28mm.',
        estimatedPrice: 1200000,
        idempotencyKey: 'a1b2c3d4-e5f6-7890-abcd-222222222222',
      },
      {
        bookingCode: 'LMR-20261019-003',
        customerName: 'Hoàng Anh Tuấn',
        customerPhone: '0933445566',
        customerEmail: 'tuan.hoang@gmail.com',
        bookingDate: today,
        timeSlot: '10:00',
        serviceId: serviceCutMen.id,
        assignedStylistId: stylistAlex.id,
        status: BookingStatus.COMPLETED,
        notes: 'Cắt fade gọn hai bên mai.',
        internalNotes: 'Dịch vụ hoàn tất đúng giờ, khách rất hài lòng và tip stylist 100k.',
        estimatedPrice: 250000,
        idempotencyKey: 'a1b2c3d4-e5f6-7890-abcd-333333333333',
      },
      {
        bookingCode: 'LMR-20261019-004',
        customerName: 'Nguyễn Bích Phương',
        customerPhone: '0977889900',
        customerEmail: 'bichphuong@gmail.com',
        bookingDate: tomorrow,
        timeSlot: '16:30',
        serviceId: serviceBleach.id,
        status: BookingStatus.CANCELLED,
        notes: 'Muốn tẩy tóc bạch kim.',
        cancellationReason: 'Khách báo bận công tác đột xuất tại Hà Nội, xin hẹn lại tuần sau.',
        internalNotes: 'Đã hủy slot và mở lại lịch trống cho khách hàng vãng lai.',
        idempotencyKey: 'a1b2c3d4-e5f6-7890-abcd-444444444444',
      },
      {
        bookingCode: 'LMR-20261019-005',
        customerName: 'Đặng Quốc Huy',
        customerPhone: '0901239876',
        customerEmail: null,
        bookingDate: today,
        timeSlot: '11:30',
        serviceId: serviceCutMen.id,
        status: BookingStatus.NO_SHOW,
        notes: 'Đặt hẹn cắt tóc trưa.',
        cancellationReason: 'Khách không đến và nhân viên gọi 3 cuộc không nghe máy.',
        internalNotes: 'Đã dán nhãn ghi chú lịch sử No-Show vào số điện thoại này.',
        estimatedPrice: 200000,
        idempotencyKey: 'a1b2c3d4-e5f6-7890-abcd-555555555555',
      },
    ],
  });

  // 13. SEED AUDIT LOGS
  console.log('📝 Creating initial audit logs...');
  await prisma.auditLog.createMany({
    data: [
      {
        actorId: superAdmin.id,
        actorEmail: superAdmin.email,
        actorName: superAdmin.fullName,
        actorRole: RoleName.SUPER_ADMIN,
        action: AuditAction.CREATE,
        entityType: 'SystemInitialization',
        entityId: 'SYSTEM-ROOT',
        details: { message: 'Cơ sở dữ liệu salon khởi tạo thành công với bộ seed data chuẩn hóa.' },
        ipAddress: '127.0.0.1',
      },
      {
        actorId: superAdmin.id,
        actorEmail: superAdmin.email,
        actorName: superAdmin.fullName,
        actorRole: RoleName.SUPER_ADMIN,
        action: AuditAction.AUTH_LOGIN,
        entityType: 'UserSession',
        entityId: superAdmin.id,
        details: { provider: 'credentials', status: 'success' },
        ipAddress: '127.0.0.1',
      },
      {
        actorId: bookingStaff.id,
        actorEmail: bookingStaff.email,
        actorName: bookingStaff.fullName,
        actorRole: RoleName.BOOKING_STAFF,
        action: AuditAction.STATUS_CHANGE,
        entityType: 'Booking',
        entityId: 'LMR-20261019-002',
        details: { fromStatus: 'PENDING', toStatus: 'CONFIRMED', assignedStylist: 'Kenji Đặng' },
        ipAddress: '127.0.0.1',
      },
    ],
  });

  console.log('✨ Seed completed successfully! Database is primed and ready for operation.');
}

main()
  .catch((e) => {
    console.error('❌ Error executing seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
