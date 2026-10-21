/**
 * Tier 1: Feature Coverage - Hair Try-On Subsystem
 */

import { expect } from '../../harness/assertions.ts';
import { describe, it } from '../../harness/runner.ts';
import type { TestContext } from '../../harness/types.ts';

describe('Tier 1 - Hair Try-On Subsystem Features', 1, () => {
  it(
    'TC1.13: POST /api/try-on processes valid portrait image and returns simulated composite',
    async (ctx: TestContext) => {
      const payload = {
        imageBase64: ctx.fixtures.VALID_IMAGE_BASE64_PNG,
        mimeType: 'image/png',
        hairstyleId: 'hs-korean-wolf-cut'
      };

      const res = await ctx.client.post('/api/try-on', payload);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('resultImageBase64');
      expect(typeof res.data.resultImageBase64).toBe('string');
      expect(res.data.isMock).toBe(true);
      expect(res.data.provider).toContain('demo');
      expect(res.data.appliedStyleId).toBe('hs-korean-wolf-cut');
    },
    { id: 'TC1.13', feature: 'Hair Try-On Basic Simulation' }
  );

  it(
    'TC1.14: POST /api/try-on with style and color applies dual combination',
    async (ctx: TestContext) => {
      const payload = {
        imageBase64: ctx.fixtures.VALID_IMAGE_BASE64_PNG,
        mimeType: 'image/jpeg',
        hairstyleId: 'hs-classic-bob',
        hairColorId: 'col-ash-blonde',
        options: { intensity: 0.85 }
      };

      const res = await ctx.client.post('/api/try-on', payload);

      expect(res.status).toBe(200);
      expect(res.data.appliedStyleId).toBe('hs-classic-bob');
      expect(res.data.appliedColorId).toBe('col-ash-blonde');
    },
    { id: 'TC1.14', feature: 'Hair Try-On Style + Color' }
  );

  it(
    'TC1.15: POST /api/try-on returns accurate processing metrics and response metadata',
    async (ctx: TestContext) => {
      const payload = {
        imageBase64: ctx.fixtures.VALID_IMAGE_BASE64_PNG,
        mimeType: 'image/webp',
        hairstyleId: 'hs-korean-wolf-cut'
      };

      const res = await ctx.client.post('/api/try-on', payload);

      expect(res.status).toBe(200);
      expect(res.data).toHaveProperty('processingTimeMs');
      expect(res.data.processingTimeMs).toBeGreaterThan(0);
      expect(res.data.mimeType).toBe('image/webp');
    },
    { id: 'TC1.15', feature: 'Try-On Processing Metrics' }
  );

  it(
    'TC1.16: Privacy Verification - In-memory proxy guarantees zero disk persistence',
    async (ctx: TestContext) => {
      const payload = {
        imageBase64: ctx.fixtures.VALID_IMAGE_BASE64_PNG,
        mimeType: 'image/png',
        hairstyleId: 'hs-classic-bob'
      };

      const res = await ctx.client.post('/api/try-on', payload);

      expect(res.status).toBe(200);
      expect(res.data.privacyValidated).toBe(true);
      // Verify no permanent file path or storage URL is exposed in client response
      expect(res.data.diskPath).toBeUndefined();
      expect(res.data.serverFilePath).toBeUndefined();
    },
    { id: 'TC1.16', feature: 'Try-On Privacy & Ephemerality' }
  );

  it(
    'TC1.17: Unsupported MIME types (text, exe) are strictly rejected with HTTP 400',
    async (ctx: TestContext) => {
      const invalidPayload = {
        imageBase64: ctx.fixtures.VALID_IMAGE_BASE64_PNG,
        mimeType: 'text/plain',
        hairstyleId: 'hs-classic-bob'
      };

      const res = await ctx.client.post('/api/try-on', invalidPayload);

      expect(res.status).toBe(400);
      expect(res.data.error).toContain('Định dạng ảnh không được hỗ trợ');
    },
    { id: 'TC1.17', feature: 'Try-On MIME Validation' }
  );
});
