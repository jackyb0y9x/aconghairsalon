/**
 * Tier 2: Boundary & Corner Cases - Hair Try-On Limits
 */

import { expect } from '../../harness/assertions.ts';
import { describe, it } from '../../harness/runner.ts';
import type { TestContext } from '../../harness/types.ts';

describe('Tier 2 - Hair Try-On Boundary Limits', 2, () => {
  it(
    'TC2.7: 0-byte empty image payload rejected with HTTP 400',
    async (ctx: TestContext) => {
      const emptyPayload = {
        imageBuffer: ctx.fixtures.EMPTY_BUFFER,
        mimeType: 'image/jpeg',
        hairstyleId: 'hs-classic-bob'
      };

      const res = await ctx.client.post('/api/try-on', emptyPayload);
      expect(res.status).toBe(400);
      expect(res.data.error).toContain('không hợp lệ hoặc rỗng');
    },
    { id: 'TC2.7', feature: 'Try-On Zero Byte Buffer Rejection' }
  );

  it(
    'TC2.8: Exactly 5.0 MB boundary payload is accepted and processed',
    async (ctx: TestContext) => {
      const payload5MB = {
        imageBuffer: ctx.fixtures.BUFFER_5MB,
        mimeType: 'image/png',
        hairstyleId: 'hs-korean-wolf-cut'
      };

      const res = await ctx.client.post('/api/try-on', payload5MB);
      expect(res.status).toBe(200);
      expect(res.data.resultImageBase64).toBeDefined();
    },
    { id: 'TC2.8', feature: 'Try-On 5MB Boundary Inclusion' }
  );

  it(
    'TC2.9: 5.1 MB oversized payload (>5MB) rejected with HTTP 413 Payload Too Large',
    async (ctx: TestContext) => {
      const payload5_1MB = {
        imageBuffer: ctx.fixtures.BUFFER_OVERSIZED_5_1MB,
        mimeType: 'image/jpeg',
        hairstyleId: 'hs-korean-wolf-cut'
      };

      const res = await ctx.client.post('/api/try-on', payload5_1MB);
      expect(res.status).toBe(413);
      expect(res.data.error).toContain('vượt quá giới hạn tối đa');
    },
    { id: 'TC2.9', feature: 'Try-On File Size Limit (>5MB)' }
  );

  it(
    'TC2.10: Missing hairstyleId parameter returns HTTP 400 with guidance',
    async (ctx: TestContext) => {
      const missingStylePayload = {
        imageBase64: ctx.fixtures.VALID_IMAGE_BASE64_PNG,
        mimeType: 'image/png'
        // hairstyleId omitted
      };

      const res = await ctx.client.post('/api/try-on', missingStylePayload);
      expect(res.status).toBe(400);
      expect(res.data.error).toContain('chọn kiểu tóc');
    },
    { id: 'TC2.10', feature: 'Try-On Style Parameter Requirement' }
  );

  it(
    'TC2.11: Unsupported MIME types (image/gif, application/pdf) rejected',
    async (ctx: TestContext) => {
      const badMimePayload = {
        imageBase64: ctx.fixtures.VALID_IMAGE_BASE64_PNG,
        mimeType: 'image/gif',
        hairstyleId: 'hs-classic-bob'
      };

      const res = await ctx.client.post('/api/try-on', badMimePayload);
      expect(res.status).toBe(400);
      expect(res.data.error).toContain('Định dạng ảnh không được hỗ trợ');
    },
    { id: 'TC2.11', feature: 'Try-On MIME Type Allowlist' }
  );
});
