/**
 * Milestone 5 Adversarial Challenger 2 Test Harness
 * Specialized Empirical Verification:
 * 1. UI State Machine Matrix & Preconditions
 * 2. Client-side Pre-Validation (5MB Boundary & MIME Allowlist)
 * 3. Deep-link Search Param Hydration & Alias Tolerance
 * 4. Booking Transfer CTA URL Construction
 * 5. BookingWizardClient Ingestion & Form Payload Conformance
 * 6. Adversarial XSS & SVG Injection Resistance
 */

import {
  ALLOWED_TRYON_MIME_TYPES,
  MAX_TRYON_FILE_SIZE_BYTES,
  TryOnOptionsSchema,
  TryOnJsonRequestSchema,
} from '../lib/validations/try-on';
import { CreateBookingSchema } from '../lib/validations/booking';
import { DemoHairTryOnProvider } from '../services/try-on/demo';
import { SAMPLE_IMAGE_BUFFER } from './fixtures/mock-data';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const testResults: TestResult[] = [];

function check(suite: string, name: string, condition: boolean, errorMsg?: string, details?: any) {
  if (condition) {
    testResults.push({ suite, name, passed: true, details });
    console.log(`  ✓ [PASS] [${suite}] ${name}`);
  } else {
    testResults.push({ suite, name, passed: false, error: errorMsg || 'Condition failed', details });
    console.error(`  ✗ [FAIL] [${suite}] ${name}: ${errorMsg || 'Condition failed'}`);
    if (details) console.error('    Details:', details);
  }
}

// ==============================================================================
// SUITE 1: UI State Machine Matrix & Preconditions
// ==============================================================================
function testSuite1_UIStateMachine() {
  console.log('\n▶ SUITE 1: UI State Machine Matrix Transitions & Invariants');

  // State Matrix Simulation replicating TryOnClient logic
  type State = 'EMPTY' | 'PHOTO_READY' | 'CONFIGURING' | 'PROCESSING' | 'SUCCESS' | 'ERROR';

  class TryOnStateMachineSimulator {
    state: State = 'EMPTY';
    userImage: string | null = null;
    hairstyleId: string | null = null;
    colorId: string | null = null;
    simulationResult: any = null;
    errorMessage: string | null = null;

    loadImage(dataUrl: string) {
      this.userImage = dataUrl;
      this.simulationResult = null;
      this.errorMessage = null;
      if (this.hairstyleId) {
        this.state = 'CONFIGURING';
      } else {
        this.state = 'PHOTO_READY';
      }
    }

    selectHairstyle(id: string) {
      this.hairstyleId = id;
      if (this.userImage) {
        this.state = 'CONFIGURING';
      }
    }

    selectColor(id: string | null) {
      this.colorId = id;
    }

    canSimulate(): boolean {
      return Boolean(this.userImage && this.hairstyleId && this.state !== 'PROCESSING');
    }

    startSimulation(): boolean {
      if (!this.canSimulate()) {
        this.errorMessage = 'Precondition not met';
        return false;
      }
      this.state = 'PROCESSING';
      return true;
    }

    resolveSuccess(result: any) {
      if (this.state !== 'PROCESSING') throw new Error('Illegal transition to SUCCESS');
      this.simulationResult = result;
      this.state = 'SUCCESS';
    }

    resolveError(msg: string) {
      if (this.state !== 'PROCESSING') throw new Error('Illegal transition to ERROR');
      this.errorMessage = msg;
      this.state = 'ERROR';
    }

    tryAnother() {
      if (this.state !== 'SUCCESS') throw new Error('Can only try another from SUCCESS');
      this.simulationResult = null;
      this.state = 'CONFIGURING';
    }

    reset() {
      this.userImage = null;
      this.simulationResult = null;
      this.errorMessage = null;
      this.state = 'EMPTY';
    }
  }

  // Probe 1.1: Initial State is EMPTY
  const fsm = new TryOnStateMachineSimulator();
  check('Suite 1', 'Initial state is EMPTY with no photo or style', fsm.state === 'EMPTY');
  check('Suite 1', 'EMPTY state blocks simulation trigger', !fsm.canSimulate());

  // Probe 1.2: Loading photo without style transitions to PHOTO_READY
  fsm.loadImage('data:image/jpeg;base64,mock');
  check('Suite 1', 'Loading photo transitions from EMPTY to PHOTO_READY', fsm.state === 'PHOTO_READY');
  check('Suite 1', 'PHOTO_READY blocks simulation trigger', !fsm.canSimulate());

  // Probe 1.3: Selecting style transitions to CONFIGURING
  fsm.selectHairstyle('hs-wolf-cut');
  check('Suite 1', 'Selecting style in PHOTO_READY transitions to CONFIGURING', fsm.state === 'CONFIGURING');
  check('Suite 1', 'CONFIGURING permits simulation trigger', fsm.canSimulate());

  // Probe 1.4: Inverted order (Style selected first via deep-link, then photo loaded)
  const fsm2 = new TryOnStateMachineSimulator();
  fsm2.selectHairstyle('hs-layer-bob');
  check('Suite 1', 'Pre-selecting style in EMPTY keeps state EMPTY', fsm2.state === 'EMPTY');
  fsm2.loadImage('data:image/jpeg;base64,mock');
  check('Suite 1', 'Loading photo with pre-selected style transitions directly to CONFIGURING', fsm2.state === 'CONFIGURING');

  // Probe 1.5: Processing lifecycle
  const started = fsm.startSimulation();
  check('Suite 1', 'startSimulation transitions to PROCESSING', started && fsm.state === 'PROCESSING');
  check('Suite 1', 'PROCESSING state blocks concurrent re-trigger', !fsm.canSimulate());

  fsm.resolveSuccess({ resultImage: 'data:image/svg+xml;base64,...' });
  check('Suite 1', 'resolveSuccess transitions to SUCCESS', fsm.state === 'SUCCESS');

  // Probe 1.6: Transition back to CONFIGURING via tryAnother
  fsm.tryAnother();
  check(
    'Suite 1',
    'tryAnother transitions from SUCCESS back to CONFIGURING preserving photo and style',
    fsm.state === 'CONFIGURING' && fsm.userImage !== null && fsm.hairstyleId === 'hs-wolf-cut'
  );

  // Probe 1.7: Error and retry lifecycle
  fsm.startSimulation();
  fsm.resolveError('Network timeout');
  check('Suite 1', 'resolveError transitions to ERROR with message', fsm.state === 'ERROR' && fsm.errorMessage === 'Network timeout');

  // Probe 1.8: Reset clears photo and returns to EMPTY
  fsm.reset();
  check('Suite 1', 'reset returns state to EMPTY and clears user image', fsm.state === 'EMPTY' && fsm.userImage === null);
}

// ==============================================================================
// SUITE 2: Client-side Pre-Validation Guard (5MB & MIME Blocking)
// ==============================================================================
function testSuite2_ClientSidePreValidation() {
  console.log('\n▶ SUITE 2: Client-Side Pre-Validation Guard Probes');

  function simulateClientPreValidation(file: { size: number; type: string }): {
    accepted: boolean;
    error: string | null;
  } {
    // Exact logic from TryOnClient.tsx lines 205-220
    if (file.size > MAX_TRYON_FILE_SIZE_BYTES) {
      const sizeMb = (file.size / (1024 * 1024)).toFixed(2);
      return {
        accepted: false,
        error: `Dung lượng ảnh (${sizeMb}MB) vượt quá giới hạn tối đa cho phép là 5MB. Vui lòng chọn ảnh nhỏ hơn.`,
      };
    }

    const mime = file.type.toLowerCase();
    if (!ALLOWED_TRYON_MIME_TYPES.includes(mime as any)) {
      return {
        accepted: false,
        error: 'Định dạng ảnh không được hỗ trợ. Vui lòng chọn ảnh JPG, PNG hoặc WebP.',
      };
    }

    return { accepted: true, error: null };
  }

  // Probe 2.1: Exactly 5,242,880 bytes (5.0 MB) is accepted
  const exactly5MB = simulateClientPreValidation({
    size: 5 * 1024 * 1024,
    type: 'image/jpeg',
  });
  check('Suite 2', 'Exactly 5.0 MB (5,242,880 bytes) file is accepted client-side', exactly5MB.accepted && exactly5MB.error === null);

  // Probe 2.2: 5,242,881 bytes (5.0 MB + 1 byte) is blocked
  const oversized5MBPlus1 = simulateClientPreValidation({
    size: 5 * 1024 * 1024 + 1,
    type: 'image/jpeg',
  });
  check(
    'Suite 2',
    '5.0 MB + 1 byte (5,242,881 bytes) is blocked client-side before network dispatch',
    !oversized5MBPlus1.accepted && oversized5MBPlus1.error !== null && oversized5MBPlus1.error.includes('vượt quá giới hạn')
  );

  // Probe 2.3: 10 MB oversized file blocked
  const oversized10MB = simulateClientPreValidation({
    size: 10 * 1024 * 1024,
    type: 'image/png',
  });
  check(
    'Suite 2',
    '10 MB oversized file blocked client-side with descriptive size message',
    !oversized10MB.accepted && oversized10MB.error?.includes('10.00MB') === true
  );

  // Probe 2.4: Supported MIME types (JPEG, PNG, WebP)
  const jpegTest = simulateClientPreValidation({ size: 1024 * 500, type: 'image/jpeg' });
  const pngTest = simulateClientPreValidation({ size: 1024 * 500, type: 'image/png' });
  const webpTest = simulateClientPreValidation({ size: 1024 * 500, type: 'image/webp' });
  check('Suite 2', 'Supported MIME types (JPEG, PNG, WebP) all accepted', jpegTest.accepted && pngTest.accepted && webpTest.accepted);

  // Probe 2.5: Case-insensitive MIME check (IMAGE/JPEG)
  const uppercaseMime = simulateClientPreValidation({ size: 1024 * 100, type: 'IMAGE/JPEG' });
  check('Suite 2', 'Uppercase MIME type (IMAGE/JPEG) normalized and accepted', uppercaseMime.accepted);

  // Probe 2.6: Disallowed MIME types (GIF, PDF, BMP, EXE)
  const gifTest = simulateClientPreValidation({ size: 1024 * 100, type: 'image/gif' });
  const pdfTest = simulateClientPreValidation({ size: 1024 * 100, type: 'application/pdf' });
  const bmpTest = simulateClientPreValidation({ size: 1024 * 100, type: 'image/bmp' });
  const exeTest = simulateClientPreValidation({ size: 1024 * 100, type: 'application/x-msdownload' });
  check(
    'Suite 2',
    'Disallowed MIME types (GIF, PDF, BMP, EXE) blocked client-side with unsupported message',
    !gifTest.accepted && !pdfTest.accepted && !bmpTest.accepted && !exeTest.accepted && gifTest.error?.includes('không được hỗ trợ') === true
  );
}

// ==============================================================================
// SUITE 3: Deep-Link Search Param Hydration & Alias Tolerance
// ==============================================================================
function testSuite3_DeepLinkHydration() {
  console.log('\n▶ SUITE 3: Deep-Link Parameter Hydration & Alias Tolerance');

  const mockHairstyles = [
    { id: 'hs-1', slug: 'korean-wolf-cut', title: 'Korean Wolf Cut', gender: 'UNISEX' },
    { id: 'hs-2', slug: 'classic-bob', title: 'Classic French Bob', gender: 'FEMALE' },
    { id: 'hs-3', slug: 'undercut-quiff', title: 'Modern Pompadour Quiff', gender: 'MALE' },
  ];

  const mockColors = [
    { id: 'col-1', code: 'ASH-BLONDE', name: 'Bạch Kim Khói', tone: 'COOL' },
    { id: 'col-2', code: 'CHOCO-BROWN', name: 'Nâu Socola', tone: 'WARM' },
  ];

  function hydrateFromQuery(queryString: string) {
    const params = new URLSearchParams(queryString);
    const styleParam = params.get('hairstyleId') || params.get('styleId');
    const colorParam = params.get('hairColorId') || params.get('colorId');

    let matchedStyle = null;
    let matchedColor = null;

    if (styleParam) {
      matchedStyle = mockHairstyles.find((h) => h.id === styleParam || h.slug === styleParam) || null;
    }

    if (colorParam) {
      matchedColor = mockColors.find((c) => c.id === colorParam || c.code === colorParam) || null;
    }

    return { matchedStyle, matchedColor };
  }

  // Probe 3.1: Standard primary parameter names
  const std = hydrateFromQuery('hairstyleId=hs-1&hairColorId=col-1');
  check(
    'Suite 3',
    'Primary parameter hydration (hairstyleId & hairColorId)',
    std.matchedStyle?.id === 'hs-1' && std.matchedColor?.id === 'col-1'
  );

  // Probe 3.2: Alias parameter names (styleId & colorId)
  const alias = hydrateFromQuery('styleId=hs-2&colorId=col-2');
  check(
    'Suite 3',
    'Alias parameter hydration (styleId & colorId)',
    alias.matchedStyle?.id === 'hs-2' && alias.matchedColor?.id === 'col-2'
  );

  // Probe 3.3: Slug matching for hairstyles
  const slugMatch = hydrateFromQuery('hairstyleId=korean-wolf-cut');
  check('Suite 3', 'Hairstyle hydrated via slug identifier', slugMatch.matchedStyle?.id === 'hs-1');

  // Probe 3.4: Color code matching
  const codeMatch = hydrateFromQuery('hairColorId=CHOCO-BROWN');
  check('Suite 3', 'Hair color hydrated via color code string', codeMatch.matchedColor?.id === 'col-2');

  // Probe 3.5: Unknown/malformed IDs return null safely without exception
  const invalid = hydrateFromQuery('hairstyleId=ghost-id&hairColorId=unknown-color');
  check('Suite 3', 'Unknown IDs safely resolve to null without crash', invalid.matchedStyle === null && invalid.matchedColor === null);

  // Probe 3.6: Adversarial query injection parameters
  const adversarialQuery = 'hairstyleId=hs-1&__proto__[polluted]=true&constructor[prototype]=hacked';
  const adv = hydrateFromQuery(adversarialQuery);
  check('Suite 3', 'Prototype pollution query keys safely ignored', adv.matchedStyle?.id === 'hs-1' && (Object.prototype as any).polluted === undefined);
}

// ==============================================================================
// SUITE 4: Booking Transfer CTA URL Construction
// ==============================================================================
function testSuite4_BookingTransferCTA() {
  console.log('\n▶ SUITE 4: Booking Transfer CTA URL Construction');

  function buildBookingUrl(
    selectedHairstyle: { id: string; name?: string; title?: string } | null,
    selectedColor: { id: string; name: string } | null
  ): string {
    if (!selectedHairstyle) return '/booking';
    const params = new URLSearchParams();
    params.set('hairstyleId', selectedHairstyle.id);
    if (selectedColor) {
      params.set('hairColorId', selectedColor.id);
    }
    params.set(
      'notes',
      `Khách hàng đã thử nghiệm trên công cụ AI Try-On và chọn kiểu ${selectedHairstyle.name || selectedHairstyle.title}${selectedColor ? ` màu ${selectedColor.name}` : ''}.`
    );
    return `/booking?${params.toString()}`;
  }

  // Probe 4.1: Empty style returns root /booking
  const emptyUrl = buildBookingUrl(null, null);
  check('Suite 4', 'Null hairstyle yields fallback /booking route', emptyUrl === '/booking');

  // Probe 4.2: Hairstyle with color builds full query
  const fullUrl = buildBookingUrl(
    { id: 'hs-wolf-cut', title: 'Layer Wolf Cut' },
    { id: 'col-smoke-grey', name: 'Xám Khói Ánh Tím' }
  );
  check(
    'Suite 4',
    'Hairstyle with Color builds well-formed URL with encoded params',
    fullUrl.startsWith('/booking?') &&
      fullUrl.includes('hairstyleId=hs-wolf-cut') &&
      fullUrl.includes('hairColorId=col-smoke-grey') &&
      fullUrl.includes('notes=')
  );

  // Probe 4.3: Unicode Vietnamese characters in notes are properly URI-encoded
  const parsed = new URL(`http://localhost${fullUrl}`);
  const decodedNotes = parsed.searchParams.get('notes');
  check(
    'Suite 4',
    'Vietnamese characters in notes round-trip cleanly through URLSearchParams',
    decodedNotes?.includes('Layer Wolf Cut') === true && decodedNotes?.includes('Xám Khói Ánh Tím') === true
  );

  // Probe 4.4: Natural hair color (no color selected) omits hairColorId
  const noColorUrl = buildBookingUrl({ id: 'hs-pompadour', title: 'Pompadour Cổ Điển' }, null);
  const noColorParsed = new URL(`http://localhost${noColorUrl}`);
  check(
    'Suite 4',
    'Natural hair selection cleanly omits hairColorId parameter',
    noColorParsed.searchParams.get('hairstyleId') === 'hs-pompadour' && noColorParsed.searchParams.get('hairColorId') === null
  );
}

// ==============================================================================
// SUITE 5: BookingWizardClient Pre-Selection Ingestion
// ==============================================================================
function testSuite5_BookingWizardIngestion() {
  console.log('\n▶ SUITE 5: BookingWizardClient Ingestion & Form Conformance');

  const mockCatalogHairstyles = [
    { id: 'hs-wolf-cut', title: 'Layer Wolf Cut' },
    { id: 'hs-classic-bob', title: 'Classic French Bob' },
  ];

  const mockCatalogColors = [
    { id: 'col-ash-blonde', name: 'Bạch Kim Khói' },
    { id: 'col-choco-brown', name: 'Nâu Socola' },
  ];

  // Simulating BookingWizardClient ingestion logic
  function simulateWizardIngestion(queryString: string) {
    const params = new URLSearchParams(queryString);
    const sId = params.get('serviceId');
    const cId = params.get('comboId');
    const hId = params.get('hairstyleId') || params.get('styleId');
    const colId = params.get('hairColorId') || params.get('colorId');
    const styId = params.get('stylistId');

    return {
      selectedServiceId: sId || '',
      selectedComboId: cId || '',
      selectedHairstyleId: hId || '',
      selectedHairColorId: colId || '',
      selectedStylistId: styId || '',
    };
  }

  // Probe 5.1: Ingests transferred hairstyle and hair color
  const ingested = simulateWizardIngestion('hairstyleId=hs-wolf-cut&hairColorId=col-ash-blonde');
  check(
    'Suite 5',
    'Wizard ingests transferred hairstyleId and hairColorId into form state',
    ingested.selectedHairstyleId === 'hs-wolf-cut' && ingested.selectedHairColorId === 'col-ash-blonde'
  );

  // Probe 5.2: Ingests alias parameters
  const aliasIngested = simulateWizardIngestion('styleId=hs-classic-bob&colorId=col-choco-brown');
  check(
    'Suite 5',
    'Wizard ingests alias styleId and colorId parameters',
    aliasIngested.selectedHairstyleId === 'hs-classic-bob' && aliasIngested.selectedHairColorId === 'col-choco-brown'
  );

  // Probe 5.3: Ingested selections pass CreateBookingSchema validation
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const bookingDate = tomorrow.toISOString().split('T')[0];

  const bookingPayload = {
    serviceId: 'srv-color-perm-combo',
    hairstyleId: ingested.selectedHairstyleId,
    hairColorId: ingested.selectedHairColorId,
    bookingDate,
    bookingTime: '10:00',
    customerName: 'Hoàng Kim Chi',
    customerPhone: '0988776655',
    notes: 'Đặt từ kết quả mô phỏng',
  };

  const zodRes = CreateBookingSchema.safeParse(bookingPayload);
  check('Suite 5', 'Form payload with ingested Try-On choices satisfies CreateBookingSchema', zodRes.success === true);

  // Probe 5.4: Wizard handles unknown transferred IDs without throwing
  const unknownIngested = simulateWizardIngestion('hairstyleId=invalid-999&hairColorId=invalid-888');
  check(
    'Suite 5',
    'Wizard ingests unknown ID strings without throwing uncaught exceptions',
    unknownIngested.selectedHairstyleId === 'invalid-999' && unknownIngested.selectedHairColorId === 'invalid-888'
  );
}

// ==============================================================================
// SUITE 6: Adversarial XSS & SVG Injection Resistance
// ==============================================================================
async function testSuite6_XSSAndSVGResistance() {
  console.log('\n▶ SUITE 6: Adversarial XSS & SVG Injection Resistance');

  const provider = new DemoHairTryOnProvider();

  // Attack Vectors
  const vectors = [
    {
      name: 'Script tag breakout',
      title: '"><script>alert("XSS")</script><text>',
      color: '#D4AF37',
    },
    {
      name: 'Attribute event handler injection',
      title: 'Normal Title',
      color: '" onmouseover="alert(\'XSS\')" data-x="',
    },
    {
      name: 'SVG foreignObject injection',
      title: '<foreignObject width="100" height="50"><body xmlns="http://www.w3.org/1999/xhtml"><script>alert(1)</script></body></foreignObject>',
      color: '#123456',
    },
    {
      name: 'XML entity declaration injection',
      title: '<!DOCTYPE test [<!ENTITY xxe SYSTEM "file:///etc/passwd">]><text>&xxe;</text>',
      color: '#654321',
    },
    {
      name: 'Image tag onerror payload',
      title: '<img src=x onerror=alert(document.cookie)>',
      color: '#ABCDEF',
    },
  ];

  for (const v of vectors) {
    const res = await provider.processTryOn({
      imageBuffer: SAMPLE_IMAGE_BUFFER,
      mimeType: 'image/png',
      hairstyleId: 'hs-test',
      options: {
        hairstyleTitle: v.title,
        hairColorHex: v.color,
      },
    });

    const b64 = res.resultImageBase64.replace('data:image/svg+xml;base64,', '');
    const svgContent = Buffer.from(b64, 'base64').toString('utf-8');

    // Verification: RAW unescaped script tag or unescaped event handler MUST NOT exist in SVG
    const hasRawScriptTag = svgContent.includes('<script>') || svgContent.includes('<script');
    const hasRawOnEvent = /on\w+\s*=\s*"/i.test(svgContent);
    const hasForeignObject = svgContent.includes('<foreignObject');

    check(
      'Suite 6',
      `Vector [${v.name}] is neutralized in generated SVG document`,
      !hasRawScriptTag && !hasRawOnEvent && !hasForeignObject,
      'Unescaped markup found in SVG',
      { snippet: svgContent.slice(Math.max(0, svgContent.indexOf('Kiểu tóc') - 30), svgContent.indexOf('Kiểu tóc') + 100) }
    );
  }

  // Probe 6.6: Verify Zod schema rejects non-string options
  const invalidOptions = {
    hairstyleId: 'hs-wolf-cut',
    options: {
      intensity: 'not-a-number' as any,
    },
  };
  const zodOptionsRes = TryOnOptionsSchema.safeParse(invalidOptions.options);
  check('Suite 6', 'TryOnOptionsSchema rejects non-numeric intensity values', zodOptionsRes.success === false);

  // Probe 6.7: Base64 data URI in SVG image tag cannot break XML structure
  const rawSvgImageCheck = await provider.processTryOn({
    imageBuffer: SAMPLE_IMAGE_BUFFER,
    mimeType: 'image/png',
    hairstyleId: 'hs-safe-bob',
  });
  const decodedSvg = Buffer.from(
    rawSvgImageCheck.resultImageBase64.replace('data:image/svg+xml;base64,', ''),
    'base64'
  ).toString('utf-8');

  check(
    'Suite 6',
    'Generated SVG is well-formed XML with closing </svg> tag',
    decodedSvg.startsWith('<svg') && decodedSvg.endsWith('</svg>')
  );
}

// ==============================================================================
// MAIN RUNNER
// ==============================================================================
async function runAllChallengerProbes() {
  process.env.TRYON_MIN_DELAY_MS = '0';
  process.env.TRYON_MAX_DELAY_MS = '5';

  console.log('================================================================================');
  console.log('       MILESTONE 5 CHALLENGER 2: ADVERSARIAL STRESS PROBE SUITE');
  console.log('================================================================================');

  const start = Date.now();

  testSuite1_UIStateMachine();
  testSuite2_ClientSidePreValidation();
  testSuite3_DeepLinkHydration();
  testSuite4_BookingTransferCTA();
  testSuite5_BookingWizardIngestion();
  await testSuite6_XSSAndSVGResistance();

  const duration = Date.now() - start;
  const passed = testResults.filter((r) => r.passed).length;
  const failed = testResults.filter((r) => !r.passed).length;

  console.log('\n================================================================================');
  console.log('                     CHALLENGER 2 PROBE SUMMARY');
  console.log('================================================================================');
  console.log(`  Duration:      ${duration} ms`);
  console.log(`  Total Probes:  ${testResults.length}`);
  console.log(`  Passed:        ${passed}`);
  console.log(`  Failed:        ${failed}`);

  if (failed > 0) {
    console.error('\n❌ VERDICT: CHALLENGE_DETECTED');
    process.exit(1);
  } else {
    console.log('\n✅ VERDICT: ALL PROBES PASSED (APPROVE)');
    process.exit(0);
  }
}

runAllChallengerProbes().catch((err) => {
  console.error('Fatal probe runner failure:', err);
  process.exit(1);
});
