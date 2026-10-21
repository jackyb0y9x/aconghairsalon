/**
 * Tier 3: Cross-Feature Combinations - Admin Mutation -> Public Reflection
 */

import { expect } from '../../harness/assertions.ts';
import { describe, it } from '../../harness/runner.ts';
import type { TestContext } from '../../harness/types.ts';

describe('Tier 3 - Combinatorial: Admin CRUD -> Public Display Reflection', 3, () => {
  it(
    'TC3.4: Newly created Hairstyle in Admin CMS immediately reflects in Public Catalog',
    async (ctx: TestContext) => {
      // 1. Initial count in public catalog
      const initialPublicRes = await ctx.client.get('/api/public/hairstyles');
      const initialCount = initialPublicRes.data.total;

      // 2. Admin creates new hairstyle
      ctx.client.withRole('CONTENT_ADMIN');
      const newStyle = {
        name: 'Hime Cut Nhật Bản Sang Trọng',
        slug: 'hime-cut-nhat-ban-sang-trong',
        gender: 'FEMALE',
        style: 'JAPANESE',
        length: 'LONG',
        faceShape: 'OVAL',
        texture: 'STRAIGHT',
        careLevel: 'MEDIUM',
        price: 500000,
        tags: ['hime-cut', 'japanese', 'trendy'],
        images: ['/images/styles/hime-cut.jpg'],
        features: ['Tóc mai cắt bằng ngang má tạo điểm nhấn quý phái'],
        careAdvice: 'Dùng xịt bóng bảo vệ tóc thẳng mượt'
      };

      const createRes = await ctx.client.post('/api/admin/hairstyles', newStyle);
      expect(createRes.status).toBe(201);
      const createdId = createRes.data.id;

      // 3. Verify public catalog immediately reflects the new hairstyle
      ctx.client.clearAuth();
      const updatedPublicRes = await ctx.client.get('/api/public/hairstyles');
      expect(updatedPublicRes.status).toBe(200);
      expect(updatedPublicRes.data.total).toBe(initialCount + 1);

      const foundInPublic = updatedPublicRes.data.items.find((h: any) => h.id === createdId);
      expect(foundInPublic).toBeDefined();
      expect(foundInPublic.name).toBe(newStyle.name);

      // 4. Verify public detail endpoint
      const detailRes = await ctx.client.get(`/api/public/hairstyles/${newStyle.slug}`);
      expect(detailRes.status).toBe(200);
      expect(detailRes.data.name).toBe(newStyle.name);
      expect(detailRes.data.price).toBe(500000);
    },
    { id: 'TC3.4', feature: 'Admin Creation Reflection' }
  );

  it(
    'TC3.5: Admin updates to Hairstyle specs immediately reflect in Public Detail endpoint',
    async (ctx: TestContext) => {
      // 1. Admin updates price and care advice of existing style
      ctx.client.withRole('CONTENT_ADMIN');
      const updatePayload = {
        price: 390000,
        careAdvice: 'Sấy phồng bằng lược bán nguyệt và thoa serum Moroccanoil'
      };

      const updateRes = await ctx.client.put('/api/admin/hairstyles/hs-korean-wolf-cut', updatePayload);
      expect(updateRes.status).toBe(200);
      expect(updateRes.data.price).toBe(390000);

      // 2. Query public detail as unauthenticated visitor
      ctx.client.clearAuth();
      const publicDetailRes = await ctx.client.get('/api/public/hairstyles/korean-wolf-cut-textured');
      expect(publicDetailRes.status).toBe(200);
      expect(publicDetailRes.data.price).toBe(390000);
      expect(publicDetailRes.data.careAdvice).toContain('Moroccanoil');
    },
    { id: 'TC3.5', feature: 'Admin Mutation Reflection' }
  );

  it(
    'TC3.6: Deleted Hairstyle in Admin is immediately removed from Public Catalog (404 on Detail)',
    async (ctx: TestContext) => {
      // 1. Admin deletes style
      ctx.client.withRole('CONTENT_ADMIN');
      const deleteRes = await ctx.client.delete('/api/admin/hairstyles/hs-classic-bob');
      expect(deleteRes.status).toBe(200);

      // 2. Public catalog check: style is gone
      ctx.client.clearAuth();
      const publicListRes = await ctx.client.get('/api/public/hairstyles');
      const deletedFound = publicListRes.data.items.find((h: any) => h.id === 'hs-classic-bob');
      expect(deletedFound).toBeUndefined();

      // 3. Public detail endpoint returns 404
      const detailRes = await ctx.client.get('/api/public/hairstyles/french-bob-tu-nhien');
      expect(detailRes.status).toBe(404);
    },
    { id: 'TC3.6', feature: 'Admin Deletion Reflection' }
  );
});
