import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

const BASE_URL = process.env.APP_URL || 'https://sv-qa-02-address-verify.onrender.com';

const validAddress = {
  line1: '12 MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001'
};

describe('Springworks SDET Bug Verification Test Suite — API Defects', () => {

  before(async () => {
    // Reset seed data before running tests
    try {
      await fetch(`${BASE_URL}/api/reset`, { method: 'POST' });
    } catch (e) {
      console.warn('Could not reset seed data before tests:', e.message);
    }
  });

  // BUG-02-01: wrong-status-code on POST /api/address
  test('BUG-02-01: POST /api/address should return HTTP 201 Created on success', async () => {
    const payload = {
      candidateId: 901,
      current: { ...validAddress },
      permanent: { ...validAddress },
      sameAsPermanent: false
    };

    const res = await fetch(`${BASE_URL}/api/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Spec: Returns 201 with the stored submission
    // Currently returns 200 OK (FAILS)
    assert.equal(
      res.status,
      201,
      `Expected HTTP 201 Created, but received HTTP ${res.status}`
    );
  });

  // BUG-02-02: wrong-status-code on GET /api/address/:candidateId
  test('BUG-02-02: GET /api/address/:candidateId should return HTTP 404 Not Found for non-existent candidate', async () => {
    const nonExistentId = 999999;
    const res = await fetch(`${BASE_URL}/api/address/${nonExistentId}`);

    // Spec: 404 if no submission exists for that candidate id
    // Currently returns 200 OK with body null (FAILS)
    assert.equal(
      res.status,
      404,
      `Expected HTTP 404 Not Found for missing candidate, but received HTTP ${res.status}`
    );
  });

  // BUG-02-03: wrong-arithmetic on POST /api/address (matchPercent)
  test('BUG-02-03: POST /api/address should calculate matchPercent as (matches / 4) * 100, max 100%', async () => {
    const payload = {
      candidateId: 903,
      current: { ...validAddress },
      permanent: { ...validAddress },
      sameAsPermanent: false
    };

    const res = await fetch(`${BASE_URL}/api/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const data = await res.json();

    // Spec: Two identical addresses score 100; computes matchPercent across 4 fields
    // Currently divides by 3 instead of 4, producing 133% (FAILS)
    assert.equal(
      data.matchPercent,
      100,
      `Expected matchPercent to be 100 for identical addresses, but got ${data.matchPercent}`
    );
  });

  // BUG-02-04: missing-required-field on POST /api/address
  test('BUG-02-04: POST /api/address should return HTTP 400 when required field "city" is missing', async () => {
    const payloadWithoutCity = {
      candidateId: 904,
      current: {
        line1: '12 MG Road',
        // city is omitted
        state: 'Karnataka',
        pincode: '560001'
      },
      permanent: { ...validAddress },
      sameAsPermanent: false
    };

    const res = await fetch(`${BASE_URL}/api/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadWithoutCity)
    });

    // Spec: line1, city, state are required, non-blank strings. Any validation failure returns 400.
    // Currently returns 200 OK (FAILS)
    assert.equal(
      res.status,
      400,
      `Expected HTTP 400 Bad Request when city is missing, but received HTTP ${res.status}`
    );
  });

  // BUG-02-10: missing-enum-validation on POST /api/address
  test('BUG-02-10: POST /api/address should return HTTP 400 when state is not in the allowed enum', async () => {
    const payloadInvalidState = {
      candidateId: 910,
      current: {
        ...validAddress,
        state: 'Goa' // Not in the 8 allowed states enum
      },
      permanent: {
        ...validAddress,
        state: 'Goa'
      },
      sameAsPermanent: false
    };

    const res = await fetch(`${BASE_URL}/api/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadInvalidState)
    });

    // Spec: state must be one of the fixed list of states offered in UI dropdown. Any validation failure returns 400.
    // Currently returns 200 OK accepting "Goa" (FAILS)
    assert.equal(
      res.status,
      400,
      `Expected HTTP 400 Bad Request for unlisted state "Goa", but received HTTP ${res.status}`
    );
  });

  // BUG-02-11: wrong-persisted-default on POST /api/address
  test('BUG-02-11: POST /api/address should default sameAsPermanent to false when omitted', async () => {
    const payloadWithoutFlag = {
      candidateId: 911,
      current: { ...validAddress },
      permanent: {
        line1: '45 Park Street',
        city: 'Kolkata',
        state: 'West Bengal',
        pincode: '700016'
      }
      // sameAsPermanent is omitted
    };

    const res = await fetch(`${BASE_URL}/api/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadWithoutFlag)
    });

    const data = await res.json();

    // Spec: sameAsPermanent defaults to false if omitted
    // Currently defaults to true (FAILS)
    assert.equal(
      data.sameAsPermanent,
      false,
      `Expected sameAsPermanent to default to false when omitted, but got ${data.sameAsPermanent}`
    );
  });

  // BUG-02-13: state-not-persisted on POST /api/address
  test('BUG-02-13: POST /api/address should persist newly submitted address to GET /api/address store', async () => {
    const candidateId = 913;
    const payload = {
      candidateId,
      current: { ...validAddress },
      permanent: { ...validAddress },
      sameAsPermanent: false
    };

    // Step 1: Submit new address
    const postRes = await fetch(`${BASE_URL}/api/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert.ok(postRes.status >= 200 && postRes.status < 300, 'POST request should succeed');

    // Step 2: Fetch all submissions
    const listRes = await fetch(`${BASE_URL}/api/address`);
    const submissions = await listRes.json();

    // Spec: stores the submission... GET /api/address returns 200 with a JSON array of all submissions
    // Currently the submission is never saved to the array, only initial seed data remains (FAILS)
    const found = submissions.some((s) => s.candidateId === candidateId);
    assert.ok(
      found,
      `Expected newly submitted candidateId ${candidateId} to be persisted in GET /api/address, but it was not found`
    );
  });

  // BUG-02-15: missing-sanitization on POST /api/address
  test('BUG-02-15: POST /api/address should trim leading and trailing whitespace from line1, city, state', async () => {
    const payloadWithWhitespace = {
      candidateId: 915,
      current: {
        line1: '  12 MG Road  ',
        city: '  Bengaluru  ',
        state: 'Karnataka',
        pincode: '560001'
      },
      permanent: { ...validAddress },
      sameAsPermanent: false
    };

    const res = await fetch(`${BASE_URL}/api/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadWithWhitespace)
    });

    const data = await res.json();

    // Spec: surrounding whitespace should be trimmed before storage/comparison
    // Currently stores with untrimmed whitespace (FAILS)
    assert.equal(
      data.current.line1,
      '12 MG Road',
      `Expected trimmed line1 "12 MG Road", but got "${data.current?.line1}"`
    );
    assert.equal(
      data.current.city,
      'Bengaluru',
      `Expected trimmed city "Bengaluru", but got "${data.current?.city}"`
    );
  });

  // BUG-02-08: off-by-one-boundary on POST /api/address
  test('BUG-02-08: POST /api/address should enforce strict 6-digit boundary for pincode (rejecting 5 or 7 digits)', async () => {
    const payload5Digit = {
      candidateId: 908,
      current: {
        ...validAddress,
        pincode: '56000' // 5 digits (boundary violation)
      },
      permanent: { ...validAddress },
      sameAsPermanent: false
    };

    const res = await fetch(`${BASE_URL}/api/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload5Digit)
    });

    // Spec: pincode must be exactly 6 digits, not starting with 0. Anything else is invalid.
    // Currently returns 200 OK accepting 5-digit pincodes due to boundary defect (FAILS)
    assert.equal(
      res.status,
      400,
      `Expected HTTP 400 Bad Request for 5-digit pincode, but received HTTP ${res.status}`
    );
  });

  // BUG-02-14: state-not-persisted on GET /api/address/:candidateId
  test('BUG-02-14: GET /api/address/:candidateId should return newly submitted candidate address', async () => {
    const candidateId = 914;
    const payload = {
      candidateId,
      current: { ...validAddress },
      permanent: { ...validAddress },
      sameAsPermanent: false
    };

    // Step 1: Submit new address
    await fetch(`${BASE_URL}/api/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    // Step 2: Query by candidateId
    const res = await fetch(`${BASE_URL}/api/address/${candidateId}`);

    // Spec: Returns 200 with the submission object if found
    // Currently returns 200 with null body because submission state is not persisted (FAILS)
    const data = await res.json();
    assert.ok(
      data && data.candidateId === candidateId,
      `Expected GET /api/address/${candidateId} to return submission for candidate ${candidateId}, but got ${JSON.stringify(data)}`
    );
  });

});
