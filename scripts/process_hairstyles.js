const sharp = require('sharp');
const path = require('path');
const fs = require('fs');

async function cropFinal() {
  const outDir = path.join(process.cwd(), 'public', 'images', 'hairstyles', 'vietnam');
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  const rows = [
    { startY: 145, height: 290 },
    { startY: 565, height: 325 },
    { startY: 1025, height: 330 },
    { startY: 1485, height: 320 },
  ];

  const cols = [
    { startX: 0, width: 480 },
    { startX: 480, width: 480 },
    { startX: 960, width: 480 },
  ];

  const gridData = [
    [
      { id: 'vn-layer-ruffled', name: 'Layer Ruffled Uốn Rối Nam' },
      { id: 'vn-sidepart-ru', name: 'Side Part 7/3 Rủ Hàn Quốc' },
      { id: 'vn-layer-wavy', name: 'Layer Wavy Uốn Sóng Nhẹ' },
    ],
    [
      { id: 'vn-layer-con-sau', name: 'Layer Con Sâu (Twist Perm)' },
      { id: 'vn-sidepart-phong', name: 'Side Part Phồng Chân Tóc' },
      { id: 'vn-curly-fade', name: 'Curly Hair High Fade' },
    ],
    [
      { id: 'vn-layer-phong', name: 'Layer Phồng Textured Mullet' },
      { id: 'vn-sidepart-bay', name: 'Side Part Bay Lãng Tử' },
      { id: 'vn-layer-chu-s', name: 'Layer Uốn Chữ S Tự Nhiên' },
    ],
    [
      { id: 'vn-texture-ivy', name: 'Textured Ivy League Fade' },
      { id: 'vn-uon-chu-s-xoan', name: 'Uốn Chữ S Xoăn Bồng Bềnh' },
      { id: 'vn-curly-s-loi', name: 'Curly S Lơi Hàn Quốc' },
    ],
  ];

  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 3; c++) {
      const item = gridData[r][c];
      const left = cols[c].startX;
      const top = rows[r].startY;
      const width = cols[c].width;
      const height = rows[r].height;

      await sharp('temp_images/img3_googlebot.jpg')
        .extract({ left, top, width, height })
        .resize(600, 750, { fit: 'cover', position: 'top' })
        .jpeg({ quality: 95 })
        .toFile(path.join(outDir, `${item.id}.jpg`));
    }
  }

  // Reddit
  await sharp('temp_images/img2_reddit.jpg')
    .extract({ left: 100, top: 120, width: 880, height: 1100 })
    .resize(600, 750, { fit: 'cover', position: 'top' })
    .jpeg({ quality: 95 })
    .toFile(path.join(outDir, 'vn-barber-fade-line.jpg'));

  // Instagram
  const meta1 = await sharp('temp_images/img1_instagram_photo.jpg').metadata();
  const halfW = Math.floor(meta1.width / 2);

  await sharp('temp_images/img1_instagram_photo.jpg')
    .extract({ left: 0, top: 0, width: halfW, height: meta1.height })
    .resize(600, 750, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 95 })
    .toFile(path.join(outDir, 'vn-crimson-textured-twoblock.jpg'));

  await sharp('temp_images/img1_instagram_photo.jpg')
    .extract({ left: halfW, top: 0, width: meta1.width - halfW, height: meta1.height })
    .resize(600, 750, { fit: 'cover', position: 'center' })
    .jpeg({ quality: 95 })
    .toFile(path.join(outDir, 'vn-ashbrown-dropfade-crop.jpg'));

  console.log('Finished 100% clean hairstyle crops!');
}

cropFinal().catch(console.error);
