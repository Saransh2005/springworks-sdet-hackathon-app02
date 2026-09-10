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

describe('API Tests — Address Submission & Retrieval Endpoints', () => {

  before(async () => {
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

    // Spec: Returns HTTP 201 Created with stored submission
    // Unpatched app returns HTTP 200 OK (FAILS)
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

    // Spec: Returns HTTP 404 Not Found if no submission exists for candidate
    // Unpatched app returns HTTP 200 OK with body null (FAILS)
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

    // Spec: Identical addresses match 4/4 fields yielding 100%
    // Unpatched app divides by 3 instead of 4, yielding 133% (FAILS)
    assert.equal(
      data.matchPercent,
      100,
      `Expected matchPercent to be 100 for identical addresses, but got ${data.matchPercent}`
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
    };

    const res = await fetch(`${BASE_URL}/api/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payloadWithoutFlag)
    });

    const data = await res.json();

    // Spec: sameAsPermanent defaults to false if omitted
    // Unpatched app defaults to true (FAILS)
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

    const postRes = await fetch(`${BASE_URL}/api/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    assert.ok(postRes.status >= 200 && postRes.status < 300, 'POST request should succeed');

    const listRes = await fetch(`${BASE_URL}/api/address`);
    const submissions = await listRes.json();

    // Spec: stores submission in-memory and lists it in GET /api/address
    // Unpatched app fails to persist store across requests without session (FAILS)
    const found = submissions.some((s) => s.candidateId === candidateId);
    assert.ok(
      found,
      `Expected candidateId ${candidateId} to be persisted in GET /api/address, but it was not found`
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

    await fetch(`${BASE_URL}/api/address`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    const res = await fetch(`${BASE_URL}/api/address/${candidateId}`);
    const data = await res.json();

    // Spec: Returns 200 with submission object if found
    // Unpatched app returns 200 with null body because submission is not persisted (FAILS)
    assert.ok(
      data && data.candidateId === candidateId,
      `Expected GET /api/address/${candidateId} to return submission for candidate ${candidateId}, but got ${JSON.stringify(data)}`
    );
  });

});
