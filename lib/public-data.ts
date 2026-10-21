import { prisma } from '@/lib/prisma';
import { memoryStore } from '@/lib/memory-store';
import { serializeSettings } from '@/lib/validations/settings';
import {
  serializeBanner,
  serializeArticle,
  serializeHairstyle,
  serializeHairColor,
  serializeBeforeAfter,
  serializeService,
  serializeServiceCombo,
  serializeCategory,
} from '@/lib/validations/content';

export const DEFAULT_SITE_SETTINGS = {
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
    weekend: '08:00 - 21:00',
    rawText: '08:30 - 20:30 Hàng ngày',
  },
  socialLinks: {
    facebook: 'https://facebook.com/congnguyenhairsalon',
    instagram: 'https://instagram.com/congnguyenhairsalon',
    tiktok: 'https://tiktok.com/@congnguyenhairsalon',
    zalo: 'https://zalo.me/0988888888',
    youtube: 'https://youtube.com/@congnguyenhairsalon',
  },
  defaultSeoMetadata: {
    title: 'Công Nguyễn Hair Salon - Đẳng Cấp Chăm Sóc & Tạo Mẫu Tóc Hải Phòng',
    description: 'Hệ thống salon tóc nam nữ hiện đại tại Nguyệt Áng 3, An Khánh, Hải Phòng với đội ngũ chuyên nghiệp và công nghệ thử tóc trực quan.',
    ogImage: '/images/og/home.jpg',
  },
  footerContent: {},
};

export const DEFAULT_BANNERS = [
  {
    id: 'ban-01',
    title: 'Bộ Sưu Tập Tóc Thời Trang Công Nguyễn 2026',
    subtitle: 'Khám phá phong cách thanh lịch cùng Stylist hàng đầu tại Hải Phòng',
    badgeText: 'BỘ SƯU TẬP MỚI 2026',
    imageUrl: '/images/banners/hero-banner-bloganchoi-1.jpg',
    ctaLink: '/hairstyles',
    linkUrl: '/hairstyles',
    ctaText: 'Khám phá ngay',
    order: 1,
    displayOrder: 1,
    active: true,
    isActive: true,
  },
  {
    id: 'ban-02',
    title: 'Sắc Nâu Trà Sữa Tôn Da Xu Hướng 2026',
    subtitle: 'Tôn vinh làn da sáng mịn tự nhiên với bảng màu nhuộm cao cấp không amoniac',
    badgeText: 'MÀU NHUỘM HOT TREND',
    imageUrl: '/images/banners/hero-banner-bloganchoi-3.jpg',
    ctaLink: '/colors',
    linkUrl: '/colors',
    ctaText: 'Khám phá bảng màu',
    order: 2,
    displayOrder: 2,
    active: true,
    isActive: true,
  },
  {
    id: 'ban-03',
    title: 'Nghệ Thuật Uốn Sóng & Nhuộm Nâu Tro Mờ Hải Phòng',
    subtitle: 'Độ bóng mượt hoàn hảo, không xơ rối với kỹ thuật phục hồi chuyên sâu',
    badgeText: 'DỊCH VỤ NỔI BẬT',
    imageUrl: '/images/banners/hero-banner-bloganchoi-2.jpg',
    ctaLink: '/colors',
    linkUrl: '/colors',
    ctaText: 'Tư vấn màu nhuộm',
    order: 3,
    displayOrder: 3,
    active: true,
    isActive: true,
  },
  {
    id: 'ban-04',
    title: 'Nhuộm Nâu Xám Lanh Sang Trọng & Tôn Da',
    subtitle: 'Sắc màu thời thượng chuẩn xu hướng 2025-2026, nâng tầm khí chất',
    badgeText: 'MÀU NHUỘM HOT TREND',
    imageUrl: '/images/banners/hero-banner-bloganchoi-4.jpg',
    ctaLink: '/booking',
    linkUrl: '/booking',
    ctaText: 'Đặt lịch trải nghiệm',
    order: 4,
    displayOrder: 4,
    active: true,
    isActive: true,
  },
];

export const DEFAULT_CATEGORIES = [
  { id: 'cat-men', name: 'Tóc Nam Hiện Đại', slug: 'toc-nam-hien-dai', type: 'HAIRSTYLE', displayOrder: 1 },
  { id: 'cat-women', name: 'Tóc Nữ Xu Hướng', slug: 'toc-nu-xu-huong', type: 'HAIRSTYLE', displayOrder: 2 },
  { id: 'cat-color', name: 'Màu Nhuộm & Phối Màu', slug: 'mau-nhuom-phoi-mau', type: 'SERVICE', displayOrder: 3 },
  { id: 'cat-care', name: 'Chăm Sóc & Phục Hồi', slug: 'cham-soc-phuc-hoi', type: 'SERVICE', displayOrder: 4 },
  { id: 'cat-cut', name: 'Cắt Gội Tạo Mẫu', slug: 'cat-goi-tao-mau', type: 'SERVICE', displayOrder: 5 },
  { id: 'cat-wave', name: 'Uốn Sóng & Duỗi Cúp', slug: 'uon-song-duoi-cup', type: 'SERVICE', displayOrder: 6 },
  { id: 'cat-article', name: 'Cẩm Nang Tóc & Làm Đẹp', slug: 'cam-nang-toc-lam-dep', type: 'ARTICLE', displayOrder: 7 },
];

export const DEFAULT_HAIRSTYLES = [
  // 1. Vietnamese Trending Hairstyles (Cropped from user provided sources: Thanks Barber Shop, Reddit Vietnam, Instagram Trending)
  {
    id: 'vn-sidepart-ru',
    name: 'Side Part 7/3 Rủ Hàn Quốc',
    title: 'Side Part 7/3 Rủ Hàn Quốc',
    slug: 'side-part-7-3-ru-han-quoc',
    summary: 'Kiểu tóc Side Part 7/3 rủ lãng tử phong cách nam thần thịnh hành nhất tại các barbershop Việt Nam.',
    description: 'Sự kết hợp hoàn hảo giữa nét cổ điển của Side Part 7/3 và phần mái rủ uốn lượn dấu phẩy bồng bềnh, che khuyết điểm trán cao và tạo chiều sâu cho gương mặt nam giới Châu Á.',
    gender: 'MALE',
    style: 'KOREAN',
    styleVibe: 'KOREAN',
    length: 'MEDIUM',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'ROUND', 'HEART', 'SQUARE'],
    texture: 'WAVY',
    suitableTexture: ['STRAIGHT', 'WAVY'],
    careLevel: 'EASY',
    careEffort: 'LOW',
    price: 320000,
    priceRefMin: 280000,
    priceRefMax: 380000,
    coverImageUrl: '/images/hairstyles/vietnam/vn-sidepart-ru.jpg',
    galleryImages: [
      '/images/hairstyles/vietnam/vn-sidepart-ru.jpg',
      '/images/hairstyles/vietnam/vn-sidepart-bay.jpg',
    ],
    tags: ['side-part', 'uon-ru', 'vietnam-trending', 'hot-2026'],
    features: ['Đường rẽ ngôi 7/3 bay nhẹ tự nhiên', 'Mái rủ bồng bềnh chuẩn nam thần', 'Tôn vinh góc nghiêng gương mặt'],
    careAdvice: 'Sấy ngược chiều chân tóc khi tóc còn ẩm 80%. Sử dụng sáp clay giữ nếp nhẹ nhàng.',
    stylingTips: 'Dùng lược răng thưa chải ngược rồi thả tự nhiên tạo độ tơi cho lọn tóc.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 2450,
  },
  {
    id: 'vn-layer-ruffled',
    name: 'Layer Ruffled Uốn Rối Nam',
    title: 'Layer Ruffled Uốn Rối Nam',
    slug: 'layer-ruffled-uon-roi-nam',
    summary: 'Layer tỉa tầng đan xen uốn rối nhẹ tạo phom bồng bềnh tự nhiên, cực kỳ hack độ dày cho tóc mỏng.',
    description: 'Layer Ruffled là xu hướng uốn rối tự nhiên cực hot tại Việt Nam, mang đến vẻ ngoài phóng khoáng, trẻ trung và năng động cho các bạn trẻ.',
    gender: 'MALE',
    style: 'STREETWEAR',
    styleVibe: 'STREETWEAR',
    length: 'SHORT',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'ROUND', 'DIAMOND'],
    texture: 'STRAIGHT',
    suitableTexture: ['STRAIGHT', 'FINE', 'THICK'],
    careLevel: 'EASY',
    careEffort: 'LOW',
    price: 350000,
    priceRefMin: 300000,
    priceRefMax: 420000,
    coverImageUrl: '/images/hairstyles/vietnam/vn-layer-ruffled.jpg',
    galleryImages: [
      '/images/hairstyles/vietnam/vn-layer-ruffled.jpg',
      '/images/hairstyles/vietnam/vn-layer-wavy.jpg',
    ],
    tags: ['layer-ruffled', 'uon-roi', 'vietnam-trending', 'hack-toc-day'],
    features: ['Tỉa tầng so le đan lọn', 'Tạo độ phồng gấp đôi cho tóc mỏng', 'Gội xong sấy khô là vào phom'],
    careAdvice: 'Dùng xịt tạo phồng trước khi sấy, thoa tinh dầu ngọn tóc dưỡng ẩm.',
    stylingTips: 'Bóp nhẹ ngọn tóc từ dưới lên khi sấy để giữ nguyên lọn sóng rối.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 1980,
  },
  {
    id: 'vn-layer-con-sau',
    name: 'Layer Con Sâu (Twist Perm Vietnam)',
    title: 'Layer Con Sâu (Twist Perm Vietnam)',
    slug: 'layer-con-sau-twist-perm-vietnam',
    summary: 'Kiểu uốn con sâu lốc xoáy cá tính, phong cách đường phố năng động được giới trẻ Việt Nam săn đón.',
    description: 'Uốn con sâu sử dụng kỹ thuật xoắn giấy bạc tạo ra các thớ tóc dập sóng nhỏ li ti, mang lại độ phồng cực đại và phong cách đường phố cực ngầu.',
    gender: 'MALE',
    style: 'STREETWEAR',
    styleVibe: 'STREETWEAR',
    length: 'SHORT',
    faceShape: 'ROUND',
    suitableFaces: ['ROUND', 'OVAL', 'SQUARE'],
    texture: 'WAVY',
    suitableTexture: ['STRAIGHT', 'WAVY', 'THICK'],
    careLevel: 'EASY',
    careEffort: 'LOW',
    price: 380000,
    priceRefMin: 350000,
    priceRefMax: 450000,
    coverImageUrl: '/images/hairstyles/vietnam/vn-layer-con-sau.jpg',
    galleryImages: [
      '/images/hairstyles/vietnam/vn-layer-con-sau.jpg',
    ],
    tags: ['uon-con-sau', 'twist-perm', 'vietnam-trending'],
    features: ['Sóng xoắn lốc xoáy độc đáo', 'Độ phồng tối đa không lo bẹp tóc', 'Giữ nếp bền từ 3-5 tháng'],
    careAdvice: 'Sử dụng dầu gội dưỡng ẩm sâu, hạn chế chải tóc bằng lược răng dày.',
    stylingTips: 'Chỉ cần sấy ráo và xoa nhẹ một chút sáp tạo nếp dạng bột.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 3120,
  },
  {
    id: 'vn-sidepart-phong',
    name: 'Side Part Phồng Chân Tóc',
    title: 'Side Part Phồng Chân Tóc',
    slug: 'side-part-phong-chan-toc-nam',
    summary: 'Uốn phồng chân tóc định hình ngôi rẽ sắc nét, tạo độ bồng sang trọng chuẩn quý ông công sở hiện đại.',
    description: 'Kỹ thuật uốn lạnh nâng chân tóc độc quyền giúp phần chân tóc đứng form tự nhiên mà không cần dùng gôm sấy mỗi ngày. Phù hợp cho dân văn phòng và doanh nhân.',
    gender: 'MALE',
    style: 'BUSINESS',
    styleVibe: 'BUSINESS',
    length: 'MEDIUM',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'ROUND', 'DIAMOND', 'SQUARE'],
    texture: 'STRAIGHT',
    suitableTexture: ['STRAIGHT', 'THICK'],
    careLevel: 'MEDIUM',
    careEffort: 'MEDIUM',
    price: 350000,
    priceRefMin: 300000,
    priceRefMax: 400000,
    coverImageUrl: '/images/hairstyles/vietnam/vn-sidepart-phong.jpg',
    galleryImages: [
      '/images/hairstyles/vietnam/vn-sidepart-phong.jpg',
    ],
    tags: ['side-part-phong', 'uon-chan-toc', 'quy-ong-lich-lam'],
    features: ['Nâng phồng chân tóc tự nhiên', 'Định hình nếp rẽ ngôi sắc sảo', 'Dễ dàng vuốt tạo kiểu'],
    careAdvice: 'Sấy ngược chiều chân tóc tạo phồng trước khi vuốt pomade.',
    stylingTips: 'Kết hợp pomade gốc nước để có độ bóng mượt sang trọng.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 1750,
  },
  {
    id: 'vn-curly-fade',
    name: 'Curly Hair High Drop Fade',
    title: 'Curly Hair High Drop Fade',
    slug: 'curly-hair-high-drop-fade',
    summary: 'Sự kết hợp giữa uốn xoăn tít phong cách hiện đại và đường cạo High Drop Fade cực nét hai bên.',
    description: 'Phần đỉnh đầu uốn xoăn lọn nhỏ nổi bật tương phản mạnh mẽ với hai bên mang tai được cạo mờ da đầu (Fade), tạo diện mạo cực kỳ cuốn hút và sành điệu.',
    gender: 'MALE',
    style: 'CLASSIC',
    styleVibe: 'CLASSIC',
    length: 'SHORT',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'SQUARE', 'HEART'],
    texture: 'CURLY',
    suitableTexture: ['CURLY', 'COILY', 'THICK'],
    careLevel: 'EASY',
    careEffort: 'LOW',
    price: 350000,
    priceRefMin: 320000,
    priceRefMax: 420000,
    coverImageUrl: '/images/hairstyles/vietnam/vn-curly-fade.jpg',
    galleryImages: [
      '/images/hairstyles/vietnam/vn-curly-fade.jpg',
    ],
    tags: ['curly-fade', 'high-fade', 'uon-xoan-nam'],
    features: ['Đường Fade sắc nét chuẩn thợ barber', 'Lọn xoăn bồng bềnh sống động', 'Mát mẻ, gọn gàng cho mùa hè'],
    careAdvice: 'Dùng dầu xả giữ ẩm và kem định hình lọn xoăn.',
    stylingTips: 'Bóp kem dưỡng lọn khi tóc còn ướt để giữ nguyên phom xoăn.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 2210,
  },
  {
    id: 'vn-layer-phong',
    name: 'Layer Phồng Textured Mullet',
    title: 'Layer Phồng Textured Mullet',
    slug: 'layer-phong-textured-mullet',
    summary: 'Phần gáy Mullet để dài vừa phải kết hợp mái tỉa layer bay phồng, tạo nét lãng tử chuẩn visual nghệ sĩ.',
    description: 'Mullet hiện đại được tinh chỉnh cho người Việt với độ dài gáy vừa chạm cổ, hai bên tỉa gọn và mái layer phồng tự nhiên, không bị quá gai góc mà vẫn đậm chất cá tính.',
    gender: 'MALE',
    style: 'KOREAN',
    styleVibe: 'KOREAN',
    length: 'MEDIUM',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'HEART', 'DIAMOND'],
    texture: 'STRAIGHT',
    suitableTexture: ['STRAIGHT', 'WAVY'],
    careLevel: 'MEDIUM',
    careEffort: 'MEDIUM',
    price: 360000,
    priceRefMin: 320000,
    priceRefMax: 450000,
    coverImageUrl: '/images/hairstyles/vietnam/vn-layer-phong.jpg',
    galleryImages: [
      '/images/hairstyles/vietnam/vn-layer-phong.jpg',
    ],
    tags: ['mullet-layer', 'textured-mullet', 'vietnam-trending'],
    features: ['Gáy đuôi tôm thanh thoát', 'Tầng layer phồng bồng bềnh', 'Phong cách nghệ sĩ lãng tử'],
    careAdvice: 'Tỉa định kỳ sau 4-5 tuần để giữ độ dài đuôi gáy chuẩn tỉ lệ.',
    stylingTips: 'Sấy vuốt xuôi phần gáy và đánh tơi phần đỉnh đầu.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 2890,
  },
  {
    id: 'vn-sidepart-bay',
    name: 'Side Part Bay Lãng Tử (Comma Hair)',
    title: 'Side Part Bay Lãng Tử (Comma Hair)',
    slug: 'side-part-bay-lang-tu-comma-hair',
    summary: 'Đường ngôi rẽ 6/4 uốn cong hình dấu phẩy bay lượn nhẹ nhàng về phía thái dương, che khuyết điểm trán cao.',
    description: 'Kiểu tóc dấu phẩy Comma Hair được ưa chuộng bậc nhất bởi các sao nam Việt Nam và Hàn Quốc. Mái tóc uốn lượn hình chữ C tạo vẻ ngoài dịu dàng, tri thức và điển trai.',
    gender: 'MALE',
    style: 'KOREAN',
    styleVibe: 'KOREAN',
    length: 'MEDIUM',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'ROUND', 'HEART'],
    texture: 'STRAIGHT',
    suitableTexture: ['STRAIGHT', 'FINE'],
    careLevel: 'EASY',
    careEffort: 'LOW',
    price: 320000,
    priceRefMin: 280000,
    priceRefMax: 380000,
    coverImageUrl: '/images/hairstyles/vietnam/vn-sidepart-bay.jpg',
    galleryImages: [
      '/images/hairstyles/vietnam/vn-sidepart-bay.jpg',
    ],
    tags: ['side-part-bay', 'comma-hair', 'vietnam-trending'],
    features: ['Mái dấu phẩy lượn sóng bay bổng', 'Cực kỳ tôn làn da và đôi mắt', 'Phù hợp cả đi học, đi làm và dự tiệc'],
    careAdvice: 'Dùng lược tròn uốn nhẹ phần ngọn mái khi sấy.',
    stylingTips: 'Xịt gôm khóa nếp nhẹ nhàng vào chân mái để giữ độ bay cả ngày.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 3450,
  },
  {
    id: 'vn-layer-chu-s',
    name: 'Layer Uốn Chữ S Tự Nhiên',
    title: 'Layer Uốn Chữ S Tự Nhiên',
    slug: 'layer-uon-chu-s-tu-nhien',
    summary: 'Sóng lượn chữ S mềm mại giúp tóc vào nếp tự nhiên mà không cần sấy tạo kiểu cầu kỳ sau khi gội.',
    description: 'Kỹ thuật uốn chữ S lọn to tạo chuyển động mềm mại cho các tầng tóc, mang lại cảm giác mái tóc dày bồng bềnh và thanh thoát.',
    gender: 'MALE',
    style: 'KOREAN',
    styleVibe: 'KOREAN',
    length: 'MEDIUM',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'ROUND', 'SQUARE'],
    texture: 'WAVY',
    suitableTexture: ['WAVY', 'STRAIGHT'],
    careLevel: 'EASY',
    careEffort: 'LOW',
    price: 340000,
    priceRefMin: 300000,
    priceRefMax: 400000,
    coverImageUrl: '/images/hairstyles/vietnam/vn-layer-chu-s.jpg',
    galleryImages: [
      '/images/hairstyles/vietnam/vn-layer-chu-s.jpg',
    ],
    tags: ['uon-chu-s', 'layer-nam', 'vietnam-trending'],
    features: ['Sóng chữ S uốn lượn tự nhiên', 'Không cần sấy vuốt phức tạp', 'Phù hợp mọi khuôn mặt'],
    careAdvice: 'Dùng dầu dưỡng vuốt ngọn tóc sau khi sấy khô.',
    stylingTips: 'Dùng tay bóp nhẹ tóc khi sấy để sóng giữ được lọn tròn đẹp.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 1870,
  },
  {
    id: 'vn-texture-ivy',
    name: 'Textured Ivy League Fade',
    title: 'Textured Ivy League Fade',
    slug: 'textured-ivy-league-fade',
    summary: 'Kiểu tóc Ivy League vuốt dựng đỉnh đầu kết hợp taper fade hai bên gọn gàng, toát lên phong thái chỉn chu, quyết đoán.',
    description: 'Xu hướng tóc nam được yêu thích hàng đầu năm 2026. Phần mái tỉa nhọn vuốt dựng tự nhiên kết hợp cạo fade gáy mang lại vẻ ngoài nam tính, sang trọng và tràn đầy năng lượng.',
    gender: 'MALE',
    style: 'BUSINESS',
    styleVibe: 'BUSINESS',
    length: 'SHORT',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'SQUARE', 'DIAMOND'],
    texture: 'STRAIGHT',
    suitableTexture: ['STRAIGHT', 'THICK'],
    careLevel: 'EASY',
    careEffort: 'LOW',
    price: 280000,
    priceRefMin: 250000,
    priceRefMax: 350000,
    coverImageUrl: '/images/hairstyles/vietnam/vn-texture-ivy.jpg',
    galleryImages: [
      '/images/hairstyles/vietnam/vn-texture-ivy.jpg',
      '/images/hairstyles/vietnam/vn-barber-fade-line.jpg',
    ],
    tags: ['ivy-league', 'short-quiff', 'vietnam-trending', 'hot-2026'],
    features: ['Vuốt dựng đỉnh đầu gọn gàng', 'Taper fade sắc sảo', 'Tôn vinh trọn vẹn đường nét xương hàm'],
    careAdvice: 'Gội sạch da đầu mỗi ngày và cắt tỉa duy trì phom sau 2-3 tuần.',
    stylingTips: 'Xoa đều sáp clay lên lòng bàn tay và vuốt hất ngược từ chân tóc lên trên.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 4100,
  },
  {
    id: 'vn-barber-fade-line',
    name: 'Textured Crop Fade Tattoo Line (Barber VN)',
    title: 'Textured Crop Fade Tattoo Line (Barber VN)',
    slug: 'textured-crop-fade-ke-line-barber-vn',
    summary: 'Được cắt tỉa trực tiếp bởi các tay kéo Barber Việt Nam với đường Fade mượt mà và đường cạo kẻ line nghệ thuật sắc bén.',
    description: 'Mẫu tóc lấy cảm hứng trực tiếp từ phong trào Barbering tại Việt Nam (Reddit r/Barber & Thanks Barber Shop). Phần mái bấm ngố tỉa texture kết hợp đường kẻ line tattoo tạo điểm nhấn sắc sảo.',
    gender: 'MALE',
    style: 'STREETWEAR',
    styleVibe: 'STREETWEAR',
    length: 'SHORT',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'SQUARE', 'ROUND'],
    texture: 'STRAIGHT',
    suitableTexture: ['STRAIGHT', 'THICK'],
    careLevel: 'EASY',
    careEffort: 'LOW',
    price: 280000,
    priceRefMin: 250000,
    priceRefMax: 350000,
    coverImageUrl: '/images/hairstyles/vietnam/vn-barber-fade-line.jpg',
    galleryImages: [
      '/images/hairstyles/vietnam/vn-barber-fade-line.jpg',
      '/images/hairstyles/vietnam/vn-texture-ivy.jpg',
    ],
    tags: ['barber-vietnam', 'fade-line', 'textured-crop', 'hair-tattoo'],
    features: ['Kẻ line nghệ thuật tinh xảo', 'Độ chuyển màu Fade siêu mượt', 'Cực kỳ cá tính và phá cách'],
    careAdvice: 'Duy trì đường kẻ cạo sau 10-14 ngày để giữ nét sắc cạnh.',
    stylingTips: 'Sử dụng lược cào nhẹ phần mái xuôi xuống trán.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 3820,
  },
  {
    id: 'vn-crimson-textured-twoblock',
    name: 'Textured Two-Block Nhuộm Đỏ Rượu Vang',
    title: 'Textured Two-Block Nhuộm Đỏ Rượu Vang',
    slug: 'textured-two-block-nhuom-do-ruou-vang',
    summary: 'Combo cắt Two-Block tỉa tầng kết hợp nhuộm đỏ rượu vang Burgundy rực rỡ, cá tính và cực kỳ tôn làn da Châu Á.',
    description: 'Phong cách dẫn đầu xu hướng Instagram 2026. Sự hòa quyện giữa kỹ thuật cắt Two-Block hiện đại và tone màu đỏ rượu vang Burgundy tôn vinh khí chất cuốn hút, nổi bật trước đám đông.',
    gender: 'MALE',
    style: 'STREETWEAR',
    styleVibe: 'STREETWEAR',
    length: 'MEDIUM',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'HEART', 'DIAMOND'],
    texture: 'STRAIGHT',
    suitableTexture: ['STRAIGHT', 'THICK'],
    careLevel: 'MEDIUM',
    careEffort: 'MEDIUM',
    price: 680000,
    priceRefMin: 650000,
    priceRefMax: 850000,
    coverImageUrl: '/images/hairstyles/vietnam/vn-crimson-textured-twoblock.jpg',
    galleryImages: [
      '/images/hairstyles/vietnam/vn-crimson-textured-twoblock.jpg',
      '/images/hairstyles/vietnam/vn-ashbrown-dropfade-crop.jpg',
    ],
    tags: ['two-block', 'nhuom-do-ruou', 'trending-2026', 'instagram-style'],
    features: ['Sắc đỏ rượu vang quý phái', 'Tỉa tầng texture sống động', 'Hai bên undercut gọn gàng tôn xương hàm'],
    careAdvice: 'Dùng dầu gội giữ màu chuyên dụng không chứa sulfate.',
    stylingTips: 'Xịt dưỡng bóng và sáp mềm tạo lọn tóc tơi bồng.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 4620,
  },
  {
    id: 'vn-ashbrown-dropfade-crop',
    name: 'Drop Fade Crop Nhuộm Nâu Khói Ánh Rêu',
    title: 'Drop Fade Crop Nhuộm Nâu Khói Ánh Rêu',
    slug: 'drop-fade-crop-nhuom-nau-khoi',
    summary: 'Sự kết hợp hoàn hảo giữa kỹ thuật cắt Drop Fade hiện đại và sắc nâu khói trầm ấm, tôn vẻ điển trai tự nhiên.',
    description: 'Kiểu tóc Crop hạ viền gáy (Drop Fade) kết hợp tone nhuộm nâu khói ánh rêu thời thượng. Mang lại diện mạo thư sinh, lịch lãm nhưng vẫn vô cùng phá cách.',
    gender: 'MALE',
    style: 'KOREAN',
    styleVibe: 'KOREAN',
    length: 'SHORT',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'SQUARE', 'HEART'],
    texture: 'WAVY',
    suitableTexture: ['WAVY', 'THICK', 'STRAIGHT'],
    careLevel: 'EASY',
    careEffort: 'LOW',
    price: 620000,
    priceRefMin: 550000,
    priceRefMax: 750000,
    coverImageUrl: '/images/hairstyles/vietnam/vn-ashbrown-dropfade-crop.jpg',
    galleryImages: [
      '/images/hairstyles/vietnam/vn-ashbrown-dropfade-crop.jpg',
    ],
    tags: ['drop-fade', 'crop-nau-khoi', 'trending-2026'],
    features: ['Tone nâu khói tôn màu da sáng', 'Đường Drop Fade ôm cong vành tai', 'Mái tỉa nhuyễn tự nhiên'],
    careAdvice: 'Gội nước mát để màu nhuộm bền lâu trên 2 tháng.',
    stylingTips: 'Sấy khô rồi rắc bột tạo phồng texture dust lên đỉnh đầu.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 3950,
  },
  {
    id: 'vn-curly-s-loi',
    name: 'Curly S Lơi Hàn Quốc Nam',
    title: 'Curly S Lơi Hàn Quốc Nam',
    slug: 'curly-s-loi-han-quoc-nam',
    summary: 'Uốn sóng lơi nhẹ nhàng, các lọn tóc xoăn đan xen tự nhiên mang lại vẻ ngoài cuốn hút và thư sinh.',
    description: 'Kiểu tóc uốn xoăn nhẹ nhàng lọn to tạo cảm giác thư sinh, lãng mạn. Rất phù hợp với các bạn trẻ yêu thích phong cách soft boy Hàn Quốc thịnh hành tại Việt Nam.',
    gender: 'MALE',
    style: 'KOREAN',
    styleVibe: 'KOREAN',
    length: 'MEDIUM',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'HEART', 'DIAMOND'],
    texture: 'CURLY',
    suitableTexture: ['CURLY', 'WAVY'],
    careLevel: 'EASY',
    careEffort: 'LOW',
    price: 350000,
    priceRefMin: 320000,
    priceRefMax: 420000,
    coverImageUrl: '/images/hairstyles/vietnam/vn-curly-s-loi.jpg',
    galleryImages: [
      '/images/hairstyles/vietnam/vn-curly-s-loi.jpg',
    ],
    tags: ['curly-s-loi', 'song-loi-nam', 'vietnam-trending'],
    features: ['Lọn xoăn sóng lơi mềm mại', 'Tạo độ bồng dày cho mái tóc', 'Không kén dáng mặt'],
    careAdvice: 'Dùng dầu xả đều đặn và bóp nhẹ giữ lọn khi còn ướt.',
    stylingTips: 'Sấy loa khuếch tán gió nhẹ để lọn xoăn vào nếp hoàn hảo.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 2630,
  },
  {
    id: 'vn-uon-chu-s-xoan',
    name: 'Uốn Chữ S Xoăn Bồng Bềnh Nam',
    title: 'Uốn Chữ S Xoăn Bồng Bềnh Nam',
    slug: 'uon-chu-s-xoan-bong-benh-nam',
    summary: 'Lọn xoăn chữ S xếp tầng bồng bềnh phong cách idol K-pop, tôn lên sự trẻ trung và ấm áp.',
    description: 'Sóng tóc uốn hình chữ S kết hợp kỹ thuật tỉa chuyển động mang đến độ phồng hoàn hảo và diện mạo cuốn hút như các idol âm nhạc.',
    gender: 'MALE',
    style: 'KOREAN',
    styleVibe: 'KOREAN',
    length: 'MEDIUM',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'ROUND', 'HEART'],
    texture: 'WAVY',
    suitableTexture: ['WAVY', 'THICK'],
    careLevel: 'MEDIUM',
    careEffort: 'MEDIUM',
    price: 360000,
    priceRefMin: 320000,
    priceRefMax: 450000,
    coverImageUrl: '/images/hairstyles/vietnam/vn-uon-chu-s-xoan.jpg',
    galleryImages: [
      '/images/hairstyles/vietnam/vn-uon-chu-s-xoan.jpg',
    ],
    tags: ['uon-chu-s-xoan', 'vietnam-trending'],
    features: ['Sóng chữ S xếp tầng bồng bềnh', 'Che khuyết điểm thái dương hóp', 'Tạo cảm giác thân thiện, ấm áp'],
    careAdvice: 'Ủ tóc với tinh dầu argan tuần 1 lần để lọn xoăn luôn óng ả.',
    stylingTips: 'Sấy bằng tay luồn chân tóc nâng phồng tự nhiên.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 1940,
  },
  {
    id: 'vn-layer-wavy',
    name: 'Layer Wavy Uốn Sóng Nhẹ',
    title: 'Layer Wavy Uốn Sóng Nhẹ',
    slug: 'layer-wavy-uon-song-nhe',
    summary: 'Lọn sóng nhẹ mềm mại buông lơi tự nhiên, thích hợp cho học sinh, sinh viên và nhân viên văn phòng.',
    description: 'Mẫu tóc layer nam uốn gợn sóng nhẹ nhàng thanh lịch, cực kỳ dễ chăm sóc và giữ nếp, phù hợp trong mọi hoàn cảnh đi học, đi làm.',
    gender: 'MALE',
    style: 'KOREAN',
    styleVibe: 'KOREAN',
    length: 'MEDIUM',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'ROUND', 'HEART'],
    texture: 'WAVY',
    suitableTexture: ['WAVY', 'STRAIGHT'],
    careLevel: 'EASY',
    careEffort: 'LOW',
    price: 320000,
    priceRefMin: 280000,
    priceRefMax: 380000,
    coverImageUrl: '/images/hairstyles/vietnam/vn-layer-wavy.jpg',
    galleryImages: [
      '/images/hairstyles/vietnam/vn-layer-wavy.jpg',
    ],
    tags: ['layer-wavy', 'song-nhe', 'vietnam-trending'],
    features: ['Sóng gợn nhẹ tinh tế', 'Dễ chăm sóc nhất trong các dòng uốn', 'Không lo hư tổn tóc'],
    careAdvice: 'Gội xả bình thường, để khô tự nhiên hoặc sấy nhẹ.',
    stylingTips: 'Dùng một chút sáp thơm dạng cream vuốt nhẹ ngọn tóc.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 2150,
  },

  // 2. Asian Classic & Female Hairstyles
  {
    id: 'hs-korean-wolf-cut',
    name: 'Wolf Cut Tỉa Tầng Nữ Châu Á',
    title: 'Wolf Cut Tỉa Tầng Nữ Châu Á',
    slug: 'korean-wolf-cut-textured',
    summary: 'Kiểu tóc tỉa layer phóng khoáng kết hợp độ phồng tự nhiên phong cách trẻ trung.',
    description: 'Wolf Cut biến thể châu Á kết hợp giữa Mullet và Shag, được tỉa layer mềm mại giúp ôm trọn gương mặt, tạo hiệu ứng thanh thoát và trẻ trung.',
    gender: 'FEMALE',
    style: 'KOREAN',
    styleVibe: 'KOREAN',
    length: 'MEDIUM',
    faceShape: 'ROUND',
    suitableFaces: ['ROUND', 'OVAL', 'HEART'],
    texture: 'WAVY',
    suitableTexture: ['WAVY', 'STRAIGHT', 'THICK'],
    careLevel: 'EASY',
    careEffort: 'LOW',
    price: 350000,
    priceRefMin: 350000,
    priceRefMax: 450000,
    coverImageUrl: 'https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1618835962148-cf177563c6c0?auto=format&fit=crop&w=800&q=80',
    ],
    tags: ['wolf-cut', 'trending', 'korean'],
    features: ['Tỉa tầng so le tự nhiên', 'Ôm gọn xương hàm tạo hiệu ứng mặt thon', 'Độ bồng bềnh sống động'],
    careAdvice: 'Sấy tạo phồng bằng lược tròn khi tóc còn ẩm 70%. Thoa 2 giọt serum dưỡng ngọn mỗi sáng.',
    stylingTips: 'Sử dụng sáp mờ matte clay hoặc xịt muối biển tạo texture chuyển động tự nhiên.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 3140,
  },
  {
    id: 'hs-classic-bob',
    name: 'Bob Ngắn Cá Tính Nữ Tự Nhiên',
    title: 'Bob Ngắn Cá Tính Nữ Tự Nhiên',
    slug: 'french-bob-tu-nhien',
    summary: 'Kiểu tóc Bob ngắn ngang cằm tôn nét trẻ trung hiện đại.',
    description: 'Bob ngắn là biểu tượng của vẻ đẹp thanh lịch và năng động. Đường cắt sắc sảo ngang cằm kết hợp mái bay nhẹ nhàng làm nổi bật đường xương quai hàm.',
    gender: 'FEMALE',
    style: 'CLASSIC',
    styleVibe: 'CLASSIC',
    length: 'SHORT',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'DIAMOND', 'HEART'],
    texture: 'STRAIGHT',
    suitableTexture: ['STRAIGHT', 'FINE'],
    careLevel: 'LOW',
    careEffort: 'LOW',
    price: 300000,
    priceRefMin: 300000,
    priceRefMax: 400000,
    coverImageUrl: 'https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1618835962148-cf177563c6c0?auto=format&fit=crop&w=800&q=80',
    ],
    tags: ['bob', 'french', 'classic'],
    features: ['Cắt ngang cằm thanh lịch', 'Tôn vinh đường nét cổ và cằm', 'Cực kỳ dễ sấy và chăm sóc'],
    careAdvice: 'Dùng dầu dưỡng argan vuốt nhẹ ngọn tóc sau khi sấy khô.',
    stylingTips: 'Kẹp càng cua nhẹ 10 phút trước khi ra ngoài để ngọn tóc cụp tự nhiên.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 2280,
  },
  {
    id: 'hs-layer-song-loi',
    name: 'Layer Sóng Lơi Dịu Dàng Nữ',
    title: 'Layer Sóng Lơi Dịu Dàng Nữ',
    slug: 'layer-song-loi-han-quoc',
    summary: 'Mái tóc dài thướt tha với những gợn sóng buông lơi phong cách Á Đông.',
    description: 'Kiểu tóc quốc dân tôn lên nét dịu dàng nữ tính của phụ nữ Á Đông. Từng tầng layer được uốn sóng lơi nhẹ nhàng, tạo cảm giác dày dặn, bồng bềnh như mây.',
    gender: 'FEMALE',
    style: 'KOREAN',
    styleVibe: 'KOREAN',
    length: 'LONG',
    faceShape: 'OVAL',
    suitableFaces: ['OVAL', 'ROUND', 'SQUARE'],
    texture: 'WAVY',
    suitableTexture: ['WAVY', 'FINE', 'THICK'],
    careLevel: 'MEDIUM',
    careEffort: 'MEDIUM',
    price: 450000,
    priceRefMin: 450000,
    priceRefMax: 600000,
    coverImageUrl: 'https://images.unsplash.com/photo-1588516903720-8ceb67f9ef84?auto=format&fit=crop&w=800&q=80',
    galleryImages: [
      'https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=800&q=80',
    ],
    tags: ['layer', 'song-loi', 'korean'],
    features: ['Sóng lơi chuyển động mềm mại', 'Che khuyết điểm gò má cao', 'Phù hợp mọi hoàn cảnh'],
    careAdvice: 'Dùng kẹp càng cua cuộn lọn sóng khi ở nhà. Sử dụng dầu gội không chứa Sulfate.',
    stylingTips: 'Sấy khô 80% rồi cuộn tròn lọn tóc quanh ngón tay hoặc ống lô lớn.',
    isTrending: true,
    isFeatured: true,
    isActive: true,
    viewCount: 2680,
  },
];

export const DEFAULT_HAIR_COLORS = [
  {
    id: 'col-ash-blonde',
    name: 'Khói Sữa Ánh Rêu (Ash Blonde)',
    code: 'ASH-9.11',
    hexCode: '#b7b4a7',
    hexColor: '#b7b4a7',
    secondaryHex: '#d1cec2',
    tone: 'COOL',
    group: 'ASH',
    brightness: 'LIGHT',
    brightnessLevel: 9,
    requiresBleach: true,
    bleachRounds: 2,
    skinSuitability: ['LIGHT', 'NEUTRAL'],
    suitableSkinTones: ['Da sáng', 'Da trung tính sáng'],
    maintenanceLevel: 'HIGH',
    maintenanceAdvice: 'Sử dụng dầu gội tím 2 lần/tuần để khử ánh vàng. Dưỡng mặt nạ phục hồi liên kết Olaplex No.3 hàng tuần.',
    colorFadingAdvice: 'Sau 4-6 tuần sẽ phai sang vàng khói be thanh lịch.',
    isTrending: true,
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 'col-chocolate-brown',
    name: 'Nâu Socola Tự Nhiên (Chocolate Brown)',
    code: 'BROWN-5.0',
    hexCode: '#4a2c11',
    hexColor: '#4a2c11',
    secondaryHex: '#6d421d',
    tone: 'WARM',
    group: 'BROWN',
    brightness: 'MEDIUM',
    brightnessLevel: 5,
    requiresBleach: false,
    bleachRounds: 0,
    skinSuitability: ['LIGHT', 'MEDIUM', 'DARK'],
    suitableSkinTones: ['Da sáng', 'Da trung tính', 'Da ngăm bánh mật'],
    maintenanceLevel: 'LOW',
    maintenanceAdvice: 'Dầu gội giữ màu thảo mộc, tránh xả tóc bằng nước quá nóng.',
    colorFadingAdvice: 'Màu bền trên 4 tháng, phai rất chậm và không bị xơ tóc.',
    isTrending: true,
    isActive: true,
    displayOrder: 2,
  },
  {
    id: 'col-cold-mocha',
    name: 'Nâu Tây Lạnh (Cold Mocha)',
    code: 'MOCHA-6.1',
    hexCode: '#59493E',
    hexColor: '#59493E',
    secondaryHex: '#7C6A5D',
    tone: 'COOL',
    group: 'BROWN',
    brightness: 'MEDIUM',
    brightnessLevel: 6,
    requiresBleach: false,
    bleachRounds: 0,
    skinSuitability: ['LIGHT', 'MEDIUM', 'DARK'],
    suitableSkinTones: ['Mọi tông da'],
    maintenanceLevel: 'LOW',
    maintenanceAdvice: 'Dùng dầu gội khóa màu chuyên sâu.',
    colorFadingAdvice: 'Màu nền trầm lạnh tự nhiên, không ngả đỏ.',
    isTrending: true,
    isActive: true,
    displayOrder: 3,
  },
  {
    id: 'col-burgundy',
    name: 'Đỏ Rượu Cherry (Burgundy Wine)',
    code: 'RED-6.62',
    hexCode: '#6B1D2F',
    hexColor: '#6B1D2F',
    secondaryHex: '#8E283F',
    tone: 'WARM',
    group: 'RED_BURGUNDY',
    brightness: 'MEDIUM',
    brightnessLevel: 6,
    requiresBleach: false,
    bleachRounds: 0,
    skinSuitability: ['LIGHT', 'MEDIUM'],
    suitableSkinTones: ['Da sáng', 'Da trung tính'],
    maintenanceLevel: 'MEDIUM',
    maintenanceAdvice: 'Gội xả bằng nước mát, dùng xịt dưỡng khóa sắc tố đỏ.',
    colorFadingAdvice: 'Sau 6 tuần phai dần về nâu đỏ ấm dịu mắt.',
    isTrending: true,
    isActive: true,
    displayOrder: 4,
  },
];

export const DEFAULT_SERVICES = [
  {
    id: 'srv-layer-cut-vip',
    name: 'Cắt Tạo Kiểu Master VIP',
    title: 'Cắt Tạo Kiểu Master VIP',
    slug: 'cat-tao-kieu-master-vip',
    category: 'CUT',
    durationMinutes: 45,
    minPrice: 250000,
    maxPrice: 350000,
    priceMin: 250000,
    priceMax: 350000,
    shortSummary: 'Tư vấn phom tóc theo tỷ lệ khuôn mặt, gội massage bấm huyệt và tạo kiểu hoàn thiện.',
    description: 'Dịch vụ cắt tóc chuẩn Haute Coiffure được thực hiện bởi Master Stylist. Khách hàng được soi cấu trúc da đầu vi điểm, tư vấn dáng tóc tối ưu và hoàn thiện tạo kiểu với sản phẩm cao cấp.',
    preCareAdvice: 'Khách hàng có thể để tóc tự nhiên trước khi đến, salon sẽ kiểm tra phom nguyên bản.',
    postCareAdvice: 'Nên duy trì cắt tỉa phom sau mỗi 3-4 tuần để giữ nếp chuẩn.',
    isPopular: true,
    isActive: true,
    displayOrder: 1,
  },
  {
    id: 'srv-color-perm-combo',
    name: 'Combo Uốn & Nhuộm Cao Cấp Olaplex',
    title: 'Combo Uốn & Nhuộm Cao Cấp Olaplex',
    slug: 'combo-uon-nhuom-cao-cap-olaplex',
    category: 'COMBO',
    durationMinutes: 180,
    minPrice: 1200000,
    maxPrice: 1800000,
    priceMin: 1200000,
    priceMax: 1800000,
    shortSummary: 'Trọn gói uốn phục hồi, nhuộm thời trang và hấp phục hồi keratin bảo vệ cấu trúc tóc.',
    description: 'Gói dịch vụ đặc quyền kết hợp uốn sóng thẩm mỹ cùng màu nhuộm thời thượng không amoniac. Bổ sung dưỡng chất Olaplex No.1 & No.2 trực tiếp vào thuốc giúp sợi tóc bóng mượt, đàn hồi tối đa.',
    preCareAdvice: 'Không gội đầu trong vòng 24h trước khi nhuộm để lớp dầu tự nhiên bảo vệ da đầu.',
    postCareAdvice: 'Giữ tóc khô ráo trong 48h đầu sau khi làm hóa chất. Sử dụng bộ dầu gội dưỡng màu Olaplex.',
    isPopular: true,
    isActive: true,
    displayOrder: 2,
  },
  {
    id: 'srv-balayage-olaplex',
    name: 'Nhuộm Balayage Khói & Tẩy Olaplex',
    title: 'Nhuộm Balayage Khói & Tẩy Olaplex',
    slug: 'nhuom-balayage-khoi-tay-olaplex',
    category: 'DYE',
    durationMinutes: 210,
    minPrice: 1500000,
    maxPrice: 2800000,
    priceMin: 1500000,
    priceMax: 2800000,
    shortSummary: 'Kỹ thuật chải màu thủ công đa chiều chuyển sắc từ chân tới ngọn tóc.',
    description: 'Balayage đòi hỏi tay nghề điêu luyện của Colorist hàng đầu. Hiệu ứng chuyển màu 3D tự nhiên giúp tóc mọc dài vẫn giữ nguyên vẻ đẹp mà không bị lộ chân đen.',
    preCareAdvice: 'Thông báo cho chuyên viên nếu tóc từng nhuộm đen hoặc phủ bóng trong 1 năm qua.',
    postCareAdvice: 'Bắt buộc sử dụng dầu gội tím khử ánh đồng và ủ tóc 1-2 lần/tuần.',
    isPopular: true,
    isActive: true,
    displayOrder: 3,
  },
  {
    id: 'srv-nano-keratin',
    name: 'Phục Hồi Cấu Trúc Nano Keratin',
    title: 'Phục Hồi Cấu Trúc Nano Keratin',
    slug: 'phuc-hoi-cau-truc-nano-keratin',
    category: 'TREATMENT',
    durationMinutes: 75,
    minPrice: 600000,
    maxPrice: 900000,
    priceMin: 600000,
    priceMax: 900000,
    shortSummary: 'Tái sinh mái tóc cháy, gãy rụng và khô xơ hóa chất nặng.',
    description: 'Công nghệ dẫn truyền phân tử Keratin siêu nhỏ vào tận sâu lõi tóc, lấp đầy các khoảng trống đứt gãy, trả lại độ đàn hồi, suôn mượt óng ả ngay sau 1 liệu trình.',
    preCareAdvice: 'Tránh dùng sáp hoặc dầu xả trước buổi phục hồi.',
    postCareAdvice: 'Sử dụng dầu gội cân bằng pH 5.5, không sấy tóc ở nhiệt độ quá cao.',
    isPopular: false,
    isActive: true,
    displayOrder: 4,
  },
];

export const DEFAULT_COMBOS = [
  {
    id: 'cmb-gentleman-atelier',
    title: 'Combo Quý Ông Atelier',
    name: 'Combo Quý Ông Atelier',
    slug: 'combo-quy-ong-atelier',
    description: 'Trọn gói cắt tạo kiểu Master, gội dưỡng sinh bấm huyệt cổ vai gáy và uốn phồng chân tóc textured.',
    packagePrice: 550000,
    originalPrice: 750000,
    durationMinutes: 90,
    savingsPercent: 27,
    imageUrl: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    isFeatured: true,
    displayOrder: 1,
    services: [
      { id: 'srv-layer-cut-vip', title: 'Cắt Tạo Kiểu Master VIP' }
    ]
  },
  {
    id: 'cmb-seoul-wave-luxe',
    title: 'Gói Uốn Sóng Seoul & Nhuộm Tây Lạnh',
    name: 'Gói Uốn Sóng Seoul & Nhuộm Tây Lạnh',
    slug: 'goi-uon-song-seoul-nhuom-tay-lanh',
    description: 'Biến hóa toàn diện với uốn sóng lơi nữ thần, nhuộm màu nâu tây lạnh không tẩy và hấp phục hồi lụa.',
    packagePrice: 1950000,
    originalPrice: 2600000,
    durationMinutes: 240,
    savingsPercent: 25,
    imageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80',
    isActive: true,
    isFeatured: true,
    displayOrder: 2,
    services: [
      { id: 'srv-color-perm-combo', title: 'Combo Uốn & Nhuộm Cao Cấp Olaplex' }
    ]
  }
];

export const DEFAULT_BEFORE_AFTERS = [
  {
    id: 'ba-01',
    title: 'Lột xác mái tóc xơ rối thành Two-Block Hàn Quốc lãng tử',
    description: 'Khách hàng có chất tóc cứng và chỉa hai bên. Master Kenji áp dụng kỹ thuật ép side và uốn textured nhẹ đỉnh đầu giúp phom tóc ôm gọn, tự nhiên không cần sấy cầu kỳ.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=800&q=80',
    customerGender: 'MALE',
    service: { id: 'srv-layer-cut-vip', title: 'Cắt Master + Ép Side Hàn Quốc' },
    hairstyle: { id: 'hs-side-part-fade', title: 'Two-Block Hàn Quốc', slug: 'side-part-pompadour-hien-dai' },
    stylist: { id: 'sty-01', fullName: 'Kenji Đặng', avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80' },
    isFeatured: true,
    displayOrder: 1,
  },
  {
    id: 'ba-02',
    title: 'Phục hồi tóc tẩy hư tổn và nâng tông Balayage Khói Bạc',
    description: 'Tóc ban đầu bị gãy và loang màu do tự tẩy tại nhà. Master Elena thực hiện liệu trình Olaplex Stand-Alone và nhuộm phối màu Balayage khói xám bạc sống động.',
    beforeImageUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=800&q=80',
    afterImageUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=800&q=80',
    customerGender: 'FEMALE',
    service: { id: 'srv-balayage-olaplex', title: 'Nhuộm Balayage & Phục Hồi Olaplex' },
    hairstyle: { id: 'hs-layer-song-loi', title: 'Layer Sóng Lơi Hàn Quốc', slug: 'layer-song-loi-han-quoc' },
    stylist: { id: 'sty-02', fullName: 'Elena Vũ', avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80' },
    isFeatured: true,
    displayOrder: 2,
  },
];

export const DEFAULT_STYLISTS = [
  {
    id: 'sty-01',
    fullName: 'Kenji Đặng',
    name: 'Kenji Đặng',
    phone: '0908123456',
    avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80',
    isStylist: true,
    experienceYears: 12,
    specialties: ['Cắt Layer hình khối', 'Uốn sóng lơi Nhật - Hàn', 'Phục hồi Keratin'],
    bio: 'Artistic Director tốt nghiệp học viện Vidal Sassoon Thượng Hải với hơn 12 năm kinh nghiệm định hình phong cách cho người nổi tiếng.',
  },
  {
    id: 'sty-02',
    fullName: 'Elena Vũ',
    name: 'Elena Vũ',
    phone: '0908111222',
    avatarUrl: 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80',
    isStylist: true,
    experienceYears: 9,
    specialties: ['Nhuộm Balayage 3D', 'Tẩy Olaplex', 'Màu Pastel thời trang'],
    bio: 'Master Colorist chứng chỉ L’Oréal Professionnel Paris, chuyên gia hàng đầu về kỹ thuật phối màu chuyển tông không hư hại cấu trúc tóc.',
  },
  {
    id: 'sty-03',
    fullName: 'Alex Trần',
    name: 'Alex Trần',
    phone: '0908333444',
    avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80',
    isStylist: true,
    experienceYears: 8,
    specialties: ['Skin Fade', 'Pompadour', 'Tạo phom tóc nam Châu Á'],
    bio: 'Barber Master với gu thẩm mỹ tinh tế, bậc thầy của những đường cắt Fade sắc nét và phong cách quý ông cổ điển.',
  },
];

export const DEFAULT_ARTICLES = [
  {
    id: 'art-01',
    title: 'Bí Quyết Giữ Nếp Tóc Layer Suốt 24 Giờ',
    slug: 'bi-quyet-giu-nep-toc-layer-suot-24-gio',
    excerpt: 'Hướng dẫn chi tiết từ chuyên gia cách sấy tạo phồng và giữ nếp tóc layer tại nhà bằng kỹ thuật chuẩn salon mà không cần dùng nhiệt quá cao.',
    content: `## Nghệ Thuật Giữ Nếp Tóc Layer Chuẩn Salon

Tóc tỉa layer đang là xu hướng thịnh hành nhất nhờ khả năng mang lại sự bồng bềnh, trẻ trung và tôn vinh mọi đường nét khuôn mặt. Tuy nhiên, nhiều bạn thường gặp tình trạng ngọn tóc bị vểnh hoặc mất phom sau khi ngủ dậy.

### 1. Kỹ Thuật Sấy Tóc Quyết Định 80% Phom Dáng
- **Quy tắc sấy ngược chân tóc**: Khi tóc còn ẩm khoảng 70%, hãy cúi đầu về phía trước và sấy ngược chiều mọc của chân tóc. Kỹ thuật này kích hoạt độ phồng tự nhiên ở chân tóc mà không cần dùng đến gel xịt.
- **Dùng lược tròn đường kính lớn**: Chia tóc thành từng lọn nhỏ, đặt lược tròn dưới lọn tóc và đưa máy sấy chạy từ trên xuống theo hướng khép biểu bì tóc.

### 2. Chọn Tinh Dầu Phù Hợp Cho Chất Tóc
- Với tóc mỏng xẹp: Ưu tiên tinh dầu hạt nho hoặc serum dạng sữa lỏng nhẹ.
- Với tóc dày hoặc khô xơ: Sử dụng tinh dầu Argan hữu cơ nguyên chất ép lạnh.

### 3. Bí Quyết Ngủ Không Bị Bẹp Tóc
Hãy chuyển sang sử dụng vỏ gối lụa tơ tằm (Silk Mulberry) và dùng kẹp càng cua cuộn lỏng đỉnh đầu trước khi đi ngủ. Bạn sẽ bất ngờ với lọn tóc bồng bềnh nguyên vẹn vào sáng hôm sau!`,
    coverImageUrl: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=1200&q=80',
    tags: ['Cẩm nang chăm sóc', 'Tóc Layer', 'Bí quyết salon', 'Dưỡng tóc tại nhà'],
    metaTitle: 'Bí Quyết Giữ Nếp Tóc Layer Chuẩn Salon | Blog Làm Đẹp',
    metaDescription: 'Hướng dẫn chi tiết từ chuyên gia cách sấy và dưỡng tóc layer tại nhà suốt 24 giờ.',
    seoTitle: 'Bí Quyết Giữ Nếp Tóc Layer Chuẩn Salon | Blog Làm Đẹp',
    seoDescription: 'Hướng dẫn chi tiết từ chuyên gia cách sấy và dưỡng tóc layer tại nhà.',
    published: true,
    isPublished: true,
    publishedAt: new Date().toISOString(),
    viewCount: 3420,
    authorName: 'Master Kenji Đặng',
    category: { id: 'cat-art-01', name: 'Bí Quyết Chăm Sóc', slug: 'bi-quyet-cham-soc' },
  },
  {
    id: 'art-02',
    title: 'Xu Hướng Màu Nhuộm Không Tẩy Thịnh Hành 2026',
    slug: 'xu-huong-mau-nhuom-khong-tay-thinh-hanh-2026',
    excerpt: 'Khám phá các tone màu nâu tây lạnh, nâu trà sữa khói và đỏ rượu vang tôn da tuyệt đối mà không cần trải qua bước tẩy tóc gây khô xơ.',
    content: `## Xu Hướng Nhuộm Tóc Không Tẩy: Tôn Sắc Tự Nhiên & Bảo Vệ Cấu Trúc Sợi Tóc

Năm 2026 đánh dấu sự lên ngôi của phong cách Quiet Luxury trong ngành tạo mẫu tóc: những màu nhuộm tinh tế, phản chiếu ánh sáng tự nhiên và đặc biệt không xâm lấn sâu vào lõi keratin.

### 1. Nâu Tây Lạnh (Cold Mocha)
Tone màu trung tính hoàn hảo dành cho những quý cô yêu thích sự thanh lịch. Sắc nâu trầm ấm khi ở trong nhà nhưng sẽ ánh lên ánh rêu khói huyền ảo dưới ánh nắng mặt trời.

### 2. Nâu Trà Sữa Tự Nhiên
Tone màu ngọt ngào giúp khuôn mặt bừng sáng. Màu này nâng tone da lên 1-2 bậc, cực kỳ phù hợp với sắc tố da phụ nữ Châu Á.

### 3. Đỏ Rượu Cherry (Burgundy Glow)
Màu sắc mang lại thần thái quyền lực và sang trọng. Nền tóc đen tự nhiên hoàn toàn có thể lên chuẩn sắc đỏ rượu quý phái chỉ sau một lần nhuộm.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1560869713-7d0a29430803?auto=format&fit=crop&w=1200&q=80',
    tags: ['Màu nhuộm 2026', 'Nhuộm không tẩy', 'Xu hướng tóc', 'Tôn da'],
    metaTitle: 'Top Màu Nhuộm Không Tẩy Tôn Da 2026 | Lumière Atelier',
    metaDescription: 'Tổng hợp các tone màu nhuộm không tẩy đẹp nhất năm 2026, giúp tóc bóng khỏe và tôn da.',
    seoTitle: 'Top Màu Nhuộm Không Tẩy Tôn Da 2026 | Lumière Atelier',
    seoDescription: 'Tổng hợp các tone màu nhuộm không tẩy đẹp nhất năm 2026.',
    published: true,
    isPublished: true,
    publishedAt: new Date().toISOString(),
    viewCount: 2890,
    authorName: 'Master Elena Vũ',
    category: { id: 'cat-art-02', name: 'Xu Hướng Làm Đẹp', slug: 'xu-huong-lam-dep' },
  },
  {
    id: 'art-03',
    title: 'Phục Hồi Tóc Hóa Chất Với Liệu Trình Olaplex & Keratin',
    slug: 'phuc-hoi-toc-hoa-chat-voi-lieu-trinh-olaplex-va-keratin',
    excerpt: 'Hiểu đúng về cơ chế hàn gắn liên kết disulfide của Olaplex và bù đắp protein của Keratin để phục hồi mái tóc hư tổn cấp độ nặng.',
    content: `## Cứu Cánh Cho Mái Tóc Cháy Sợi & Đứt Gãy Do Hóa Chất

Rất nhiều khách hàng nhầm lẫn giữa Olaplex và Keratin. Trên thực tế, đây là hai liệu pháp phục hồi hoạt động ở hai tầng cấu trúc hoàn toàn khác nhau của sợi tóc.

### Olaplex: Hàn Gắn Liên Kết Disulfide Từ Bên Trong
Khi uốn, duỗi hoặc tẩy tóc, các liên kết lưu huỳnh (disulfide bonds) bên trong tủy tóc bị bẻ gãy. Hoạt chất Bis-Aminopropyl Diglycol Dimaleate độc quyền của Olaplex có khả năng tìm kiếm và tái tạo lại các liên kết này, giúp sợi tóc phục hồi độ dai và độ đàn hồi nguyên bản.

### Nano Keratin: Lấp Đầy Vảy Biểu Bì Bên Ngoài
Keratin đóng vai trò như lớp áo giáp bảo vệ bên ngoài. Các phân tử keratin nano sẽ thẩm thấu và làm mịn lớp biểu bì xù xì, giúp bề mặt tóc bóng mượt và ngăn chặn sự thoát ẩm.`,
    coverImageUrl: 'https://images.unsplash.com/photo-1595476108010-b4d1f102b1b1?auto=format&fit=crop&w=1200&q=80',
    tags: ['Phục hồi tóc', 'Olaplex', 'Keratin Nano', 'Chăm sóc chuyên sâu'],
    metaTitle: 'Phục Hồi Tóc Nát Với Olaplex & Keratin | Lumière Hair',
    metaDescription: 'Giải mã cơ chế phục hồi tóc chuyên sâu bằng công nghệ liên kết disulfide và phủ lụa keratin.',
    seoTitle: 'Phục Hồi Tóc Nát Với Olaplex & Keratin | Lumière Hair',
    seoDescription: 'Giải mã cơ chế phục hồi tóc chuyên sâu bằng công nghệ liên kết disulfide.',
    published: true,
    isPublished: true,
    publishedAt: new Date().toISOString(),
    viewCount: 2150,
    authorName: 'Master Kenji Đặng',
    category: { id: 'cat-art-01', name: 'Bí Quyết Chăm Sóc', slug: 'bi-quyet-cham-soc' },
  },
];

// --- RESILIENT DATA RETRIEVAL FUNCTIONS ---

export async function getPublicSiteSettings() {
  try {
    const raw = await prisma.siteSetting.findUnique({
      where: { id: 'default_setting' },
    });
    if (raw) {
      memoryStore.setSiteSettings(raw);
      return serializeSettings(raw);
    }
  } catch (err) {
    // DB offline, fallback to memoryStore or default
  }

  const fromStore = memoryStore.getSiteSettings();
  if (fromStore) return serializeSettings(fromStore);

  return serializeSettings(DEFAULT_SITE_SETTINGS);
}

export async function getPublicHomeData() {
  const settingsPromise = getPublicSiteSettings();

  const bannersPromise = prisma.banner
    .findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    })
    .then((items) => (items.length > 0 ? items.map(serializeBanner) : DEFAULT_BANNERS.map(serializeBanner)))
    .catch(() => {
      const fromStore = memoryStore.findBanners({ isActive: true });
      return fromStore.length > 0 ? fromStore.map(serializeBanner) : DEFAULT_BANNERS.map(serializeBanner);
    });

  const hairstylesPromise = prisma.hairstyle
    .findMany({
      where: { isActive: true },
      include: { category: true },
      take: 8,
      orderBy: [{ isTrending: 'desc' }, { viewCount: 'desc' }],
    })
    .then((items) => (items.length > 0 ? items.map(serializeHairstyle) : DEFAULT_HAIRSTYLES.map(serializeHairstyle)))
    .catch(() => {
      const fromStore = memoryStore.findHairstyles({ isActive: true });
      return fromStore.length > 0 ? fromStore.map(serializeHairstyle) : DEFAULT_HAIRSTYLES.map(serializeHairstyle);
    });

  const beforeAftersPromise = prisma.beforeAfter
    .findMany({
      where: { isFeatured: true },
      include: { service: true, hairstyle: true, stylist: true },
      take: 4,
      orderBy: { displayOrder: 'asc' },
    })
    .then((items) => (items.length > 0 ? items.map(serializeBeforeAfter) : DEFAULT_BEFORE_AFTERS))
    .catch(() => DEFAULT_BEFORE_AFTERS);

  const stylistsPromise = prisma.user
    .findMany({
      where: { isStylist: true, isActive: true },
      take: 4,
      orderBy: { experienceYears: 'desc' },
    })
    .then((items) => (items.length > 0 ? items : DEFAULT_STYLISTS))
    .catch(() => DEFAULT_STYLISTS);

  const servicesPromise = prisma.service
    .findMany({
      where: { isActive: true },
      include: { category: true },
      take: 6,
      orderBy: { displayOrder: 'asc' },
    })
    .then((items) => (items.length > 0 ? items.map(serializeService) : DEFAULT_SERVICES.map(serializeService)))
    .catch(() => {
      const fromStore = memoryStore.findServices();
      return fromStore.length > 0 ? fromStore.map(serializeService) : DEFAULT_SERVICES.map(serializeService);
    });

  const articlesPromise = prisma.article
    .findMany({
      where: { isPublished: true },
      include: { author: true, category: true },
      take: 3,
      orderBy: { publishedAt: 'desc' },
    })
    .then((items) => (items.length > 0 ? items.map(serializeArticle) : DEFAULT_ARTICLES.map(serializeArticle)))
    .catch(() => {
      const fromStore = memoryStore.findArticles();
      return fromStore.length > 0 ? fromStore.map(serializeArticle) : DEFAULT_ARTICLES.map(serializeArticle);
    });

  const [settings, banners, trendingHairstyles, beforeAfters, stylists, services, articles] = await Promise.all([
    settingsPromise,
    bannersPromise,
    hairstylesPromise,
    beforeAftersPromise,
    stylistsPromise,
    servicesPromise,
    articlesPromise,
  ]);

  const resolvedBranding = settings || serializeSettings(DEFAULT_SITE_SETTINGS);

  return {
    branding: resolvedBranding,
    settings: resolvedBranding,
    banners: (banners || []).filter(Boolean) as any[],
    categories: ['Nam', 'Nữ', 'Nhuộm', 'Chăm sóc', 'Combo VIP'],
    trendingHairstyles: (trendingHairstyles || []).filter(Boolean) as any[],
    beforeAfters: (beforeAfters || []).filter(Boolean) as any[],
    stylists: (stylists || []).filter(Boolean) as any[],
    services: (services || []).filter(Boolean) as any[],
    articles: (articles || []).filter(Boolean) as any[],
  };
}

export async function getPublicHairstyles(params?: {
  gender?: string;
  style?: string;
  length?: string;
  faceShape?: string;
  texture?: string;
  careEffort?: string;
  careLevel?: string;
  search?: string;
  sort?: string;
  page?: number;
  pageSize?: number;
}) {
  let allStyles: any[] = [];

  try {
    const raw = await prisma.hairstyle.findMany({
      where: { isActive: true },
      include: { category: true, services: true },
      orderBy: { createdAt: 'desc' },
    });
    if (raw && raw.length > 0) {
      allStyles = raw.map(serializeHairstyle);
    }
  } catch (err) {
    // fallback
  }

  if (allStyles.length === 0) {
    const fromStore = memoryStore.findHairstyles({ isActive: true });
    allStyles = fromStore.length > 0 ? fromStore.map(serializeHairstyle) : DEFAULT_HAIRSTYLES.map(serializeHairstyle);
  }

  let filtered = [...allStyles];

  if (params?.gender && params.gender !== 'ALL') {
    const g = params.gender.toLowerCase();
    filtered = filtered.filter((h) => {
      const hg = (h.gender || '').toLowerCase();
      if (g === 'unisex') return true;
      return hg === g || hg === 'unisex';
    });
  }

  if (params?.style && params.style !== 'ALL') {
    const s = params.style.toLowerCase();
    filtered = filtered.filter((h) => {
      const hs = (h.style || h.styleVibe || '').toLowerCase();
      return hs === s;
    });
  }

  if (params?.length && params.length !== 'ALL') {
    const l = params.length.toLowerCase();
    filtered = filtered.filter((h) => {
      const hl = (h.length || '').toLowerCase();
      if (l === 'short') return hl === 'short' || hl === 'very_short';
      if (l === 'long') return hl === 'long' || hl === 'extra_long';
      return hl === l;
    });
  }

  if (params?.faceShape && params.faceShape !== 'ALL') {
    const f = params.faceShape.toLowerCase();
    filtered = filtered.filter((h) => {
      const faces: string[] = Array.isArray(h.suitableFaces)
        ? h.suitableFaces.map((x: string) => x.toLowerCase())
        : [(h.faceShape || '').toLowerCase()];
      return faces.includes(f) || faces.includes('all');
    });
  }

  if (params?.texture && params.texture !== 'ALL') {
    const t = params.texture.toLowerCase();
    filtered = filtered.filter((h) => {
      const textures: string[] = Array.isArray(h.suitableTexture)
        ? h.suitableTexture.map((x: string) => x.toLowerCase())
        : [(h.texture || '').toLowerCase()];
      return textures.includes(t) || textures.includes('all');
    });
  }

  const care = params?.careEffort || params?.careLevel;
  if (care && care !== 'ALL') {
    const c = care.toLowerCase();
    filtered = filtered.filter((h) => {
      const hc = (h.careEffort || h.careLevel || '').toLowerCase();
      if (c === 'easy' || c === 'low') return hc === 'easy' || hc === 'low';
      if (c === 'high') return hc === 'high';
      return hc === 'medium';
    });
  }

  if (params?.search && params.search.trim().length > 0) {
    const q = params.search.toLowerCase().trim();
    filtered = filtered.filter((h) => {
      const name = (h.name || h.title || '').toLowerCase();
      const desc = (h.description || '').toLowerCase();
      const summary = (h.summary || '').toLowerCase();
      const tags = (h.tags || []).join(' ').toLowerCase();
      return name.includes(q) || desc.includes(q) || summary.includes(q) || tags.includes(q);
    });
  }

  if (params?.sort) {
    switch (params.sort) {
      case 'popular':
        filtered.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
        break;
      case 'price_asc':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price_desc':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'trending':
        filtered.sort((a, b) => (b.isTrending ? 1 : 0) - (a.isTrending ? 1 : 0));
        break;
      case 'newest':
      default:
        // default order preserved
        break;
    }
  }

  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.max(1, params?.pageSize || 20);
  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  return {
    items: paginated,
    total,
    page,
    pageSize,
  };
}

export async function getPublicHairstyleBySlug(slug: string) {
  try {
    const found = await prisma.hairstyle.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        isActive: true,
      },
      include: {
        category: true,
        services: true,
        beforeAfters: {
          include: { stylist: true, service: true },
        },
      },
    });
    if (found) {
      // Fire-and-forget increment viewCount
      prisma.hairstyle.update({
        where: { id: found.id },
        data: { viewCount: { increment: 1 } },
      }).catch(() => {});
      return serializeHairstyle(found);
    }
  } catch (err) {
    // fallback
  }

  const memoryFound = memoryStore.findHairstyles().find((h) => h.slug === slug || h.id === slug);
  if (memoryFound) return serializeHairstyle(memoryFound);

  const defaultFound = DEFAULT_HAIRSTYLES.find((h) => h.slug === slug || h.id === slug);
  if (defaultFound) return serializeHairstyle(defaultFound);

  return null;
}

export async function getPublicColors() {
  try {
    const colors = await prisma.hairColor.findMany({
      where: { isActive: true },
      orderBy: { displayOrder: 'asc' },
    });
    if (colors && colors.length > 0) {
      return {
        colors: colors.map(serializeHairColor).filter(Boolean) as any[],
        tones: ['WARM', 'COOL', 'NEUTRAL'],
      };
    }
  } catch (err) {
    // fallback
  }

  const fromStore = memoryStore.findHairColors();
  const list = fromStore.length > 0
    ? (fromStore.map(serializeHairColor).filter(Boolean) as any[])
    : (DEFAULT_HAIR_COLORS.map(serializeHairColor).filter(Boolean) as any[]);

  return {
    colors: list,
    tones: ['WARM', 'COOL', 'NEUTRAL'],
  };
}

export async function getPublicServices() {
  try {
    const [services, combos, categories] = await Promise.all([
      prisma.service.findMany({
        where: { isActive: true },
        include: { category: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.serviceCombo.findMany({
        where: { isActive: true },
        include: { services: true },
        orderBy: { displayOrder: 'asc' },
      }),
      prisma.category.findMany({
        where: { type: 'SERVICE', isActive: true },
        orderBy: { displayOrder: 'asc' },
      }),
    ]);

    if (services.length > 0 || combos.length > 0) {
      return {
        services: services.map(serializeService).filter(Boolean) as any[],
        combos: combos.map(serializeServiceCombo).filter(Boolean) as any[],
        categories: categories.map(serializeCategory).filter(Boolean) as any[],
      };
    }
  } catch (err) {
    // fallback
  }

  const storeServices = memoryStore.findServices();
  const storeCombos = memoryStore.findCombos();
  const storeCategories = memoryStore.findCategories().filter((c) => c.type === 'SERVICE');

  return {
    services: (storeServices.length > 0 ? storeServices.map(serializeService) : DEFAULT_SERVICES.map(serializeService)).filter(Boolean) as any[],
    combos: (storeCombos.length > 0 ? storeCombos.map(serializeServiceCombo) : DEFAULT_COMBOS.map(serializeServiceCombo)).filter(Boolean) as any[],
    categories: storeCategories.map(serializeCategory).filter(Boolean) as any[],
  };
}

export async function getPublicArticles(params?: {
  tag?: string;
  search?: string;
  page?: number;
  pageSize?: number;
}) {
  let allArticles: any[] = [];

  try {
    const articles = await prisma.article.findMany({
      where: { isPublished: true },
      include: { author: true, category: true },
      orderBy: { publishedAt: 'desc' },
    });
    if (articles && articles.length > 0) {
      allArticles = articles.map(serializeArticle);
    }
  } catch (err) {
    // fallback
  }

  if (allArticles.length === 0) {
    const fromStore = memoryStore.findArticles().filter((a) => a.isPublished || a.published);
    allArticles = fromStore.length > 0 ? fromStore.map(serializeArticle) : DEFAULT_ARTICLES.map(serializeArticle);
  }

  let filtered = [...allArticles];

  if (params?.tag && params.tag !== 'ALL') {
    filtered = filtered.filter((a) => a.tags && a.tags.includes(params.tag));
  }

  if (params?.search && params.search.trim().length > 0) {
    const q = params.search.toLowerCase().trim();
    filtered = filtered.filter((a) => {
      const title = (a.title || '').toLowerCase();
      const excerpt = (a.excerpt || '').toLowerCase();
      const content = (a.content || '').toLowerCase();
      return title.includes(q) || excerpt.includes(q) || content.includes(q);
    });
  }

  const page = Math.max(1, params?.page || 1);
  const pageSize = Math.max(1, params?.pageSize || 6);
  const total = filtered.length;
  const paginated = filtered.slice((page - 1) * pageSize, page * pageSize);

  const allTags = Array.from(new Set(allArticles.flatMap((a) => a.tags || [])));

  return {
    articles: paginated,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
    tags: allTags,
  };
}

export async function getPublicArticleBySlug(slug: string) {
  try {
    const article = await prisma.article.findFirst({
      where: {
        OR: [{ slug }, { id: slug }],
        isPublished: true,
      },
      include: { author: true, category: true },
    });
    if (article) {
      prisma.article.update({
        where: { id: article.id },
        data: { viewCount: { increment: 1 } },
      }).catch(() => {});
      return serializeArticle(article);
    }
  } catch (err) {
    // fallback
  }

  const fromStore = memoryStore.findArticles().find((a) => a.slug === slug || a.id === slug);
  if (fromStore) return serializeArticle(fromStore);

  const defaultFound = DEFAULT_ARTICLES.find((a) => a.slug === slug || a.id === slug);
  if (defaultFound) return serializeArticle(defaultFound);

  return null;
}

export async function getPublicBeforeAfters(params?: {
  gender?: string;
  category?: string;
}) {
  try {
    const items = await prisma.beforeAfter.findMany({
      include: { service: true, hairstyle: true, stylist: true },
      orderBy: { displayOrder: 'asc' },
    });
    if (items && items.length > 0) {
      let filtered = items.map(serializeBeforeAfter).filter(Boolean) as any[];
      if (params?.gender && params.gender !== 'ALL') {
        filtered = filtered.filter((b: any) => b.customerGender === params.gender);
      }
      return filtered;
    }
  } catch (err) {
    // fallback
  }

  let filtered = [...DEFAULT_BEFORE_AFTERS] as any[];
  if (params?.gender && params.gender !== 'ALL') {
    filtered = filtered.filter((b) => b.customerGender === params.gender);
  }
  return filtered;
}

export async function getPublicStylists() {
  try {
    const stylists = await prisma.user.findMany({
      where: { isStylist: true, isActive: true },
      orderBy: { experienceYears: 'desc' },
    });
    if (stylists && stylists.length > 0) return stylists;
  } catch (err) {
    // fallback
  }
  return DEFAULT_STYLISTS;
}
