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
  brandName: 'ACoong Hair Salon',
  brandSlogan: 'Định Hình Khí Chất - Tỏa Sáng Phong Cách',
  logoUrl: '/uploads/brand/1792572842701_Logo_k_o_v_ng_ACoong_sang_tr_ng.png',
  faviconUrl: '/uploads/brand/1792572543690_logotoc-removebg-preview.png',
  hotlinePrimary: '0981438118',
  hotlineSecondary: '0981438118',
  emailContact: 'contact@congnguyenhair.vn',
  addressFull: 'Nguyệt Áng 3, An Khánh, Hải Phòng',
  googleMapsEmbedUrl: 'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d479.93252252100655!2d106.61087903989699!3d20.78488568895623!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x314a76dcf205a86d%3A0xf613dd1e2cbc6902!2zTmd1eeG7h3QgQW5nLCBUaMOhaSBTxqFuLCBBbiBMw6NvLCBI4bqjaSBQaMOybmc!5e0!3m2!1svi!2s!4v1792572457657!5m2!1svi!2s',
  openingHours: {
    monday_friday: '08:30 - 20:30 Hàng ngày',
    weekend: '08:00 - 21:00',
    rawText: '08:30 - 20:30 Hàng ngày',
  },
  socialLinks: {
    facebook: '',
    instagram: '',
    tiktok: '',
    zalo: '',
    youtube: 'https://youtube.com/@congnguyenhairsalon',
  },
  defaultSeoMetadata: {
    title: 'ACoong Hair Salon | Salon Tóc Nam & Nữ Hiện Đại',
    description: 'Salon tóc Nam và Nữ cao cấp tại Nguyệt Áng 3, An Khánh, Hải Phòng. Đội ngũ thợ tay nghề cao, cập nhật xu hướng tóc châu Á và công nghệ thử màu tóc trực tuyến.',
    ogImage: '/images/brand/og-cover.jpg',
  },
  footerContent: {
    copyright: '© 2026 Công Nguyễn Hair Salon. All rights reserved.',
  },
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
  {
    "id": "ffb460ad-c614-4442-871f-dd6fdf82a9c4",
    "title": "Bob Ngắn Cá Tính Nữ Tự Nhiên",
    "name": "Bob Ngắn Cá Tính Nữ Tự Nhiên",
    "slug": "french-bob-tu-nhien",
    "summary": "Kiểu tóc Bob ngắn ngang cằm tôn nét trẻ trung hiện đại.",
    "description": "Bob ngắn là biểu tượng của vẻ đẹp thanh lịch và năng động. Đường cắt sắc sảo ngang cằm kết hợp mái bay nhẹ nhàng làm nổi bật đường xương quai hàm.",
    "coverImageUrl": "https://images.unsplash.com/photo-1567532939604-b6b5b0db2604?auto=format&fit=crop&w=800&q=80",
    "galleryImages": [
      "https://images.unsplash.com/photo-1618835962148-cf177563c6c0?auto=format&fit=crop&w=800&q=80"
    ],
    "gender": "FEMALE",
    "length": "SHORT",
    "style": "CLASSIC",
    "styleVibe": "CLASSIC",
    "suitableFaces": [
      "OVAL",
      "DIAMOND",
      "HEART"
    ],
    "suitableTexture": [
      "STRAIGHT",
      "FINE"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "300000",
    "priceRefMin": "300000",
    "priceRefMax": "400000",
    "careAdvice": "Dùng dầu dưỡng argan vuốt nhẹ ngọn tóc sau khi sấy khô.",
    "stylingTips": "Kẹp càng cua nhẹ 10 phút trước khi ra ngoài để ngọn tóc cụp tự nhiên.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
    "category": {
      "id": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
      "name": "Kiểu Tóc Nữ",
      "slug": "toc-nu"
    }
  },
  {
    "id": "733a7ddc-9444-4299-b491-7d45d311466d",
    "title": "Buzz Cut Fade Sắc Nét",
    "name": "Buzz Cut Fade Sắc Nét",
    "slug": "buzz-cut-fade-sac-net",
    "summary": "Kiểu đầu đinh tối giản làm bật trọn vẹn từng đường nét góc cạnh trên khuôn mặt.",
    "description": "Đỉnh cao của sự gọn gàng và nam tính tối thượng. Đòi hỏi kỹ thuật Fade cạo sát tay nghề cao để tạo nên dải chuyển tiếp độ dài từ 0.5mm lên 6mm mượt mà như nhung.",
    "coverImageUrl": "/uploads/hairstyles/1792569830144_Buzz_Cut_Fade_S_c_N_t.jpg",
    "galleryImages": [
      "/uploads/hairstyles/1792569835836_Buzz_Cut_Fade_S_c_N_t.jpg",
      "/uploads/hairstyles/1792569849703_Buzz_Cut_Fade_S_c_N_t1.jpg"
    ],
    "gender": "MALE",
    "length": "VERY_SHORT",
    "style": "MINIMALIST",
    "styleVibe": "MINIMALIST",
    "suitableFaces": [
      "OVAL",
      "SQUARE"
    ],
    "suitableTexture": [
      "THICK",
      "COILY"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "150000",
    "priceRefMin": "150000",
    "priceRefMax": "200000",
    "careAdvice": "Chăm sóc da đầu chống nắng và dưỡng ẩm, cắt dặm lại sau mỗi 2-3 tuần.",
    "stylingTips": "Không cần tạo kiểu, rửa mặt kiêm gội đầu cực kỳ tiện lợi.",
    "isTrending": false,
    "isFeatured": false,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "5495490b-ecfc-4301-9d42-ad26269cba92",
    "title": "Mullet Layer Phá Cách",
    "name": "Mullet Layer Phá Cách",
    "slug": "mullet-layer-pha-cach",
    "summary": "Phong cách nổi loạn hiện đại với phần đuôi gáy dài chạm cổ và mái tỉa bất đối xứng.",
    "description": "Mullet hiện đại được biến tấu với các lớp layer mềm mại, loại bỏ cảm giác nặng nề cổ điển. Thích hợp cho những bạn trẻ yêu thích thời trang đường phố và gu thẩm mỹ phá cách.",
    "coverImageUrl": "/uploads/hairstyles/1792569917289_Mullet_Layer_Ph__C_ch.jpg",
    "galleryImages": [
      "/uploads/hairstyles/1792569924804_Mullet_Layer_Ph__C_ch1.jpg"
    ],
    "gender": "UNISEX",
    "length": "MEDIUM",
    "style": "STREETWEAR",
    "styleVibe": "STREETWEAR",
    "suitableFaces": [
      "OVAL",
      "ROUND",
      "DIAMOND"
    ],
    "suitableTexture": [
      "WAVY",
      "THICK"
    ],
    "careLevel": "MEDIUM",
    "careEffort": "MEDIUM",
    "price": "250000",
    "priceRefMin": "250000",
    "priceRefMax": "400000",
    "careAdvice": "Gội đầu với dầu gội dưỡng ẩm và sấy bung nhẹ phần đuôi tóc.",
    "stylingTips": "Vuốt một chút mousse tạo nếp uốn nhẹ ở ngọn tóc phía sau.",
    "isTrending": true,
    "isFeatured": false,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "66a9c206-ad23-4b6a-b493-27fa722d6183",
    "title": "Two-Block Layer Idol",
    "name": "Two-Block Layer Idol",
    "slug": "two-block-layer-lang-tu",
    "summary": "Thiết kế 2 tầng đặc trưng của các idol xứ kim chi, che khuyết điểm trán cao hoàn hảo.",
    "description": "Tóc Two-Block phân tách thành 2 khối rõ rệt: Khối dưới cắt ngắn gọn sát gáy, khối trên phủ xuống tỉa layer mềm mại giúp mái tóc có độ bay và nét thư sinh quyến rũ.",
    "coverImageUrl": "/uploads/hairstyles/1792570111218_Two-Block_Layer_Idol.jpg",
    "galleryImages": [],
    "gender": "MALE",
    "length": "MEDIUM",
    "style": "KOREAN",
    "styleVibe": "KOREAN",
    "suitableFaces": [
      "OVAL",
      "HEART",
      "OBLONG"
    ],
    "suitableTexture": [
      "STRAIGHT",
      "WAVY",
      "FINE"
    ],
    "careLevel": "MEDIUM",
    "careEffort": "MEDIUM",
    "price": "200000",
    "priceRefMin": "200000",
    "priceRefMax": "300000",
    "careAdvice": "Nên kết hợp uốn nhẹ chân tóc để mái tóc luôn giữ được độ phồng bồng bềnh sau khi ngủ dậy.",
    "stylingTips": "Dùng ngón tay luồn nhẹ vuốt bung tự nhiên, không cần chải lược cứng.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "cd440bbe-4dfc-455a-8dd9-376db564ac81",
    "title": "Side Part Pompadour Lịch Lãm",
    "name": "Side Part Pompadour Lịch Lãm",
    "slug": "modern-pompadour-quy-toc",
    "summary": "Biểu tượng lịch lãm của quý ông hiện đại với phần mái hất ngược tạo phồng cổ điển.",
    "description": "Kiểu tóc Pompadour mang lại khí chất thành đạt và tự tin. Phần tóc trên đỉnh được giữ độ dài lý tưởng 8-10cm, vuốt phồng ngược về sau kết hợp fade tàng hình mượt mà hai bên.",
    "coverImageUrl": "/uploads/hairstyles/1792570170851_Side_Part_Pompadour_L_ch_L_m.jpg",
    "galleryImages": [
      "/uploads/hairstyles/1792570176428_Side_Part_Pompadour_L_ch_L_m_2.jpg"
    ],
    "gender": "MALE",
    "length": "MEDIUM",
    "style": "CLASSIC",
    "styleVibe": "CLASSIC",
    "suitableFaces": [
      "SQUARE",
      "OVAL",
      "DIAMOND"
    ],
    "suitableTexture": [
      "THICK",
      "STRAIGHT"
    ],
    "careLevel": "HIGH",
    "careEffort": "HIGH",
    "price": "250000",
    "priceRefMin": "250000",
    "priceRefMax": "350000",
    "careAdvice": "Cần sấy định hình với lược tròn chuyên dụng và cố định bằng pomade gốc nước.",
    "stylingTips": "Sấy ngược hướng gió từ chân tóc để đạt được độ phồng tối đa 5-7cm.",
    "isTrending": false,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "b603574b-d8ae-48a4-bcd5-37ebcfcd4561",
    "title": "Textured Crop Châu Á",
    "name": "Textured Crop Châu Á",
    "slug": "textured-crop-han-quoc",
    "summary": "Kiểu tóc ngắn năng động với lớp layer dập nhẹ phía trên, viền fade gọn gàng tôn trán.",
    "description": "Textured Crop là sự pha trộn hoàn hảo giữa vẻ nam tính và sự trẻ trung. Phần mái được cắt ngang trên lông mày tỉa texture nhấp nhô, hai bên mai được fade gọn giúp làm nổi bật góc hàm sắc sảo.",
    "coverImageUrl": "/uploads/hairstyles/1792571063075_images__1_.jpg",
    "galleryImages": [],
    "gender": "MALE",
    "length": "SHORT",
    "style": "KOREAN",
    "styleVibe": "KOREAN",
    "suitableFaces": [
      "OVAL",
      "ROUND",
      "HEART"
    ],
    "suitableTexture": [
      "STRAIGHT",
      "THICK"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "180000",
    "priceRefMin": "180000",
    "priceRefMax": "250000",
    "careAdvice": "Chỉ cần sấy khô tự nhiên và xoa một lượng nhỏ sáp mờ matte clay là tóc đã vào phom.",
    "stylingTips": "Sử dụng thêm một lớp xịt phồng muối biển pre-styling khi tóc còn hơi ẩm.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "f68c5ac9-793e-4916-8492-2be998557a54",
    "title": "Layer Nữ Phồng Chữ C",
    "name": "Layer Nữ Phồng Chữ C",
    "slug": "layer-nu-phong-chu-c",
    "summary": "Các tầng layer ôm nhẹ gương mặt, ngọn tóc uốn cụp hình chữ C tạo hiệu ứng mặt thon gọn.",
    "description": "Mẫu tóc quốc dân được phái đẹp yêu thích nhất nhiều năm liền. Từng lọn tóc được cắt tỉa bậc thang tinh tế, đuôi tóc cụp nhẹ che phủ xương quai hàm và tôn nét thanh tú.",
    "coverImageUrl": "/uploads/hairstyles/1792569747718_Layer_N__Ph_ng_Ch__C.jpg",
    "galleryImages": [],
    "gender": "FEMALE",
    "length": "LONG",
    "style": "KOREAN",
    "styleVibe": "KOREAN",
    "suitableFaces": [
      "ALL"
    ],
    "suitableTexture": [
      "STRAIGHT",
      "FINE"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "350000",
    "priceRefMin": "350000",
    "priceRefMax": "550000",
    "careAdvice": "Dùng lược tròn cuộn ngọn tóc khi sấy ấm là tóc sẽ tự động cụp vào nếp.",
    "stylingTips": "Thoa một giọt tinh dầu dưỡng bóng ở phần đuôi tóc để tránh chẻ ngọn.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
    "category": {
      "id": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
      "name": "Kiểu Tóc Nữ",
      "slug": "toc-nu"
    }
  },
  {
    "id": "0018c0be-0946-4e0f-903f-2f9e0344ca53",
    "title": "Side Part 7/3 Rủ Hàn Quốc",
    "name": "Side Part 7/3 Rủ Hàn Quốc",
    "slug": "side-part-7-3-ru-hien-dai",
    "summary": "Tỷ lệ chia ngôi 7/3 kinh điển kết hợp phần mái rủ nhẹ tạo cảm giác ấm áp, lịch lãm.",
    "description": "Kiểu tóc linh hoạt phù hợp cả môi trường công sở sang trọng lẫn những buổi hẹn hò lãng mạn. Ranh giới chia ngôi tự nhiên uốn nhẹ hình chữ C tạo điểm nhấn tinh tế.",
    "coverImageUrl": "/uploads/hairstyles/1792570009018_Side_Part_7_3_R__H_n_Qu_c.jpg",
    "galleryImages": [
      "/uploads/hairstyles/1792570014989_Side_Part_7_3_R__H_n_Qu_c_2.jpg"
    ],
    "gender": "MALE",
    "length": "MEDIUM",
    "style": "BUSINESS",
    "styleVibe": "BUSINESS",
    "suitableFaces": [
      "ALL"
    ],
    "suitableTexture": [
      "STRAIGHT",
      "THICK"
    ],
    "careLevel": "MEDIUM",
    "careEffort": "MEDIUM",
    "price": "220000",
    "priceRefMin": "220000",
    "priceRefMax": "320000",
    "careAdvice": "Dùng dầu dưỡng nhẹ và sấy nếp rẽ ngôi ngay sau khi gội đầu.",
    "stylingTips": "Xịt gôm mềm để giữ form mà không làm cứng sợi tóc.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "e8f725dc-4284-4657-ba3a-2e67607ca700",
    "title": "Curtain Bangs Uốn Cụp Dịu Dàng",
    "name": "Curtain Bangs Uốn Cụp Dịu Dàng",
    "slug": "curtain-bangs-uon-cup",
    "summary": "Mái bay rẽ đôi mềm mại như rèm cửa sổ, hóa giải mọi khuyết điểm thái dương lõm.",
    "description": "Phần tóc mái bay dài ngang gò má rẽ ngôi giữa hoặc 6/4 uốn cong nhẹ nhàng về sau. Giúp gương mặt trông thon dài, thanh thoát và đậm chất tiểu thư kiêu kỳ.",
    "coverImageUrl": "/uploads/hairstyles/1792569405021_images.jpg",
    "galleryImages": [],
    "gender": "FEMALE",
    "length": "MEDIUM",
    "style": "KOREAN",
    "styleVibe": "KOREAN",
    "suitableFaces": [
      "ROUND",
      "OVAL",
      "SQUARE"
    ],
    "suitableTexture": [
      "FINE",
      "STRAIGHT"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "280000",
    "priceRefMin": "280000",
    "priceRefMax": "420000",
    "careAdvice": "Cuộn lô mái 15 phút mỗi sáng khi trang điểm.",
    "stylingTips": "Sấy ấm vào lô cuốn và sấy lạnh 5 giây để khóa nếp cong hoàn hảo.",
    "isTrending": true,
    "isFeatured": false,
    "isActive": true,
    "categoryId": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
    "category": {
      "id": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
      "name": "Kiểu Tóc Nữ",
      "slug": "toc-nu"
    }
  },
  {
    "id": "3b9297af-9ffe-45dc-8f4d-079d9a124f5d",
    "title": "Pixie Cut Năng Động Quý Phái",
    "name": "Pixie Cut Năng Động Quý Phái",
    "slug": "pixie-cut-nang-dong-quy-phai",
    "summary": "Tóc tém ngắn táo bạo làm nổi bật cổ thon, xương quai xanh và đôi mắt tinh anh.",
    "description": "Lựa chọn của những người phụ nữ bản lĩnh và tự tin. Từng đường kéo ôm trọn gáy, mái lệch dài vuốt xéo đem lại nét quyến rũ không thể cưỡng lại.",
    "coverImageUrl": "/uploads/hairstyles/1792569477373_Pixie_Cut_N_ng___ng_Qu__Ph_i.jpg",
    "galleryImages": [],
    "gender": "FEMALE",
    "length": "VERY_SHORT",
    "style": "MINIMALIST",
    "styleVibe": "MINIMALIST",
    "suitableFaces": [
      "OVAL",
      "HEART"
    ],
    "suitableTexture": [
      "FINE",
      "STRAIGHT"
    ],
    "careLevel": "MEDIUM",
    "careEffort": "MEDIUM",
    "price": "300000",
    "priceRefMin": "300000",
    "priceRefMax": "450000",
    "careAdvice": "Cần sấy định hình mỗi sáng để giữ form ôm gáy hoàn hảo.",
    "stylingTips": "Dùng một chút gel tạo kiểu bóng nhẹ để tôn vẻ sang trọng.",
    "isTrending": false,
    "isFeatured": false,
    "isActive": true,
    "categoryId": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
    "category": {
      "id": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
      "name": "Kiểu Tóc Nữ",
      "slug": "toc-nu"
    }
  },
  {
    "id": "a6e5c769-fb76-49d3-9fc6-2af0d8ae1ebf",
    "title": "Wolf Cut Thập Niên 90",
    "name": "Wolf Cut Thập Niên 90",
    "slug": "wolf-cut-thap-nien-90",
    "summary": "Sự giao thoa đầy hoang dại giữa Mullet và Shag, biểu tượng phong cách phi giới tính.",
    "description": "Đặc trưng với phần đỉnh đầu phồng dày và xẹp dần về phía đuôi tóc với vô số lớp cắt xơ nhám. Mang đến nét đẹp bụi bặm, hoang dại và đậm chất Rock & Roll.",
    "coverImageUrl": "/uploads/hairstyles/1792569535036_Wolf_Cut_Th_p_Ni_n_90.jpg",
    "galleryImages": [
      "https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?auto=format&fit=crop&w=800&q=80"
    ],
    "gender": "UNISEX",
    "length": "MEDIUM",
    "style": "STREETWEAR",
    "styleVibe": "STREETWEAR",
    "suitableFaces": [
      "ALL"
    ],
    "suitableTexture": [
      "WAVY",
      "THICK"
    ],
    "careLevel": "MEDIUM",
    "careEffort": "MEDIUM",
    "price": "350000",
    "priceRefMin": "350000",
    "priceRefMax": "500000",
    "careAdvice": "Để tóc khô tự nhiên kết hợp bóp nhẹ dầu dưỡng tạo nếp nhăn ngẫu hứng.",
    "stylingTips": "Nhuộm highlight ẩn (peekaboo) sẽ làm các lớp cắt wolf cut nổi bật hơn bao giờ hết.",
    "isTrending": false,
    "isFeatured": false,
    "isActive": true,
    "categoryId": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
    "category": {
      "id": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
      "name": "Kiểu Tóc Nữ",
      "slug": "toc-nu"
    }
  },
  {
    "id": "6df09651-5ed3-45ae-93e0-18441b69ef1a",
    "title": "Butterfly Cut Thần Thái (Layer Cánh Bướm)",
    "name": "Butterfly Cut Thần Thái (Layer Cánh Bướm)",
    "slug": "butterfly-cut-than-thai",
    "summary": "Các tầng tóc đan xen bồng bềnh mô phỏng sải cánh bướm, bay bổng và đầy sức sống.",
    "description": "Cơn sốt thời trang với sự hòa trộn của 2 độ dài: Tầng ngắn ôm sát cằm tạo hiệu ứng gương mặt thon và tầng dài thướt tha, tạo độ phồng tối đa cho mái tóc mỏng.",
    "coverImageUrl": "/uploads/hairstyles/1792569572204_Butterfly_Cut_Th_n_Th_i__Layer_C_nh_B__m_.jpg",
    "galleryImages": [],
    "gender": "FEMALE",
    "length": "LONG",
    "style": "CLASSIC",
    "styleVibe": "CLASSIC",
    "suitableFaces": [
      "ROUND",
      "SQUARE",
      "OVAL"
    ],
    "suitableTexture": [
      "THICK",
      "WAVY"
    ],
    "careLevel": "MEDIUM",
    "careEffort": "MEDIUM",
    "price": "400000",
    "priceRefMin": "400000",
    "priceRefMax": "650000",
    "careAdvice": "Sấy ngửa ra sau bằng lô cuốn cỡ lớn để tạo độ bay cho các tầng tóc.",
    "stylingTips": "Sử dụng xịt tạo kết cấu texture spray giúp các nếp tóc tách lớp rõ rệt.",
    "isTrending": true,
    "isFeatured": false,
    "isActive": true,
    "categoryId": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
    "category": {
      "id": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
      "name": "Kiểu Tóc Nữ",
      "slug": "toc-nu"
    }
  },
  {
    "id": "1210009b-ce97-46b8-98f5-28afdaedb008",
    "title": "Uốn Sóng Lơi Dịu Dàng Nữ Tính",
    "name": "Uốn Sóng Lơi Dịu Dàng Nữ Tính",
    "slug": "uon-song-loi-nuoc-phap",
    "summary": "Những lọn sóng lơi buông lơi tự nhiên như nước chảy, mang lại thần thái kiêu sa thanh lịch.",
    "description": "Không cầu kỳ vào lọn tròn cứng nhắc, sóng lơi tự nhiên tạo cảm giác bồng bềnh thanh thoát. Mái tóc bồng bềnh chuyển động theo từng bước chân đầy mê hoặc.",
    "coverImageUrl": "/uploads/hairstyles/1792569642351_U_n_S_ng_L_i_D_u_D_ng_N__T_nh.jpg",
    "galleryImages": [],
    "gender": "FEMALE",
    "length": "LONG",
    "style": "AVANT_GARDE",
    "styleVibe": "AVANT_GARDE",
    "suitableFaces": [
      "OVAL",
      "OBLONG",
      "ROUND"
    ],
    "suitableTexture": [
      "WAVY",
      "FINE"
    ],
    "careLevel": "MEDIUM",
    "careEffort": "MEDIUM",
    "price": "800000",
    "priceRefMin": "800000",
    "priceRefMax": "1500000",
    "careAdvice": "Dùng kẹp càng cua cuộn nhẹ sau khi sấy tóc khô 80%.",
    "stylingTips": "Xịt một lớp khoáng dưỡng ẩm trước khi ra ngoài để bảo vệ sợi tóc trước khói bụi.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
    "category": {
      "id": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
      "name": "Kiểu Tóc Nữ",
      "slug": "toc-nu"
    }
  },
  {
    "id": "eaccfc7f-7389-46e8-be58-4c0373e850e2",
    "title": "Bob Ngắn Cá Tính Tự Nhiên",
    "name": "Bob Ngắn Cá Tính Tự Nhiên",
    "slug": "bob-tia-tang-nhat-ban",
    "summary": "Mái tóc ngắn cá tính phong cách trẻ trung Á Đông, nhẹ tênh và tôn bờ vai gợi cảm.",
    "description": "Mẫu tóc ngắn năng động cắt ngang xương hàm kết hợp tỉa so le tinh tế. Giúp mái tóc trông dày dặn hơn gấp đôi và mang lại vẻ ngoài thông minh, sắc sảo cho quý cô hiện đại.",
    "coverImageUrl": "/uploads/hairstyles/1792569700028_Bob_Ng_n_C__T_nh_T__Nhi_n.jpg",
    "galleryImages": [],
    "gender": "FEMALE",
    "length": "SHORT",
    "style": "JAPANESE",
    "styleVibe": "JAPANESE",
    "suitableFaces": [
      "OVAL",
      "DIAMOND",
      "HEART"
    ],
    "suitableTexture": [
      "STRAIGHT",
      "THICK"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "300000",
    "priceRefMin": "300000",
    "priceRefMax": "450000",
    "careAdvice": "Sấy tóc hướng về phía trước và dùng một lượng dầu dưỡng nhẹ tạo độ bóng ướt (wet look).",
    "stylingTips": "Kẹp một bên tóc sau tai để khoe trọn khuyên tai và đường xương hàm.",
    "isTrending": false,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
    "category": {
      "id": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
      "name": "Kiểu Tóc Nữ",
      "slug": "toc-nu"
    }
  },
  {
    "id": "85044948-cf97-4de1-8fbe-6576375498f2",
    "title": "Side Part 7/3 Rủ Hàn Quốc",
    "name": "Side Part 7/3 Rủ Hàn Quốc",
    "slug": "side-part-73-ru-han-quoc",
    "summary": "Kiểu tóc Side Part 7/3 rủ lãng tử phong cách nam thần thịnh hành nhất tại các barbershop Việt Nam.",
    "description": "Sự kết hợp hoàn hảo giữa nét cổ điển của Side Part 7/3 và phần mái rủ uốn lượn dấu phẩy bồng bềnh, che khuyết điểm trán cao và tạo chiều sâu cho gương mặt nam giới Châu Á.",
    "coverImageUrl": "/uploads/hairstyles/1792570009018_Side_Part_7_3_R__H_n_Qu_c.jpg",
    "galleryImages": [
      "/images/hairstyles/vietnam/vn-sidepart-ru.jpg",
      "/images/hairstyles/vietnam/vn-sidepart-bay.jpg"
    ],
    "gender": "MALE",
    "length": "MEDIUM",
    "style": "KOREAN",
    "styleVibe": "KOREAN",
    "suitableFaces": [
      "OVAL",
      "ROUND",
      "HEART",
      "SQUARE"
    ],
    "suitableTexture": [
      "STRAIGHT",
      "WAVY"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "280000",
    "priceRefMin": "280000",
    "priceRefMax": "380000",
    "careAdvice": "Sấy ngược chiều chân tóc khi tóc còn ẩm 80%. Sử dụng sáp clay giữ nếp nhẹ nhàng.",
    "stylingTips": "Dùng lược răng thưa chải ngược rồi thả tự nhiên tạo độ tơi cho lọn tóc.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "5fc8a412-b950-4eef-9fba-90b5e3b3cd2e",
    "title": "Layer Ruffled Uốn Rối Nam",
    "name": "Layer Ruffled Uốn Rối Nam",
    "slug": "layer-ruffled-uon-roi-nam",
    "summary": "Layer tỉa tầng đan xen uốn rối nhẹ tạo phom bồng bềnh tự nhiên, cực kỳ hack độ dày cho tóc mỏng.",
    "description": "Layer Ruffled là xu hướng uốn rối tự nhiên cực hot tại Việt Nam, mang đến vẻ ngoài phóng khoáng, trẻ trung và năng động cho các bạn trẻ.",
    "coverImageUrl": "/images/hairstyles/vietnam/vn-layer-ruffled.jpg",
    "galleryImages": [
      "/images/hairstyles/vietnam/vn-layer-ruffled.jpg",
      "/images/hairstyles/vietnam/vn-layer-wavy.jpg"
    ],
    "gender": "MALE",
    "length": "SHORT",
    "style": "STREETWEAR",
    "styleVibe": "STREETWEAR",
    "suitableFaces": [
      "OVAL",
      "ROUND",
      "DIAMOND"
    ],
    "suitableTexture": [
      "STRAIGHT",
      "FINE",
      "THICK"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "300000",
    "priceRefMin": "300000",
    "priceRefMax": "420000",
    "careAdvice": "Dùng xịt tạo phồng trước khi sấy, thoa tinh dầu ngọn tóc dưỡng ẩm.",
    "stylingTips": "Bóp nhẹ ngọn tóc từ dưới lên khi sấy để giữ nguyên lọn sóng rối.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "b6caa77e-be77-447d-8a25-22124b85810f",
    "title": "Layer Con Sâu (Twist Perm Vietnam)",
    "name": "Layer Con Sâu (Twist Perm Vietnam)",
    "slug": "layer-con-sau-twist-perm-vietnam",
    "summary": "Kiểu uốn con sâu lốc xoáy cá tính, phong cách đường phố năng động được giới trẻ Việt Nam săn đón.",
    "description": "Uốn con sâu sử dụng kỹ thuật xoắn giấy bạc tạo ra các thớ tóc dập sóng nhỏ li ti, mang lại độ phồng cực đại và phong cách đường phố cực ngầu.",
    "coverImageUrl": "/images/hairstyles/vietnam/vn-layer-con-sau.jpg",
    "galleryImages": [
      "/images/hairstyles/vietnam/vn-layer-con-sau.jpg"
    ],
    "gender": "MALE",
    "length": "SHORT",
    "style": "STREETWEAR",
    "styleVibe": "STREETWEAR",
    "suitableFaces": [
      "ROUND",
      "OVAL",
      "SQUARE"
    ],
    "suitableTexture": [
      "STRAIGHT",
      "WAVY",
      "THICK"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "350000",
    "priceRefMin": "350000",
    "priceRefMax": "450000",
    "careAdvice": "Sử dụng dầu gội dưỡng ẩm sâu, hạn chế chải tóc bằng lược răng dày.",
    "stylingTips": "Chỉ cần sấy ráo và xoa nhẹ một chút sáp tạo nếp dạng bột.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "2501d942-9a24-4e1e-ba6b-23a9e338ae02",
    "title": "Side Part Phồng Chân Tóc",
    "name": "Side Part Phồng Chân Tóc",
    "slug": "side-part-phong-chan-toc-nam",
    "summary": "Uốn phồng chân tóc định hình ngôi rẽ sắc nét, tạo độ bồng sang trọng chuẩn quý ông công sở hiện đại.",
    "description": "Kỹ thuật uốn lạnh nâng chân tóc độc quyền giúp phần chân tóc đứng form tự nhiên mà không cần dùng gôm sấy mỗi ngày. Phù hợp cho dân văn phòng và doanh nhân.",
    "coverImageUrl": "/images/hairstyles/vietnam/vn-sidepart-phong.jpg",
    "galleryImages": [
      "/images/hairstyles/vietnam/vn-sidepart-phong.jpg"
    ],
    "gender": "MALE",
    "length": "MEDIUM",
    "style": "BUSINESS",
    "styleVibe": "BUSINESS",
    "suitableFaces": [
      "OVAL",
      "ROUND",
      "DIAMOND",
      "SQUARE"
    ],
    "suitableTexture": [
      "STRAIGHT",
      "THICK"
    ],
    "careLevel": "MEDIUM",
    "careEffort": "MEDIUM",
    "price": "300000",
    "priceRefMin": "300000",
    "priceRefMax": "400000",
    "careAdvice": "Sấy ngược chiều chân tóc tạo phồng trước khi vuốt pomade.",
    "stylingTips": "Kết hợp pomade gốc nước để có độ bóng mượt sang trọng.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "966da69c-0d63-4f2b-b08e-0301d4de32c7",
    "title": "Curly Hair High Drop Fade",
    "name": "Curly Hair High Drop Fade",
    "slug": "curly-hair-high-drop-fade",
    "summary": "Sự kết hợp giữa uốn xoăn tít phong cách hiện đại và đường cạo High Drop Fade cực nét hai bên.",
    "description": "Phần đỉnh đầu uốn xoăn lọn nhỏ nổi bật tương phản mạnh mẽ với hai bên mang tai được cạo mờ da đầu (Fade), tạo diện mạo cực kỳ cuốn hút và sành điệu.",
    "coverImageUrl": "/images/hairstyles/vietnam/vn-curly-fade.jpg",
    "galleryImages": [
      "/images/hairstyles/vietnam/vn-curly-fade.jpg"
    ],
    "gender": "MALE",
    "length": "SHORT",
    "style": "CLASSIC",
    "styleVibe": "CLASSIC",
    "suitableFaces": [
      "OVAL",
      "SQUARE",
      "HEART"
    ],
    "suitableTexture": [
      "CURLY",
      "COILY",
      "THICK"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "320000",
    "priceRefMin": "320000",
    "priceRefMax": "420000",
    "careAdvice": "Dùng dầu xả giữ ẩm và kem định hình lọn xoăn.",
    "stylingTips": "Bóp kem dưỡng lọn khi tóc còn ướt để giữ nguyên phom xoăn.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "4301df6c-13db-4786-bb23-fa8def1ef643",
    "title": "Layer Phồng Textured Mullet",
    "name": "Layer Phồng Textured Mullet",
    "slug": "layer-phong-textured-mullet",
    "summary": "Phần gáy Mullet để dài vừa phải kết hợp mái tỉa layer bay phồng, tạo nét lãng tử chuẩn visual nghệ sĩ.",
    "description": "Mullet hiện đại được tinh chỉnh cho người Việt với độ dài gáy vừa chạm cổ, hai bên tỉa gọn và mái layer phồng tự nhiên, không bị quá gai góc mà vẫn đậm chất cá tính.",
    "coverImageUrl": "/images/hairstyles/vietnam/vn-layer-phong.jpg",
    "galleryImages": [
      "/images/hairstyles/vietnam/vn-layer-phong.jpg"
    ],
    "gender": "MALE",
    "length": "MEDIUM",
    "style": "KOREAN",
    "styleVibe": "KOREAN",
    "suitableFaces": [
      "OVAL",
      "HEART",
      "DIAMOND"
    ],
    "suitableTexture": [
      "STRAIGHT",
      "WAVY"
    ],
    "careLevel": "MEDIUM",
    "careEffort": "MEDIUM",
    "price": "320000",
    "priceRefMin": "320000",
    "priceRefMax": "450000",
    "careAdvice": "Tỉa định kỳ sau 4-5 tuần để giữ độ dài đuôi gáy chuẩn tỉ lệ.",
    "stylingTips": "Sấy vuốt xuôi phần gáy và đánh tơi phần đỉnh đầu.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "c7ab02d1-64ef-4b99-b8fd-698f945eee02",
    "title": "Side Part Bay Lãng Tử (Comma Hair)",
    "name": "Side Part Bay Lãng Tử (Comma Hair)",
    "slug": "side-part-bay-lang-tu-comma-hair",
    "summary": "Đường ngôi rẽ 6/4 uốn cong hình dấu phẩy bay lượn nhẹ nhàng về phía thái dương, che khuyết điểm trán cao.",
    "description": "Kiểu tóc dấu phẩy Comma Hair được ưa chuộng bậc nhất bởi các sao nam Việt Nam và Hàn Quốc. Mái tóc uốn lượn hình chữ C tạo vẻ ngoài dịu dàng, tri thức và điển trai.",
    "coverImageUrl": "/images/hairstyles/vietnam/vn-sidepart-bay.jpg",
    "galleryImages": [
      "/images/hairstyles/vietnam/vn-sidepart-bay.jpg"
    ],
    "gender": "MALE",
    "length": "MEDIUM",
    "style": "KOREAN",
    "styleVibe": "KOREAN",
    "suitableFaces": [
      "OVAL",
      "ROUND",
      "HEART"
    ],
    "suitableTexture": [
      "STRAIGHT",
      "FINE"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "280000",
    "priceRefMin": "280000",
    "priceRefMax": "380000",
    "careAdvice": "Dùng lược tròn uốn nhẹ phần ngọn mái khi sấy.",
    "stylingTips": "Xịt gôm khóa nếp nhẹ nhàng vào chân mái để giữ độ bay cả ngày.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "24ed8107-b1f3-4c7e-b3c3-76b8f352322f",
    "title": "Layer Uốn Chữ S Tự Nhiên",
    "name": "Layer Uốn Chữ S Tự Nhiên",
    "slug": "layer-uon-chu-s-tu-nhien",
    "summary": "Sóng lượn chữ S mềm mại giúp tóc vào nếp tự nhiên mà không cần sấy tạo kiểu cầu kỳ sau khi gội.",
    "description": "Kỹ thuật uốn chữ S lọn to tạo chuyển động mềm mại cho các tầng tóc, mang lại cảm giác mái tóc dày bồng bềnh và thanh thoát.",
    "coverImageUrl": "/images/hairstyles/vietnam/vn-layer-chu-s.jpg",
    "galleryImages": [
      "/images/hairstyles/vietnam/vn-layer-chu-s.jpg"
    ],
    "gender": "MALE",
    "length": "MEDIUM",
    "style": "KOREAN",
    "styleVibe": "KOREAN",
    "suitableFaces": [
      "OVAL",
      "ROUND",
      "SQUARE"
    ],
    "suitableTexture": [
      "WAVY",
      "STRAIGHT"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "300000",
    "priceRefMin": "300000",
    "priceRefMax": "400000",
    "careAdvice": "Dùng dầu dưỡng vuốt ngọn tóc sau khi sấy khô.",
    "stylingTips": "Dùng tay bóp nhẹ tóc khi sấy để sóng giữ được lọn tròn đẹp.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "59492965-f4fa-448f-9273-b49ea4ccf081",
    "title": "Textured Ivy League Fade",
    "name": "Textured Ivy League Fade",
    "slug": "textured-ivy-league-fade",
    "summary": "Kiểu tóc Ivy League vuốt dựng đỉnh đầu kết hợp taper fade hai bên gọn gàng, toát lên phong thái chỉn chu, quyết đoán.",
    "description": "Xu hướng tóc nam được yêu thích hàng đầu năm 2026. Phần mái tỉa nhọn vuốt dựng tự nhiên kết hợp cạo fade gáy mang lại vẻ ngoài nam tính, sang trọng và tràn đầy năng lượng.",
    "coverImageUrl": "/images/hairstyles/vietnam/vn-texture-ivy.jpg",
    "galleryImages": [
      "/images/hairstyles/vietnam/vn-texture-ivy.jpg",
      "/images/hairstyles/vietnam/vn-barber-fade-line.jpg"
    ],
    "gender": "MALE",
    "length": "SHORT",
    "style": "BUSINESS",
    "styleVibe": "BUSINESS",
    "suitableFaces": [
      "OVAL",
      "SQUARE",
      "DIAMOND"
    ],
    "suitableTexture": [
      "STRAIGHT",
      "THICK"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "250000",
    "priceRefMin": "250000",
    "priceRefMax": "350000",
    "careAdvice": "Gội sạch da đầu mỗi ngày và cắt tỉa duy trì phom sau 2-3 tuần.",
    "stylingTips": "Xoa đều sáp clay lên lòng bàn tay và vuốt hất ngược từ chân tóc lên trên.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "1c50dd8f-38b9-4e97-b894-fe1640a23b54",
    "title": "Textured Crop Fade Tattoo Line (Barber VN)",
    "name": "Textured Crop Fade Tattoo Line (Barber VN)",
    "slug": "textured-crop-fade-ke-line-barber-vn",
    "summary": "Được cắt tỉa trực tiếp bởi các tay kéo Barber Việt Nam với đường Fade mượt mà và đường cạo kẻ line nghệ thuật sắc bén.",
    "description": "Mẫu tóc lấy cảm hứng trực tiếp từ phong trào Barbering tại Việt Nam (Reddit r/Barber & Thanks Barber Shop). Phần mái bấm ngố tỉa texture kết hợp đường kẻ line tattoo tạo điểm nhấn sắc sảo.",
    "coverImageUrl": "/images/hairstyles/vietnam/vn-barber-fade-line.jpg",
    "galleryImages": [
      "/images/hairstyles/vietnam/vn-barber-fade-line.jpg",
      "/images/hairstyles/vietnam/vn-texture-ivy.jpg"
    ],
    "gender": "MALE",
    "length": "SHORT",
    "style": "STREETWEAR",
    "styleVibe": "STREETWEAR",
    "suitableFaces": [
      "OVAL",
      "SQUARE",
      "ROUND"
    ],
    "suitableTexture": [
      "STRAIGHT",
      "THICK"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "250000",
    "priceRefMin": "250000",
    "priceRefMax": "350000",
    "careAdvice": "Duy trì đường kẻ cạo sau 10-14 ngày để giữ nét sắc cạnh.",
    "stylingTips": "Sử dụng lược cào nhẹ phần mái xuôi xuống trán.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "6b01de16-3ca5-4d53-b917-a38461b775aa",
    "title": "Textured Two-Block Nhuộm Đỏ Rượu Vang",
    "name": "Textured Two-Block Nhuộm Đỏ Rượu Vang",
    "slug": "textured-two-block-nhuom-do-ruou-vang",
    "summary": "Combo cắt Two-Block tỉa tầng kết hợp nhuộm đỏ rượu vang Burgundy rực rỡ, cá tính và cực kỳ tôn làn da Châu Á.",
    "description": "Phong cách dẫn đầu xu hướng Instagram 2026. Sự hòa quyện giữa kỹ thuật cắt Two-Block hiện đại và tone màu đỏ rượu vang Burgundy tôn vinh khí chất cuốn hút, nổi bật trước đám đông.",
    "coverImageUrl": "/images/hairstyles/vietnam/vn-crimson-textured-twoblock.jpg",
    "galleryImages": [
      "/images/hairstyles/vietnam/vn-crimson-textured-twoblock.jpg",
      "/images/hairstyles/vietnam/vn-ashbrown-dropfade-crop.jpg"
    ],
    "gender": "MALE",
    "length": "MEDIUM",
    "style": "STREETWEAR",
    "styleVibe": "STREETWEAR",
    "suitableFaces": [
      "OVAL",
      "HEART",
      "DIAMOND"
    ],
    "suitableTexture": [
      "STRAIGHT",
      "THICK"
    ],
    "careLevel": "MEDIUM",
    "careEffort": "MEDIUM",
    "price": "650000",
    "priceRefMin": "650000",
    "priceRefMax": "850000",
    "careAdvice": "Dùng dầu gội giữ màu chuyên dụng không chứa sulfate.",
    "stylingTips": "Xịt dưỡng bóng và sáp mềm tạo lọn tóc tơi bồng.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "37b7812f-c4ca-4387-8ac5-72cb95b65fe2",
    "title": "Drop Fade Crop Nhuộm Nâu Khói Ánh Rêu",
    "name": "Drop Fade Crop Nhuộm Nâu Khói Ánh Rêu",
    "slug": "drop-fade-crop-nhuom-nau-khoi",
    "summary": "Sự kết hợp hoàn hảo giữa kỹ thuật cắt Drop Fade hiện đại và sắc nâu khói trầm ấm, tôn vẻ điển trai tự nhiên.",
    "description": "Kiểu tóc Crop hạ viền gáy (Drop Fade) kết hợp tone nhuộm nâu khói ánh rêu thời thượng. Mang lại diện mạo thư sinh, lịch lãm nhưng vẫn vô cùng phá cách.",
    "coverImageUrl": "/images/hairstyles/vietnam/vn-ashbrown-dropfade-crop.jpg",
    "galleryImages": [
      "/images/hairstyles/vietnam/vn-ashbrown-dropfade-crop.jpg"
    ],
    "gender": "MALE",
    "length": "SHORT",
    "style": "KOREAN",
    "styleVibe": "KOREAN",
    "suitableFaces": [
      "OVAL",
      "SQUARE",
      "HEART"
    ],
    "suitableTexture": [
      "WAVY",
      "THICK",
      "STRAIGHT"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "550000",
    "priceRefMin": "550000",
    "priceRefMax": "750000",
    "careAdvice": "Gội nước mát để màu nhuộm bền lâu trên 2 tháng.",
    "stylingTips": "Sấy khô rồi rắc bột tạo phồng texture dust lên đỉnh đầu.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "df0160ca-4941-4c87-b383-5b123cb9dcf9",
    "title": "Curly S Lơi Hàn Quốc Nam",
    "name": "Curly S Lơi Hàn Quốc Nam",
    "slug": "curly-s-loi-han-quoc-nam",
    "summary": "Uốn sóng lơi nhẹ nhàng, các lọn tóc xoăn đan xen tự nhiên mang lại vẻ ngoài cuốn hút và thư sinh.",
    "description": "Kiểu tóc uốn xoăn nhẹ nhàng lọn to tạo cảm giác thư sinh, lãng mạn. Rất phù hợp với các bạn trẻ yêu thích phong cách soft boy Hàn Quốc thịnh hành tại Việt Nam.",
    "coverImageUrl": "/images/hairstyles/vietnam/vn-curly-s-loi.jpg",
    "galleryImages": [
      "/images/hairstyles/vietnam/vn-curly-s-loi.jpg"
    ],
    "gender": "MALE",
    "length": "MEDIUM",
    "style": "KOREAN",
    "styleVibe": "KOREAN",
    "suitableFaces": [
      "OVAL",
      "HEART",
      "DIAMOND"
    ],
    "suitableTexture": [
      "CURLY",
      "WAVY"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "320000",
    "priceRefMin": "320000",
    "priceRefMax": "420000",
    "careAdvice": "Dùng dầu xả đều đặn và bóp nhẹ giữ lọn khi còn ướt.",
    "stylingTips": "Sấy loa khuếch tán gió nhẹ để lọn xoăn vào nếp hoàn hảo.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "ae7d5554-4867-426e-9ca7-24acf60ae12d",
    "title": "Uốn Chữ S Xoăn Bồng Bềnh Nam",
    "name": "Uốn Chữ S Xoăn Bồng Bềnh Nam",
    "slug": "uon-chu-s-xoan-bong-benh-nam",
    "summary": "Lọn xoăn chữ S xếp tầng bồng bềnh phong cách idol K-pop, tôn lên sự trẻ trung và ấm áp.",
    "description": "Sóng tóc uốn hình chữ S kết hợp kỹ thuật tỉa chuyển động mang đến độ phồng hoàn hảo và diện mạo cuốn hút như các idol âm nhạc.",
    "coverImageUrl": "/images/hairstyles/vietnam/vn-uon-chu-s-xoan.jpg",
    "galleryImages": [
      "/images/hairstyles/vietnam/vn-uon-chu-s-xoan.jpg"
    ],
    "gender": "MALE",
    "length": "MEDIUM",
    "style": "KOREAN",
    "styleVibe": "KOREAN",
    "suitableFaces": [
      "OVAL",
      "ROUND",
      "HEART"
    ],
    "suitableTexture": [
      "WAVY",
      "THICK"
    ],
    "careLevel": "MEDIUM",
    "careEffort": "MEDIUM",
    "price": "320000",
    "priceRefMin": "320000",
    "priceRefMax": "450000",
    "careAdvice": "Ủ tóc với tinh dầu argan tuần 1 lần để lọn xoăn luôn óng ả.",
    "stylingTips": "Sấy bằng tay luồn chân tóc nâng phồng tự nhiên.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "c9f08fe0-cc7c-40a5-a25a-0d03aaf3ac6d",
    "title": "Layer Wavy Uốn Sóng Nhẹ",
    "name": "Layer Wavy Uốn Sóng Nhẹ",
    "slug": "layer-wavy-uon-song-nhe",
    "summary": "Lọn sóng nhẹ mềm mại buông lơi tự nhiên, thích hợp cho học sinh, sinh viên và nhân viên văn phòng.",
    "description": "Mẫu tóc layer nam uốn gợn sóng nhẹ nhàng thanh lịch, cực kỳ dễ chăm sóc và giữ nếp, phù hợp trong mọi hoàn cảnh đi học, đi làm.",
    "coverImageUrl": "/images/hairstyles/vietnam/vn-layer-wavy.jpg",
    "galleryImages": [
      "/images/hairstyles/vietnam/vn-layer-wavy.jpg"
    ],
    "gender": "MALE",
    "length": "MEDIUM",
    "style": "KOREAN",
    "styleVibe": "KOREAN",
    "suitableFaces": [
      "OVAL",
      "ROUND",
      "HEART"
    ],
    "suitableTexture": [
      "WAVY",
      "STRAIGHT"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "280000",
    "priceRefMin": "280000",
    "priceRefMax": "380000",
    "careAdvice": "Gội xả bình thường, để khô tự nhiên hoặc sấy nhẹ.",
    "stylingTips": "Dùng một chút sáp thơm dạng cream vuốt nhẹ ngọn tóc.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
    "category": {
      "id": "d5e3650f-e7c5-49eb-8bee-636ed3e4fe0b",
      "name": "Kiểu Tóc Nam",
      "slug": "toc-nam"
    }
  },
  {
    "id": "6e79601a-913d-48d0-928f-fda3308f8b6c",
    "title": "Wolf Cut Tỉa Tầng Nữ Châu Á",
    "name": "Wolf Cut Tỉa Tầng Nữ Châu Á",
    "slug": "korean-wolf-cut-textured",
    "summary": "Kiểu tóc tỉa layer phóng khoáng kết hợp độ phồng tự nhiên phong cách trẻ trung.",
    "description": "Wolf Cut biến thể châu Á kết hợp giữa Mullet và Shag, được tỉa layer mềm mại giúp ôm trọn gương mặt, tạo hiệu ứng thanh thoát và trẻ trung.",
    "coverImageUrl": "https://images.unsplash.com/photo-1605497788044-5a32c7078486?auto=format&fit=crop&w=800&q=80",
    "galleryImages": [
      "https://images.unsplash.com/photo-1618835962148-cf177563c6c0?auto=format&fit=crop&w=800&q=80"
    ],
    "gender": "FEMALE",
    "length": "MEDIUM",
    "style": "KOREAN",
    "styleVibe": "KOREAN",
    "suitableFaces": [
      "ROUND",
      "OVAL",
      "HEART"
    ],
    "suitableTexture": [
      "WAVY",
      "STRAIGHT",
      "THICK"
    ],
    "careLevel": "LOW",
    "careEffort": "LOW",
    "price": "350000",
    "priceRefMin": "350000",
    "priceRefMax": "450000",
    "careAdvice": "Sấy tạo phồng bằng lược tròn khi tóc còn ẩm 70%. Thoa 2 giọt serum dưỡng ngọn mỗi sáng.",
    "stylingTips": "Sử dụng sáp mờ matte clay hoặc xịt muối biển tạo texture chuyển động tự nhiên.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
    "category": {
      "id": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
      "name": "Kiểu Tóc Nữ",
      "slug": "toc-nu"
    }
  },
  {
    "id": "e5a2b9f0-1711-45a7-9a6c-48ae1c45cb95",
    "title": "Layer Sóng Lơi Dịu Dàng Nữ",
    "name": "Layer Sóng Lơi Dịu Dàng Nữ",
    "slug": "layer-song-loi-han-quoc",
    "summary": "Mái tóc dài thướt tha với những gợn sóng buông lơi phong cách Á Đông.",
    "description": "Kiểu tóc quốc dân tôn lên nét dịu dàng nữ tính của phụ nữ Á Đông. Từng tầng layer được uốn sóng lơi nhẹ nhàng, tạo cảm giác dày dặn, bồng bềnh như mây.",
    "coverImageUrl": "https://images.unsplash.com/photo-1588516903720-8ceb67f9ef84?auto=format&fit=crop&w=800&q=80",
    "galleryImages": [
      "https://images.unsplash.com/photo-1616683693504-3ea7e9ad6fec?auto=format&fit=crop&w=800&q=80"
    ],
    "gender": "FEMALE",
    "length": "LONG",
    "style": "KOREAN",
    "styleVibe": "KOREAN",
    "suitableFaces": [
      "OVAL",
      "ROUND",
      "SQUARE"
    ],
    "suitableTexture": [
      "WAVY",
      "FINE",
      "THICK"
    ],
    "careLevel": "MEDIUM",
    "careEffort": "MEDIUM",
    "price": "450000",
    "priceRefMin": "450000",
    "priceRefMax": "600000",
    "careAdvice": "Dùng kẹp càng cua cuộn lọn sóng khi ở nhà. Sử dụng dầu gội không chứa Sulfate.",
    "stylingTips": "Sấy khô 80% rồi cuộn tròn lọn tóc quanh ngón tay hoặc ống lô lớn.",
    "isTrending": true,
    "isFeatured": true,
    "isActive": true,
    "categoryId": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
    "category": {
      "id": "2ab97059-3a25-4934-9072-8b17ad2fa1b1",
      "name": "Kiểu Tóc Nữ",
      "slug": "toc-nu"
    }
  }
];

// Auto-seed memoryStore with hairstyles if empty
try {
  if (typeof memoryStore !== 'undefined' && memoryStore.hairstyles && memoryStore.hairstyles.length === 0) {
    memoryStore.hairstyles = DEFAULT_HAIRSTYLES.map((h: any) => ({
      ...h,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));
  }
} catch {
  // ignore
}

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
