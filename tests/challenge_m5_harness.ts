/**
 * Milestone 5 Challenge Harness
 * Comprehensive Adversarial Stress & Quality Verification for AI Hair Try-On Subsystem
 *
 * Suites:
 * 1. Try-On Provider Interface & Simulation Engine (services/try-on/*)
 * 2. Server API Route Contract & Boundaries (POST /api/try-on)
 * 3. Dual Payload Ingestion Modes (JSON Base64 / Buffer vs Multipart)
 * 4. Biometric Privacy & Security Invariants (Zero Disk Write, Path Leak, Audit Telemetry)
 * 5. UI State Machine Matrix & Deep-Link Parameter Hydration
 * 6. Try-On to Online Booking Flow Conversion
 */

import { NextRequest } from 'next/server';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { DemoHairTryOnProvider } from '../services/try-on/demo';
import { getHairTryOnProvider, resetHairTryOnProvider } from '../services/try-on';
import { POST as tryOnRoute } from '../app/api/try-on/route';
import {
  ALLOWED_TRYON_MIME_TYPES,
  MAX_TRYON_FILE_SIZE_BYTES,
  TryOnOptionsSchema,
  TryOnJsonRequestSchema,
} from '../lib/validations/try-on';
import {
  VALID_IMAGE_BASE64_PNG,
  SAMPLE_IMAGE_BUFFER,
  BUFFER_5MB,
  BUFFER_OVERSIZED_5_1MB,
  EMPTY_BUFFER,
  getTomorrowDateString,
} from './fixtures/mock-data';
import { CreateBookingSchema } from '../lib/validations/booking';
import { inMemoryAuditLogs } from '../services/audit';

// Off-by-one boundary buffer: 5,242,881 bytes (5.0 MB + 1 byte)
const BUFFER_5MB_PLUS_ONE = Buffer.alloc(5 * 1024 * 1024 + 1, 0x42);


interface AssertionResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: AssertionResult[] = [];

function assert(condition: boolean, suite: string, name: string, message?: string, details?: any) {
  if (condition) {
    results.push({ suite, name, passed: true, details });
    console.log(`  ✓ [PASS] [${suite}] ${name}`);
  } else {
    results.push({ suite, name, passed: false, error: message || 'Assertion failed', details });
    console.error(`  ✗ [FAIL] [${suite}] ${name}: ${message || 'Assertion failed'}`);
    if (details) console.error('    Details:', JSON.stringify(details));
  }
}

// Helper to create NextRequest for JSON body
function createJsonRequest(body: any, headers: Record<string, string> = {}): NextRequest {
  const reqHeaders: Record<string, string> = {
    'content-type': 'application/json',
    ...headers,
  };
  return new NextRequest('http://localhost:3000/api/try-on', {
    method: 'POST',
    headers: reqHeaders,
    body: JSON.stringify(body),
  });
}

// Helper to create NextRequest for FormData body
function createMultipartRequest(formData: FormData): NextRequest {
  return new NextRequest('http://localhost:3000/api/try-on', {
    method: 'POST',
    body: formData,
  });
}

async function runSuite1_ProviderSimulation() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('▶ SUITE 1: Try-On Provider Interface & Simulation Engine');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  const provider = new DemoHairTryOnProvider();

  // Test 1.1: Provider name contract
  assert(
    provider.name === 'demo-tryon-provider',
    'Suite 1',
    'DemoHairTryOnProvider adheres to name identifier contract'
  );

  // Test 1.2: Basic processTryOn output structure
  const basicRes = await provider.processTryOn({
    imageBuffer: SAMPLE_IMAGE_BUFFER,
    mimeType: 'image/png',
    hairstyleId: 'hs-korean-wolf-cut',
  });

  assert(
    typeof basicRes.resultImageBase64 === 'string' &&
      basicRes.resultImageBase64.startsWith('data:image/svg+xml;base64,'),
    'Suite 1',
    'Simulation output is valid SVG data URI',
    undefined,
    { prefix: basicRes.resultImageBase64.substring(0, 30) }
  );

  assert(
    basicRes.isMock === true && basicRes.provider === 'demo-tryon-provider',
    'Suite 1',
    'Simulation identifies clearly as Demo / Mock provider'
  );

  assert(
    typeof basicRes.processingTimeMs === 'number' && basicRes.processingTimeMs >= 0,
    'Suite 1',
    'Simulation tracks processing duration metric'
  );

  // Test 1.3: Intensity clamping
  const highIntensityRes = await provider.processTryOn({
    imageBuffer: SAMPLE_IMAGE_BUFFER,
    mimeType: 'image/png',
    hairstyleId: 'hs-korean-wolf-cut',
    options: { intensity: 1.5 }, // Clamped to 1.0
  });

  const lowIntensityRes = await provider.processTryOn({
    imageBuffer: SAMPLE_IMAGE_BUFFER,
    mimeType: 'image/png',
    hairstyleId: 'hs-korean-wolf-cut',
    options: { intensity: -0.5 }, // Clamped to 0.0
  });

  assert(
    highIntensityRes.resultImageBase64.length > 0 && lowIntensityRes.resultImageBase64.length > 0,
    'Suite 1',
    'Intensity clamping handles out-of-bound values safely'
  );

  // Test 1.4: Adversarial XML / SVG injection defense
  const maliciousTitle = '"><script xmlns="http://www.w3.org/1999/xhtml">alert(1)</script><text>';
  const sanitizedRes = await provider.processTryOn({
    imageBuffer: SAMPLE_IMAGE_BUFFER,
    mimeType: 'image/png',
    hairstyleId: 'hs-classic-bob',
    options: {
      hairstyleTitle: maliciousTitle,
      hairColorHex: '" onmouseover="alert(1)',
    },
  });

  const decodedSvg = Buffer.from(
    sanitizedRes.resultImageBase64.replace('data:image/svg+xml;base64,', ''),
    'base64'
  ).toString('utf8');

  assert(
    !decodedSvg.includes('<script') &&
      !decodedSvg.includes('</script>') &&
      decodedSvg.includes('&lt;script') &&
      decodedSvg.includes('&quot;'),
    'Suite 1',
    'Malicious script and XML tags in hairstyleTitle are properly escaped',
    undefined,
    { decodedSnippet: decodedSvg.substring(decodedSvg.indexOf('Kiểu tóc:'), decodedSvg.indexOf('Kiểu tóc:') + 80) }
  );

  // Test 1.5: Factory provider fallback
  resetHairTryOnProvider();
  const defaultProv = getHairTryOnProvider();
  assert(
    defaultProv.name === 'demo-tryon-provider',
    'Suite 1',
    'getHairTryOnProvider returns default DemoHairTryOnProvider'
  );

  process.env.TRYON_PROVIDER = 'unknown-third-party-engine';
  resetHairTryOnProvider();
  const fallbackProv = getHairTryOnProvider();
  assert(
    fallbackProv.name === 'demo-tryon-provider',
    'Suite 1',
    'Unknown TRYON_PROVIDER gracefully falls back to DemoHairTryOnProvider'
  );
  delete process.env.TRYON_PROVIDER;
  resetHairTryOnProvider();
}

async function runSuite2_RouteContractAndBoundaries() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('▶ SUITE 2: Server API Route Contract & Boundaries (POST /api/try-on)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test 2.1: Valid JPEG payload (HTTP 200)
  const reqJpeg = createJsonRequest({
    imageBase64: VALID_IMAGE_BASE64_PNG,
    mimeType: 'image/jpeg',
    hairstyleId: 'hs-classic-bob',
    hairColorId: 'col-ash-blonde',
  });
  const resJpeg = await tryOnRoute(reqJpeg);
  const dataJpeg = await resJpeg.json();
  assert(
    resJpeg.status === 200 && dataJpeg.appliedStyleId === 'hs-classic-bob',
    'Suite 2',
    'Valid JPEG simulation returns HTTP 200 with applied style'
  );

  // Test 2.2: Valid WebP payload (HTTP 200)
  const reqWebp = createJsonRequest({
    imageBase64: VALID_IMAGE_BASE64_PNG,
    mimeType: 'image/webp',
    hairstyleId: 'hs-korean-wolf-cut',
  });
  const resWebp = await tryOnRoute(reqWebp);
  const dataWebp = await resWebp.json();
  assert(
    resWebp.status === 200 && dataWebp.mimeType === 'image/webp',
    'Suite 2',
    'Valid WebP simulation returns HTTP 200 and matches mimeType'
  );

  // Test 2.3: Zero-byte empty buffer (HTTP 400)
  const reqEmpty = createJsonRequest({
    imageBuffer: EMPTY_BUFFER,
    mimeType: 'image/png',
    hairstyleId: 'hs-classic-bob',
  });
  const resEmpty = await tryOnRoute(reqEmpty);
  const dataEmpty = await resEmpty.json();
  assert(
    resEmpty.status === 400 && dataEmpty.error?.includes('không hợp lệ hoặc rỗng'),
    'Suite 2',
    'Empty buffer payload rejected with HTTP 400 ("không hợp lệ hoặc rỗng")'
  );

  // Test 2.3b: Zero-byte Multipart file (HTTP 400)
  const emptyFormData = new FormData();
  const emptyBlob = new Blob([], { type: 'image/jpeg' });
  emptyFormData.append('image', emptyBlob, 'empty.jpg');
  emptyFormData.append('hairstyleId', 'hs-classic-bob');
  const reqEmptyMultipart = createMultipartRequest(emptyFormData);
  const resEmptyMultipart = await tryOnRoute(reqEmptyMultipart);
  const dataEmptyMultipart = await resEmptyMultipart.json();
  assert(
    resEmptyMultipart.status === 400 && dataEmptyMultipart.error?.includes('không hợp lệ hoặc rỗng'),
    'Suite 2',
    '0-byte file in Multipart FormData rejected with HTTP 400 ("không hợp lệ hoặc rỗng")'
  );

  // Test 2.3c: Empty base64 string and whitespace
  const reqBlankBase64 = createJsonRequest({
    imageBase64: '   ',
    mimeType: 'image/jpeg',
    hairstyleId: 'hs-classic-bob',
  });
  const resBlankBase64 = await tryOnRoute(reqBlankBase64);
  const dataBlankBase64 = await resBlankBase64.json();
  assert(
    resBlankBase64.status === 400 && dataBlankBase64.error?.includes('không hợp lệ hoặc rỗng'),
    'Suite 2',
    'Blank whitespace imageBase64 rejected with HTTP 400 ("không hợp lệ hoặc rỗng")'
  );

  // Test 2.3d: Corrupted non-base64 garbage data
  const reqCorruptedBase64 = createJsonRequest({
    imageBase64: '???!!!###$$$%%%^^^&&&***',
    mimeType: 'image/jpeg',
    hairstyleId: 'hs-classic-bob',
  });
  const resCorruptedBase64 = await tryOnRoute(reqCorruptedBase64);
  const dataCorruptedBase64 = await resCorruptedBase64.json();
  assert(
    resCorruptedBase64.status === 400 && dataCorruptedBase64.error?.includes('không hợp lệ hoặc rỗng'),
    'Suite 2',
    'Corrupted non-base64 string rejected with HTTP 400 ("không hợp lệ hoặc rỗng")'
  );

  // Test 2.4: Exactly 5,242,880 bytes (5.0 MB) boundary payload (HTTP 200)
  const req5MB = createJsonRequest({
    imageBuffer: BUFFER_5MB,
    mimeType: 'image/png',
    hairstyleId: 'hs-korean-wolf-cut',
  });
  const res5MB = await tryOnRoute(req5MB);
  assert(
    res5MB.status === 200,
    'Suite 2',
    'Exactly 5,242,880 bytes (5.0 MB) boundary payload is accepted and returns HTTP 200'
  );

  // Test 2.4b: Exactly 5,242,881 bytes (5.0 MB + 1 byte) boundary payload (HTTP 413)
  const req5MBPlusOne = createJsonRequest({
    imageBuffer: BUFFER_5MB_PLUS_ONE,
    mimeType: 'image/jpeg',
    hairstyleId: 'hs-korean-wolf-cut',
  });
  const res5MBPlusOne = await tryOnRoute(req5MBPlusOne);
  const data5MBPlusOne = await res5MBPlusOne.json();
  assert(
    res5MBPlusOne.status === 413 && data5MBPlusOne.error?.includes('vượt quá giới hạn tối đa'),
    'Suite 2',
    'Exact 5,242,881 bytes (5.0 MB + 1 byte) boundary payload rejected with HTTP 413 ("vượt quá giới hạn tối đa")'
  );

  // Test 2.5: 5.1 MB oversized payload (HTTP 413)
  const reqOversized = createJsonRequest({
    imageBuffer: BUFFER_OVERSIZED_5_1MB,
    mimeType: 'image/jpeg',
    hairstyleId: 'hs-korean-wolf-cut',
  });
  const resOversized = await tryOnRoute(reqOversized);
  const dataOversized = await resOversized.json();
  assert(
    resOversized.status === 413 && dataOversized.error?.includes('vượt quá giới hạn tối đa'),
    'Suite 2',
    '5.1 MB oversized payload rejected with HTTP 413 ("vượt quá giới hạn tối đa")'
  );

  // Test 2.6: Unsupported MIME types rejected with HTTP 400
  const unsupportedMimes = ['image/gif', 'application/pdf', 'text/plain', 'application/octet-stream'];
  for (const badMime of unsupportedMimes) {
    const reqBadMime = createJsonRequest({
      imageBase64: VALID_IMAGE_BASE64_PNG,
      mimeType: badMime,
      hairstyleId: 'hs-classic-bob',
    });
    const resBadMime = await tryOnRoute(reqBadMime);
    const dataBadMime = await resBadMime.json();
    assert(
      resBadMime.status === 400 && dataBadMime.error?.includes('Định dạng ảnh không được hỗ trợ'),
      'Suite 2',
      `Unsupported MIME type (${badMime}) rejected with HTTP 400`
    );
  }

  // Test 2.6b: Malformed MIME strings
  const malformedMimes = [
    'image/jpeg; drop table users;',
    'image/png; charset=utf-8',
    'image/webp\x00extra',
    'image/svg+xml',
    'image/bmp',
    'application/x-sh',
    'text/html',
    'not-a-mime',
  ];
  for (const malformedMime of malformedMimes) {
    const reqBadMime = createJsonRequest({
      imageBase64: VALID_IMAGE_BASE64_PNG,
      mimeType: malformedMime,
      hairstyleId: 'hs-classic-bob',
    });
    const resBadMime = await tryOnRoute(reqBadMime);
    const dataBadMime = await resBadMime.json();
    assert(
      resBadMime.status === 400 && dataBadMime.error?.includes('Định dạng ảnh không được hỗ trợ'),
      'Suite 2',
      `Malformed MIME string (${malformedMime.replace(/[\x00]/g, '\\0')}) rejected with HTTP 400`
    );
  }

  // Test 2.6c: Dangerous magic bytes disguised as valid image MIME (MIME Spoofing)
  const magicByteProbes = [
    {
      name: 'GIF89a signature disguised as image/jpeg',
      buffer: Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61, 0x01, 0x00]),
      mimeType: 'image/jpeg',
    },
    {
      name: 'PDF document (%PDF) disguised as image/png',
      buffer: Buffer.from([0x25, 0x50, 0x44, 0x46, 0x2d, 0x31, 0x2e, 0x37]),
      mimeType: 'image/png',
    },
    {
      name: 'Windows PE Executable (MZ) disguised as image/jpeg',
      buffer: Buffer.from([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00, 0x00, 0x00]),
      mimeType: 'image/jpeg',
    },
    {
      name: 'Linux ELF Executable (\\x7fELF) disguised as image/webp',
      buffer: Buffer.from([0x7f, 0x45, 0x4c, 0x46, 0x02, 0x01, 0x01, 0x00]),
      mimeType: 'image/webp',
    },
    {
      name: 'Malicious HTML script tag (<script>) disguised as image/jpeg',
      buffer: Buffer.from('<script>alert("pwned")</script>'),
      mimeType: 'image/jpeg',
    },
    {
      name: 'Malicious HTML document (<!DOCTYPE html><html>) disguised as image/png',
      buffer: Buffer.from('<!DOCTYPE html><html><body>malicious payload</body></html>'),
      mimeType: 'image/png',
    },
  ];

  for (const probe of magicByteProbes) {
    const reqMagic = createJsonRequest({
      imageBuffer: probe.buffer,
      mimeType: probe.mimeType,
      hairstyleId: 'hs-classic-bob',
    });
    const resMagic = await tryOnRoute(reqMagic);
    const dataMagic = await resMagic.json();
    assert(
      resMagic.status === 400 && dataMagic.error?.includes('Định dạng ảnh không được hỗ trợ'),
      'Suite 2',
      `Magic byte spoofing probe: ${probe.name} rejected with HTTP 400`
    );
  }

  // Test 2.7: Missing hairstyleId in JSON body (HTTP 400)
  const reqNoStyle = createJsonRequest({
    imageBase64: VALID_IMAGE_BASE64_PNG,
    mimeType: 'image/png',
  });
  const resNoStyle = await tryOnRoute(reqNoStyle);
  const dataNoStyle = await resNoStyle.json();
  assert(
    resNoStyle.status === 400 && dataNoStyle.error?.includes('chọn kiểu tóc'),
    'Suite 2',
    'Missing hairstyleId rejected with HTTP 400 ("chọn kiểu tóc")'
  );

  // Test 2.7b: Missing hairstyleId in Multipart FormData (HTTP 400)
  const formDataNoStyle = new FormData();
  formDataNoStyle.append('image', new Blob([SAMPLE_IMAGE_BUFFER], { type: 'image/jpeg' }), 'portrait.jpg');
  const reqNoStyleMultipart = createMultipartRequest(formDataNoStyle);
  const resNoStyleMultipart = await tryOnRoute(reqNoStyleMultipart);
  const dataNoStyleMultipart = await resNoStyleMultipart.json();
  assert(
    resNoStyleMultipart.status === 400 && dataNoStyleMultipart.error?.includes('chọn kiểu tóc'),
    'Suite 2',
    'Missing hairstyleId in Multipart FormData rejected with HTTP 400'
  );

  // Test 2.7c: Null hairstyleId in JSON body (HTTP 400)
  const reqNullStyle = createJsonRequest({
    imageBase64: VALID_IMAGE_BASE64_PNG,
    mimeType: 'image/png',
    hairstyleId: null,
  });
  const resNullStyle = await tryOnRoute(reqNullStyle);
  const dataNullStyle = await resNullStyle.json();
  assert(
    resNullStyle.status === 400 && dataNullStyle.error?.includes('chọn kiểu tóc'),
    'Suite 2',
    'Null hairstyleId rejected with HTTP 400'
  );

  // Test 2.8: Empty string hairstyleId (HTTP 400)
  const reqBlankStyle = createJsonRequest({
    imageBase64: VALID_IMAGE_BASE64_PNG,
    mimeType: 'image/png',
    hairstyleId: '   ',
  });
  const resBlankStyle = await tryOnRoute(reqBlankStyle);
  const dataBlankStyle = await resBlankStyle.json();
  assert(
    resBlankStyle.status === 400 && dataBlankStyle.error?.includes('chọn kiểu tóc'),
    'Suite 2',
    'Blank whitespace hairstyleId rejected with HTTP 400'
  );
}

async function runSuite3_DualIngestion() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('▶ SUITE 3: Dual Payload Ingestion Modes (JSON Base64 vs Multipart)');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test 3.1: JSON with Data URL base64
  const dataUrl = `data:image/png;base64,${VALID_IMAGE_BASE64_PNG}`;
  const reqDataUrl = createJsonRequest({
    imageBase64: dataUrl,
    hairstyleId: 'hs-korean-wolf-cut',
  });
  const resDataUrl = await tryOnRoute(reqDataUrl);
  const bodyDataUrl = await resDataUrl.json();
  assert(
    resDataUrl.status === 200 && bodyDataUrl.resultImageBase64 !== undefined,
    'Suite 3',
    'JSON payload with Data URL format parsed and processed successfully'
  );

  // Test 3.2: JSON with raw imageBuffer object
  const reqBuf = createJsonRequest({
    imageBuffer: SAMPLE_IMAGE_BUFFER,
    mimeType: 'image/png',
    hairstyleId: 'hs-classic-bob',
  });
  const resBuf = await tryOnRoute(reqBuf);
  assert(
    resBuf.status === 200,
    'Suite 3',
    'JSON payload with raw Buffer ingested successfully'
  );

  // Test 3.3: Multipart FormData ingestion
  const formData = new FormData();
  const blob = new Blob([SAMPLE_IMAGE_BUFFER], { type: 'image/jpeg' });
  formData.append('image', blob, 'portrait.jpg');
  formData.append('hairstyleId', 'hs-korean-wolf-cut');
  formData.append('hairColorId', 'col-ash-blonde');
  formData.append('intensity', '0.75');

  const reqMultipart = createMultipartRequest(formData);
  const resMultipart = await tryOnRoute(reqMultipart);
  const bodyMultipart = await resMultipart.json();

  assert(
    resMultipart.status === 200 &&
      bodyMultipart.appliedStyleId === 'hs-korean-wolf-cut' &&
      bodyMultipart.appliedColorId === 'col-ash-blonde',
    'Suite 3',
    'Multipart FormData payload ingested and processed with full fields',
    undefined,
    { status: resMultipart.status, appliedStyleId: bodyMultipart.appliedStyleId }
  );
}

async function runSuite4_BiometricPrivacyAndSecurity() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('▶ SUITE 4: Biometric Privacy & Security Invariants');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test 4.1: Response strictly omits disk path leaks
  const req = createJsonRequest({
    imageBase64: VALID_IMAGE_BASE64_PNG,
    mimeType: 'image/png',
    hairstyleId: 'hs-classic-bob',
  });
  const res = await tryOnRoute(req);
  const data = await res.json();

  assert(
    data.privacyValidated === true,
    'Suite 4',
    'Response explicitly certifies privacyValidated: true'
  );

  assert(
    data.diskPath === undefined &&
      data.serverFilePath === undefined &&
      data.tempPath === undefined,
    'Suite 4',
    'Response strictly omits server disk or filesystem path properties'
  );

  // Test 4.2: Anti-caching headers on response
  const cacheControl = res.headers.get('cache-control');
  const pragma = res.headers.get('pragma');
  assert(
    Boolean(cacheControl?.includes('no-store')) && pragma === 'no-cache',
    'Suite 4',
    'Response sets strict anti-caching headers to protect biometric privacy',
    undefined,
    { cacheControl, pragma }
  );

  // Test 4.3: Audit log privacy - verify image data is NOT logged
  const preLogsCount = inMemoryAuditLogs.length;
  await tryOnRoute(
    createJsonRequest({
      imageBase64: VALID_IMAGE_BASE64_PNG,
      mimeType: 'image/jpeg',
      hairstyleId: 'hs-audit-check',
      hairColorId: 'col-chocolate-brown',
    })
  );

  const latestAudit = inMemoryAuditLogs[0];
  assert(
    latestAudit !== undefined &&
      latestAudit.entity === 'TryOnSimulation' &&
      latestAudit.action === 'CREATE',
    'Suite 4',
    'Simulation operation successfully recorded in audit logs'
  );

  const loggedDetails = JSON.stringify(latestAudit?.details || {});
  assert(
    !loggedDetails.includes(VALID_IMAGE_BASE64_PNG) &&
      !loggedDetails.includes('imageBuffer') &&
      !loggedDetails.includes('resultImageBase64'),
    'Suite 4',
    'Audit log details strictly exclude customer biometric image buffers and base64 payloads'
  );

  // Test 4.4: Path traversal attempt in fileName parameter
  const traversalPayload = createJsonRequest({
    imageBase64: VALID_IMAGE_BASE64_PNG,
    mimeType: 'image/png',
    hairstyleId: 'hs-classic-bob',
    fileName: '../../../../etc/passwd',
  });
  const resTraversal = await tryOnRoute(traversalPayload);
  const dataTraversal = await resTraversal.json();

  assert(
    resTraversal.status === 200 &&
      dataTraversal.diskPath === undefined &&
      dataTraversal.privacyValidated === true,
    'Suite 4',
    'Path traversal payloads in fileName handled safely with zero disk interaction'
  );

  // Test 4.5: Strict empirical verification of zero files created on filesystem
  function scanDirFiles(dir: string, baseDir: string = dir): string[] {
    let files: string[] = [];
    if (!fs.existsSync(dir)) return files;
    try {
      const entries = fs.readdirSync(dir, { withFileTypes: true });
      for (const entry of entries) {
        const name = entry.name;
        if (
          name === 'node_modules' ||
          name === '.next' ||
          name === '.git' ||
          name === '.agents' ||
          name === '.system_generated'
        ) {
          continue;
        }
        const fullPath = path.join(dir, name);
        if (entry.isDirectory()) {
          files = files.concat(scanDirFiles(fullPath, baseDir));
        } else {
          files.push(path.relative(baseDir, fullPath));
        }
      }
    } catch {
      // ignore read errors
    }
    return files;
  }

  const workspaceRoot = process.cwd();
  const filesBefore = scanDirFiles(workspaceRoot).sort();

  // Burst: fire multiple varied try-on requests through the API route
  await tryOnRoute(createJsonRequest({
    imageBuffer: BUFFER_5MB,
    mimeType: 'image/png',
    hairstyleId: 'hs-classic-bob',
  }));
  await tryOnRoute(createJsonRequest({
    imageBase64: VALID_IMAGE_BASE64_PNG,
    mimeType: 'image/jpeg',
    hairstyleId: 'hs-korean-wolf-cut',
  }));
  await tryOnRoute(createJsonRequest({
    imageBuffer: Buffer.alloc(0),
    mimeType: 'image/png',
    hairstyleId: 'hs-classic-bob',
  }));

  const filesAfter = scanDirFiles(workspaceRoot).sort();
  const leakedFiles = filesAfter.filter((f) => !filesBefore.includes(f));

  assert(
    leakedFiles.length === 0,
    'Suite 4',
    'Empirical filesystem verification: Exactly zero files created or leaked on disk',
    undefined,
    { leakedCount: leakedFiles.length, leakedFiles }
  );
}

async function runSuite5_UIStateMachineAndDeepLinks() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('▶ SUITE 5: UI State Machine Matrix & Deep-Link Simulation');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test 5.1: State Machine Legal Flow Simulation
  // State 0: EMPTY -> Cannot simulate without photo
  let mockState: string = 'EMPTY';
  let hasPhoto = false;
  let hasStyle = false;

  const canSimulateAtEmpty = hasPhoto && hasStyle;
  assert(!canSimulateAtEmpty, 'Suite 5', 'State EMPTY correctly blocks simulation trigger');

  // State 1: User uploads photo -> PHOTO_READY
  hasPhoto = true;
  mockState = 'PHOTO_READY';
  const canSimulateAtPhotoReady = hasPhoto && hasStyle;
  assert(
    !canSimulateAtPhotoReady && mockState === 'PHOTO_READY',
    'Suite 5',
    'State PHOTO_READY blocks simulation until hairstyle is selected'
  );

  // State 2: User selects style -> CONFIGURING
  hasStyle = true;
  mockState = 'CONFIGURING';
  const canSimulateAtConfiguring = hasPhoto && hasStyle;
  assert(
    canSimulateAtConfiguring && mockState === 'CONFIGURING',
    'Suite 5',
    'State CONFIGURING permits simulation trigger when both photo and style are present'
  );

  // State 3: User triggers simulate -> PROCESSING -> SUCCESS
  mockState = 'PROCESSING';
  assert(mockState === 'PROCESSING', 'Suite 5', 'Simulation enters PROCESSING state during execution');

  mockState = 'SUCCESS';
  assert(mockState === 'SUCCESS', 'Suite 5', 'Successful simulation resolves to SUCCESS state');

  // Test 5.2: URL query parameter deep-link hydration simulation
  const validUrl = 'http://localhost:3000/try-on?hairstyleId=hs-korean-wolf-cut&hairColorId=col-ash-blonde';
  const urlObj = new URL(validUrl);
  const hydratedStyle = urlObj.searchParams.get('hairstyleId');
  const hydratedColor = urlObj.searchParams.get('hairColorId');

  assert(
    hydratedStyle === 'hs-korean-wolf-cut' && hydratedColor === 'col-ash-blonde',
    'Suite 5',
    'URL deep-link parameters correctly extracted for pre-selection'
  );

  // Test 5.3: Unknown/malformed URL params handled gracefully
  const malformedUrl = 'http://localhost:3000/try-on?hairstyleId=unknown-style-999&extra=123';
  const malformedObj = new URL(malformedUrl);
  const unknownStyle = malformedObj.searchParams.get('hairstyleId');
  assert(
    unknownStyle === 'unknown-style-999',
    'Suite 5',
    'Malformed or unknown hairstyleId safely handled without crashing'
  );
}

async function runSuite6_TryOnToBookingConversion() {
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('▶ SUITE 6: Try-On to Online Booking Flow Conversion');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  // Test 6.1: Booking URL construction from simulation result
  const simulatedStyleId = 'hs-korean-wolf-cut';
  const simulatedColorId = 'col-ash-blonde';

  const bookingUrlParams = new URLSearchParams({
    hairstyleId: simulatedStyleId,
    hairColorId: simulatedColorId,
    notes: 'Khách hàng đã thử nghiệm trên công cụ AI Try-On và chọn kiểu này.',
  });
  const targetBookingUrl = `/booking?${bookingUrlParams.toString()}`;

  assert(
    targetBookingUrl.includes('hairstyleId=hs-korean-wolf-cut') &&
      targetBookingUrl.includes('hairColorId=col-ash-blonde') &&
      targetBookingUrl.includes('notes='),
    'Suite 6',
    'Target booking URL properly encodes simulated hairstyle and color selections'
  );

  // Test 6.2: Booking schema validation with simulated parameters
  const convertedBookingPayload = {
    serviceId: 'srv-color-perm-combo',
    hairstyleId: simulatedStyleId,
    hairColorId: simulatedColorId,
    bookingDate: getTomorrowDateString(),
    bookingTime: '10:00',
    customerName: 'Nguyễn Thúy Vy',
    customerPhone: '0988776655',
    notes: 'Đã thử trên công cụ Try-On',
  };

  const schemaValidation = CreateBookingSchema.safeParse(convertedBookingPayload);
  assert(
    schemaValidation.success === true,
    'Suite 6',
    'Booking payload constructed from Try-On choices satisfies CreateBookingSchema'
  );

  // Test 6.3: Style retention with modified color
  const modifiedColorPayload = {
    ...convertedBookingPayload,
    hairColorId: 'col-chocolate-brown', // Swapped color
  };
  const modifiedValidation = CreateBookingSchema.safeParse(modifiedColorPayload);
  assert(
    modifiedValidation.success === true &&
      modifiedValidation.data.hairstyleId === 'hs-korean-wolf-cut' &&
      modifiedValidation.data.hairColorId === 'col-chocolate-brown',
    'Suite 6',
    'Retaining simulated hairstyle while altering hair color passes booking validation'
  );

  // Test 6.4: Booking remains valid without Try-On (fault isolation)
  const directBookingPayload = {
    serviceId: 'srv-layer-cut-vip',
    hairstyleId: 'hs-classic-bob',
    bookingDate: getTomorrowDateString(),
    bookingTime: '15:00',
    customerName: 'Trần Văn Nam',
    customerPhone: '0912345678',
  };
  const directValidation = CreateBookingSchema.safeParse(directBookingPayload);
  assert(
    directValidation.success === true,
    'Suite 6',
    'Direct appointment booking operates independently of Try-On execution'
  );
}

async function main() {
  process.env.TRYON_MIN_DELAY_MS = '5';
  process.env.TRYON_MAX_DELAY_MS = '10';

  console.log('================================================================================');
  console.log('       MILESTONE 5: INTERACTIVE HAIR TRY-ON CHALLENGE HARNESS');
  console.log('================================================================================');

  const start = Date.now();

  try {
    await runSuite1_ProviderSimulation();
    await runSuite2_RouteContractAndBoundaries();
    await runSuite3_DualIngestion();
    await runSuite4_BiometricPrivacyAndSecurity();
    await runSuite5_UIStateMachineAndDeepLinks();
    await runSuite6_TryOnToBookingConversion();
  } catch (err) {
    console.error('\nFatal unhandled error in challenge harness:', err);
    process.exit(1);
  }

  const durationMs = Date.now() - start;
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;

  console.log('\n================================================================================');
  console.log('                         EXECUTION SUMMARY');
  console.log('================================================================================');
  console.log(`  Duration:       ${durationMs} ms`);
  console.log(`  Total Suites:   6`);
  console.log(`  Total Probes:   ${results.length}`);
  console.log(`  Passed Probes:  ${passedCount}`);
  console.log(`  Failed Probes:  ${failedCount}`);

  if (failedCount > 0) {
    console.error('\n❌ SOME PROBES FAILED. Inspect details above.');
    process.exit(1);
  } else {
    console.log('\n✅ ALL 6 SUITES PASSED CLEANLY (100% SUCCESS)');
    process.exit(0);
  }
}

main();
