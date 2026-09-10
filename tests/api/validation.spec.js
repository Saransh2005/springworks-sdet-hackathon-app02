import { test, describe, before } from 'node:test';
import assert from 'node:assert/strict';

const DEFAULT_PORT = process.env.TEST_TARGET === 'fixed' ? '3002' : '3000';
const BASE_URL = process.env.APP_URL || (process.env.TEST_TARGET === 'fixed' 
  ? `http://localhost:${DEFAULT_PORT}` 
  : 'https://sv-qa-02-address-verify.onrender.com');

const validAddress = {
  line1: '12 MG Road',
  city: 'Bengaluru',
  state: 'Karnataka',
  pincode: '560001'
};

describe('API Tests — Input Validation & Data Sanitization', () => {

  before(async () => {
    try {
      await fetch(`${BASE_URL}/api/reset`, { method: 'POST' });
    } catch (e) {
      console.warn('Could not reset seed data before tests:', e.message);
    }
  });

  // BUG-02-04: missing-required-field on POST /api/address
  test('BUG-02-04: POST /api/address should return HTTP 400 when required field "city" is missing', async () => {
    const payloadWithoutCity = {
      candidateId: 904,
      current: {
        line1: '12 MG Road',
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

    // Spec: line1, city, state are required strings. Any validation failure returns 400.
    // Unpatched app returns HTTP 200 OK (FAILS)
    assert.equal(
      res.status,
      400,
      `Expected HTTP 400 Bad Request when city is missing, but received HTTP ${res.status}`
    );
  });

  // BUG-02-08: off-by-one-boundary on POST /api/address
  test('BUG-02-08: POST /api/address should enforce strict 6-digit boundary for pincode (rejecting 5 or 7 digits)', async () => {
    const payload5Digit = {
      candidateId: 908,
      current: {
        ...validAddress,
        pincode: '56000' // 5 digits (invalid boundary)
      },
      permanent: { ...validAddress },
      sameAsPermanent: false
    };

    const res = await fetch(`${BASE_URL}/api/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload5Digit)
    });

    // Spec: pincode must be exactly 6 digits. Anything else returns HTTP 400.
    // Unpatched app returns HTTP 200 OK accepting 5-digit pincodes (FAILS)
    assert.equal(
      res.status,
      400,
      `Expected HTTP 400 Bad Request for 5-digit pincode, but received HTTP ${res.status}`
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

    // Spec: state must be one of the fixed 8 allowed states. Any validation failure returns 400.
    // Unpatched app returns HTTP 200 OK accepting "Goa" (FAILS)
    assert.equal(
      res.status,
      400,
      `Expected HTTP 400 Bad Request for unlisted state "Goa", but received HTTP ${res.status}`
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

    // Spec: surrounding whitespace should be trimmed before storage
    // Unpatched app stores with untrimmed whitespace (FAILS)
    assert.equal(
      data.current?.line1,
      '12 MG Road',
      `Expected trimmed line1 "12 MG Road", but got "${data.current?.line1}"`
    );
    assert.equal(
      data.current?.city,
      'Bengaluru',
      `Expected trimmed city "Bengaluru", but got "${data.current?.city}"`
    );
  });

});
