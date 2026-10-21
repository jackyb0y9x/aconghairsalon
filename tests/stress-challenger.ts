/**
 * Adversarial Challenger Stress Test Suite
 * Empirical verification of M1 Database Schema, Relational Cascades, Constraints, and Security Invariants.
 */

import { Prisma } from '@prisma/client';
import { CreateBookingSchema, UpdateBookingStatusSchema } from '../lib/validations/booking';
import { LoginSchema } from '../lib/validations/auth';
import { hashPassword, verifyPassword, hasRole, hasPermission, ROUTE_PERMISSIONS, AdminRole } from '../lib/auth';
import { DemoHairTryOnProvider } from '../services/try-on/demo';
import { MockStorageProvider } from '../services/storage/mock';
import fs from 'fs';
import path from 'path';

interface TestResult {
  suite: string;
  name: string;
  passed: boolean;
  error?: string;
  details?: any;
}

const results: TestResult[] = [];

function assert(condition: boolean, suite: string, name: string, message?: string, details?: any) {
  if (condition) {
    results.push({ suite, name, passed: true, details });
    console.log(`  ✓ [PASS] ${suite} -> ${name}`);
  } else {
    results.push({ suite, name, passed: false, error: message || 'Assertion failed', details });
    console.error(`  ✗ [FAIL] ${suite} -> ${name}: ${message}`);
  }
}

async function runAdversarialStressSuite() {
  console.log('================================================================================');
  console.log('         M1 EMPIRICAL CHALLENGER ADVERSARIAL STRESS TEST SUITE                  ');
  console.log('================================================================================\n');

  // ---------------------------------------------------------------------------
  // SUITE 1: PRISMA DMMF SCHEMA METAMODEL REFLECTION & RELATIONAL INTEGRITY
  // ---------------------------------------------------------------------------
  console.log('▶ SUITE 1: PRISMA DMMF SCHEMA & RELATIONAL CONSTRAINTS');

  const dmmf = Prisma.dmmf;
  const models = dmmf.datamodel.models;
  const enums = dmmf.datamodel.enums;

  assert(models.length === 14, 'DMMF Metamodel', 'Total 14 models declared', `Expected 14, got ${models.length}`);
  assert(enums.length === 12, 'DMMF Metamodel', 'Total 12 enums declared', `Expected 12, got ${enums.length}`);

  const expectedModelNames = [
    'Role', 'User', 'Session', 'Category', 'Hairstyle', 'HairColor',
    'Service', 'ServiceCombo', 'BeforeAfter', 'Booking', 'Banner',
    'Article', 'SiteSetting', 'AuditLog'
  ];

  for (const name of expectedModelNames) {
    const found = models.find((m) => m.name === name);
    assert(!!found, 'DMMF Metamodel', `Model ${name} exists in schema`, `Model ${name} missing`);
  }

  // Check CRITICAL RELATIONAL CONSTRAINT:
  // If a field has onDelete: SetNull, the field MUST be optional (isRequired === false),
  // otherwise SQL foreign key deletion would trigger NOT NULL constraint failure!
  console.log('\n  Checking Invariant: All onDelete: SetNull relations must target nullable foreign key fields:');
  let setNullSafe = true;
  for (const model of models) {
    for (const field of model.fields) {
      if (field.relationOnDelete === 'SetNull') {
        const fkFieldNames = field.relationFromFields || [];
        for (const fkName of fkFieldNames) {
          const fkField = model.fields.find((f) => f.name === fkName);
          if (fkField && fkField.isRequired) {
            setNullSafe = false;
            assert(false, 'Relational Cascades', `SetNull safety on ${model.name}.${fkName}`, `FK ${model.name}.${fkName} has onDelete: SetNull but is marked required!`);
          }
        }
      }
    }
  }
  assert(setNullSafe, 'Relational Cascades', 'All onDelete: SetNull fields are strictly nullable', 'Found non-nullable field with SetNull cascade');

  // Verify Session cascade delete rule
  const sessionModel = models.find((m) => m.name === 'Session');
  const sessionUserField = sessionModel?.fields.find((f) => f.name === 'user');
  assert(
    sessionUserField?.relationOnDelete === 'Cascade',
    'Relational Cascades',
    'Session.user has onDelete: Cascade',
    `Expected Cascade, got ${sessionUserField?.relationOnDelete}`
  );

  // Verify Role restrict delete rule
  const userModel = models.find((m) => m.name === 'User');
  const userRoleField = userModel?.fields.find((f) => f.name === 'role');
  assert(
    userRoleField?.relationOnDelete === 'Restrict',
    'Relational Cascades',
    'User.role has onDelete: Restrict',
    `Expected Restrict, got ${userRoleField?.relationOnDelete}`
  );

  // Verify Category restrict delete rules
  const hairstyleModel = models.find((m) => m.name === 'Hairstyle');
  const hairstyleCategoryField = hairstyleModel?.fields.find((f) => f.name === 'category');
  assert(
    hairstyleCategoryField?.relationOnDelete === 'Restrict',
    'Relational Cascades',
    'Hairstyle.category has onDelete: Restrict',
    `Expected Restrict, got ${hairstyleCategoryField?.relationOnDelete}`
  );

  const serviceModel = models.find((m) => m.name === 'Service');
  const serviceCategoryField = serviceModel?.fields.find((f) => f.name === 'category');
  assert(
    serviceCategoryField?.relationOnDelete === 'Restrict',
    'Relational Cascades',
    'Service.category has onDelete: Restrict',
    `Expected Restrict, got ${serviceCategoryField?.relationOnDelete}`
  );

  // Verify Article author restrict delete rule
  const articleModel = models.find((m) => m.name === 'Article');
  const articleAuthorField = articleModel?.fields.find((f) => f.name === 'author');
  assert(
    articleAuthorField?.relationOnDelete === 'Restrict',
    'Relational Cascades',
    'Article.author has onDelete: Restrict',
    `Expected Restrict, got ${articleAuthorField?.relationOnDelete}`
  );

  // Verify Unique constraints across models
  const uniqueChecks: { model: string; field: string }[] = [
    { model: 'Role', field: 'name' },
    { model: 'User', field: 'email' },
    { model: 'Session', field: 'sessionToken' },
    { model: 'Category', field: 'slug' },
    { model: 'Hairstyle', field: 'slug' },
    { model: 'HairColor', field: 'code' },
    { model: 'Service', field: 'slug' },
    { model: 'ServiceCombo', field: 'slug' },
    { model: 'Booking', field: 'bookingCode' },
    { model: 'Booking', field: 'idempotencyKey' },
    { model: 'Article', field: 'slug' },
  ];

  for (const check of uniqueChecks) {
    const targetModel = models.find((m) => m.name === check.model);
    const field = targetModel?.fields.find((f) => f.name === check.field);
    assert(
      field?.isUnique === true,
      'Unique Constraints',
      `${check.model}.${check.field} has @unique constraint`,
      `Field ${check.model}.${check.field} isUnique is not true`
    );
  }

  // ---------------------------------------------------------------------------
  // SUITE 2: ZOD VALIDATION SCHEMA ADVERSARIAL STRESS TESTING
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 2: ZOD VALIDATION ADVERSARIAL STRESS TESTING');

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = tomorrow.toISOString().split('T')[0];

  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayStr = yesterday.toISOString().split('T')[0];

  // TC 2.1: Valid payload with all fields
  const validBookingPayload = {
    serviceId: 'srv-001',
    hairstyleId: 'style-001',
    hairColorId: 'col-001',
    stylistId: 'sty-001',
    bookingDate: tomorrowStr,
    bookingTime: '10:30',
    customerName: 'Nguyễn Văn A',
    customerPhone: '0908123456',
    customerEmail: 'customer@example.com',
    notes: 'Yêu cầu uốn sóng nhẹ tự nhiên',
    idempotencyKey: 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
  };

  const parsedValid = CreateBookingSchema.safeParse(validBookingPayload);
  assert(parsedValid.success, 'Booking Zod Validation', 'Valid complete payload passes');

  // TC 2.2: Adversarial Past Date Rejection
  const pastDatePayload = { ...validBookingPayload, bookingDate: yesterdayStr };
  const parsedPastDate = CreateBookingSchema.safeParse(pastDatePayload);
  assert(!parsedPastDate.success, 'Booking Zod Validation', 'Past date is strictly rejected');

  // TC 2.3: Vietnamese Phone Number Stress Tests
  const validPhones = ['0908123456', '+84908123456', '0329876543', '0567891234', '0789123456', '0898765432'];
  for (const phone of validPhones) {
    const res = CreateBookingSchema.safeParse({ ...validBookingPayload, customerPhone: phone });
    assert(res.success, 'Phone Regex Stress', `Valid VN phone ${phone} accepted`);
  }

  const invalidPhones = [
    '0123456789', // Old 11-digit prefix 01
    '02431234567', // Hanoi landline
    '090812345', // Only 9 digits
    '09081234567', // 11 digits
    '1234567890', // No 0 or +84 prefix
    '+840908123456', // Double prefix +84 and 0
    'phone12345', // Letters
    '0908 123 456', // Space in phone
    '0908-123-456', // Dashes in phone
  ];
  for (const phone of invalidPhones) {
    const res = CreateBookingSchema.safeParse({ ...validBookingPayload, customerPhone: phone });
    assert(!res.success, 'Phone Regex Stress', `Invalid phone format ${phone} rejected`);
  }

  // TC 2.4: Booking Time Format Stress Tests (within salon opening hours 08:30 - 20:30)
  const validTimes = ['08:30', '10:00', '12:00', '18:45', '20:30'];
  for (const time of validTimes) {
    const res = CreateBookingSchema.safeParse({ ...validBookingPayload, bookingTime: time });
    assert(res.success, 'Time Regex Stress', `Valid time format ${time} accepted`);
  }

  const invalidTimes = ['00:00', '23:59', '24:00', '25:00', '12:60', '8:30', '08:3', '08-30', 'AM 09:00', 'invalid'];
  for (const time of invalidTimes) {
    const res = CreateBookingSchema.safeParse({ ...validBookingPayload, bookingTime: time });
    assert(!res.success, 'Time Regex Stress', `Invalid time format ${time} rejected`);
  }

  // TC 2.5: Boundaries on String Lengths
  // Name min 2, max 100
  const name1Char = CreateBookingSchema.safeParse({ ...validBookingPayload, customerName: 'A' });
  assert(!name1Char.success, 'String Boundaries', 'Customer name 1 char rejected (< 2 chars)');

  const nameWhitespace = CreateBookingSchema.safeParse({ ...validBookingPayload, customerName: '     ' });
  assert(!nameWhitespace.success, 'String Boundaries', 'Customer name whitespace-only rejected');

  const name100Char = 'A'.repeat(100);
  const name100Res = CreateBookingSchema.safeParse({ ...validBookingPayload, customerName: name100Char });
  assert(name100Res.success, 'String Boundaries', 'Customer name exactly 100 chars accepted');

  const name101Char = 'A'.repeat(101);
  const name101Res = CreateBookingSchema.safeParse({ ...validBookingPayload, customerName: name101Char });
  assert(!name101Res.success, 'String Boundaries', 'Customer name 101 chars rejected (> 100 chars)');

  // Notes max 500
  const notes500Char = 'B'.repeat(500);
  const notes500Res = CreateBookingSchema.safeParse({ ...validBookingPayload, notes: notes500Char });
  assert(notes500Res.success, 'String Boundaries', 'Customer notes 500 chars accepted');

  const notes501Char = 'B'.repeat(501);
  const notes501Res = CreateBookingSchema.safeParse({ ...validBookingPayload, notes: notes501Char });
  assert(!notes501Res.success, 'String Boundaries', 'Customer notes 501 chars rejected (> 500 chars)');

  // IdempotencyKey UUID format
  const validUUID = '123e4567-e89b-12d3-a456-426614174000';
  const invalidUUID = 'not-a-valid-uuid-format-12345';
  const uuidResValid = CreateBookingSchema.safeParse({ ...validBookingPayload, idempotencyKey: validUUID });
  assert(uuidResValid.success, 'UUID Validation', 'Valid UUID v4 accepted as idempotencyKey');

  const uuidResInvalid = CreateBookingSchema.safeParse({ ...validBookingPayload, idempotencyKey: invalidUUID });
  assert(!uuidResInvalid.success, 'UUID Validation', 'Invalid string rejected as idempotencyKey');

  // TC 2.6: SQL Injection & XSS Attack Payloads in text fields
  const sqliPayload = { ...validBookingPayload, customerName: "Robert'); DROP TABLE bookings;--" };
  const sqliRes = CreateBookingSchema.safeParse(sqliPayload);
  assert(sqliRes.success, 'Adversarial Payloads', 'SQL injection string parsed safely as string literal');

  const xssPayload = { ...validBookingPayload, notes: '<script>alert("XSS")</script><img src=x onerror=alert(1)>' };
  const xssRes = CreateBookingSchema.safeParse(xssPayload);
  assert(xssRes.success, 'Adversarial Payloads', 'XSS payload parsed safely as text string');

  // ---------------------------------------------------------------------------
  // SUITE 3: AUTHENTICATION, PASSWORD HASHING & RBAC GUARDS
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 3: AUTHENTICATION, CRYPTO & RBAC GUARDS');

  // TC 3.1: Password Hashing & Verification
  const testPassword = 'SecurePassword@2026';
  const hashedPassword = await hashPassword(testPassword);
  assert(hashedPassword.startsWith('$2'), 'Bcrypt Crypto', 'bcrypt generated valid salt and hash format');

  const matchTrue = await verifyPassword(testPassword, hashedPassword);
  assert(matchTrue === true, 'Bcrypt Crypto', 'Correct password verifies successfully');

  const matchFalse = await verifyPassword('WrongPassword', hashedPassword);
  assert(matchFalse === false, 'Bcrypt Crypto', 'Incorrect password is rejected');

  // TC 3.2: RBAC Matrix Verification
  assert(hasRole('SUPER_ADMIN', ['CONTENT_ADMIN']), 'RBAC Matrix', 'SUPER_ADMIN automatically passes all role checks');
  assert(hasRole('BOOKING_STAFF', ['BOOKING_STAFF', 'SUPER_ADMIN']), 'RBAC Matrix', 'BOOKING_STAFF passes booking role check');
  assert(!hasRole('EDITOR', ['SUPER_ADMIN', 'CONTENT_ADMIN']), 'RBAC Matrix', 'EDITOR is denied access to Content Admin routes');

  // Check ROUTE_PERMISSIONS definitions
  const adminRoutes = Object.keys(ROUTE_PERMISSIONS);
  assert(adminRoutes.includes('/admin/site-settings'), 'RBAC Matrix', '/admin/site-settings is registered');
  assert(
    ROUTE_PERMISSIONS['/admin/site-settings'].length === 1 && ROUTE_PERMISSIONS['/admin/site-settings'][0] === 'SUPER_ADMIN',
    'RBAC Matrix',
    '/admin/site-settings strictly restricted to SUPER_ADMIN only'
  );

  assert(
    ROUTE_PERMISSIONS['/admin/audit-logs'].length === 1 && ROUTE_PERMISSIONS['/admin/audit-logs'][0] === 'SUPER_ADMIN',
    'RBAC Matrix',
    '/admin/audit-logs strictly restricted to SUPER_ADMIN only'
  );

  // ---------------------------------------------------------------------------
  // SUITE 4: HAIR TRY-ON SERVICE ADVERSARIAL STRESS TESTING
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 4: HAIR TRY-ON SERVICE ADVERSARIAL TESTING');

  const tryOnProvider = new DemoHairTryOnProvider();

  // TC 4.1: Valid Processing
  const validImgBuffer = Buffer.from('mock-portrait-image-bytes-data');
  const validTryOn = await tryOnProvider.processTryOn({
    imageBuffer: validImgBuffer,
    mimeType: 'image/jpeg',
    hairstyleId: 'style-001',
    options: { intensity: 0.9 },
  });

  assert(validTryOn.isMock === true, 'Try-On Service', 'Response flagged as isMock: true');
  assert(validTryOn.mimeType === 'image/svg+xml', 'Try-On Service', 'Returns SVG composite preview');
  assert(validTryOn.resultImageBase64.startsWith('data:image/svg+xml;base64,'), 'Try-On Service', 'Returns proper Data URL format');
  assert(validTryOn.processingTimeMs >= 0, 'Try-On Service', 'Processing time metric recorded');

  // TC 4.2: Empty Buffer Rejection
  try {
    await tryOnProvider.processTryOn({
      imageBuffer: Buffer.alloc(0),
      mimeType: 'image/jpeg',
      hairstyleId: 'style-001',
    });
    assert(false, 'Try-On Service', 'Empty buffer should throw Error');
  } catch (err: any) {
    assert(err.message.includes('không hợp lệ hoặc rỗng'), 'Try-On Service', 'Empty image buffer throws expected error');
  }

  // TC 4.3: Missing HairstyleId Rejection
  try {
    await tryOnProvider.processTryOn({
      imageBuffer: validImgBuffer,
      mimeType: 'image/jpeg',
      hairstyleId: '',
    });
    assert(false, 'Try-On Service', 'Missing hairstyleId should throw Error');
  } catch (err: any) {
    assert(err.message.includes('Chưa chọn kiểu tóc'), 'Try-On Service', 'Empty hairstyleId throws expected error');
  }

  // ---------------------------------------------------------------------------
  // SUITE 5: STORAGE PROVIDER PATH TRAVERSAL ADVERSARIAL STRESS TESTING
  // ---------------------------------------------------------------------------
  console.log('\n▶ SUITE 5: STORAGE PROVIDER PATH TRAVERSAL ADVERSARIAL TESTING');

  const storageProvider = new MockStorageProvider();

  // Test dangerous path traversal filenames
  const traversalFilenames = [
    '../../../../etc/passwd',
    '..\\..\\..\\Windows\\System32\\cmd.exe',
    '../../../boot.ini',
    'test<script>alert(1)</script>.png',
    'test|cmd.exe|foo.jpg',
  ];

  for (const badFileName of traversalFilenames) {
    const uploadRes = await storageProvider.upload(
      Buffer.from('sample image content'),
      badFileName,
      { folder: 'test_traversal' }
    );

    // Verify sanitized publicId and URL contains NO path traversal characters
    assert(!uploadRes.publicId.includes('..'), 'Path Traversal Defense', `publicId for ${badFileName} contains no parent dir traversal`);
    assert(!uploadRes.url.includes('..'), 'Path Traversal Defense', `url for ${badFileName} contains no parent dir traversal`);
    assert(!uploadRes.publicId.includes('<script>'), 'Path Traversal Defense', `publicId for ${badFileName} strips XSS characters`);
  }

  // ---------------------------------------------------------------------------
  // SUMMARY REPORT
  // ---------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log('                          STRESS TEST SUMMARY REPORT                            ');
  console.log('================================================================================');

  const total = results.length;
  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log(`Total Invariants Tested : ${total}`);
  console.log(`Passed Invariants       : ${passed}`);
  console.log(`Failed Invariants       : ${failed}`);

  if (failed > 0) {
    console.error('\nFAILURES DETECTED:');
    for (const f of results.filter((r) => !r.passed)) {
      console.error(`  - [${f.suite}] ${f.name}: ${f.error}`);
    }
    process.exit(1);
  } else {
    console.log('\n>>> ALL ADVERSARIAL INVARIANTS PASSED 100% <<<');
    process.exit(0);
  }
}

runAdversarialStressSuite().catch((err) => {
  console.error('Fatal crash during stress test execution:', err);
  process.exit(1);
});
