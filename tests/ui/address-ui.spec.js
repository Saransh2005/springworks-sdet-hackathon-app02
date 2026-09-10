import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const htmlPath = path.resolve(__dirname, '../../src/public/index.html');
const appJsPath = process.env.TEST_TARGET === 'fixed'
  ? path.resolve(__dirname, '../../src/public/app.fixed.js')
  : path.resolve(__dirname, '../../src/public/app.js');

const html = fs.readFileSync(htmlPath, 'utf-8');
const appJsCode = fs.readFileSync(appJsPath, 'utf-8');

describe('UI Tests — Address Verification Form & DOM Interactions', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    dom = new JSDOM(html, {
      runScripts: 'dangerously',
      url: 'http://localhost'
    });
    window = dom.window;
    document = window.document;

    // Default mock fetch
    window.fetch = async () => ({
      ok: true,
      json: async () => []
    });

    // Execute the target app script inside the JSDOM window
    window.eval(appJsCode);
  });

  // BUG-02-05: missing-ui-feedback-guard on form submission
  test('BUG-02-05: UI should display an error toast (not success) when API returns HTTP 400 error', async () => {
    const toast = document.getElementById('toast');

    // Simulate API validation error response (HTTP 400)
    window.fetch = async (url, opts) => {
      if (opts && opts.method === 'POST') {
        return {
          ok: false,
          status: 400,
          json: async () => ({ error: 'Invalid pincode' })
        };
      }
      return { ok: true, json: async () => [] };
    };

    document.getElementById('candidateId').value = '101';
    document.getElementById('current-line1').value = '12 MG Road';
    document.getElementById('current-city').value = 'Bengaluru';
    document.getElementById('current-pincode').value = '012345'; // Invalid

    const form = document.getElementById('address-form');
    form.dispatchEvent(new window.Event('submit', { cancelable: true }));

    await new Promise((r) => setTimeout(r, 50));

    // Spec: Success message shown only on actual success; failed submissions show error message
    // Unpatched app unconditionally displays "Address submitted successfully" (FAILS)
    const isError =
      toast.classList.contains('error') ||
      toast.textContent.toLowerCase().includes('error') ||
      toast.textContent.toLowerCase().includes('invalid');

    assert.ok(
      isError,
      `Expected error toast message on API failure, but got text "${toast.textContent}" with classes "${toast.className}"`
    );
  });

  // BUG-02-06: wrong-dropdown-default-selection on state dropdowns
  test('BUG-02-06: State dropdowns should require an explicit choice with no default state pre-selected', () => {
    const curDropdown = document.getElementById('current-state');
    const permDropdown = document.getElementById('permanent-state');

    // Spec: State dropdowns require an explicit choice — no state should be pre-selected by default
    // Unpatched app pre-selects "Karnataka" as first option (FAILS)
    assert.equal(
      curDropdown.value,
      '',
      `Expected current state dropdown to have no pre-selected state (empty default), but found "${curDropdown.value}"`
    );
    assert.equal(
      permDropdown.value,
      '',
      `Expected permanent state dropdown to have no pre-selected state (empty default), but found "${permDropdown.value}"`
    );
  });

  // BUG-02-07: wrong-format-display in match percentage column
  test('BUG-02-07: Submitted Addresses table should display match percentage with "%" symbol', () => {
    const mockData = [
      {
        id: 1,
        candidateId: 101,
        current: { line1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        permanent: { line1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        sameAsPermanent: false,
        matchPercent: 100,
        createdAt: '2026-07-01T09:00:00.000Z'
      }
    ];

    window.renderSubmissions(mockData);

    const tbody = document.getElementById('submissions-tbody');
    const row = tbody.querySelector('tr');
    assert.ok(row, 'Table should have at least one row rendered');

    const cells = row.querySelectorAll('td');
    // Column 5 is matchPercent
    const matchCell = cells[4];

    // Spec: Match percentage displayed with % sign (e.g. 100%)
    // Unpatched app renders raw number "100" without % symbol (FAILS)
    assert.equal(
      matchCell.textContent.trim(),
      '100%',
      `Expected match percentage cell to be formatted as "100%", but got "${matchCell.textContent.trim()}"`
    );
  });

  // BUG-02-19: missing-xss-sanitization on Address Line 1 rendering
  test('BUG-02-19: Address Line 1 should be sanitized with escapeHtml() before rendering to prevent XSS', () => {
    const xssPayload = '<img src="x" onerror="alert(1)">';
    const mockData = [
      {
        id: 1,
        candidateId: 101,
        current: { line1: xssPayload, city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        permanent: { line1: xssPayload, city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        sameAsPermanent: false,
        matchPercent: 100,
        createdAt: '2026-07-01T09:00:00.000Z'
      }
    ];

    window.renderSubmissions(mockData);

    const tbody = document.getElementById('submissions-tbody');

    // Spec: Line 1 must be HTML-escaped using escapeHtml() like other fields
    // Unpatched app leaves cur.line1 unescaped, injecting raw HTML tags into the DOM (FAILS)
    const hasUnescapedHtml = tbody.innerHTML.includes('<img src="x"');
    assert.ok(
      !hasUnescapedHtml,
      `Expected address line1 to be HTML-escaped, but found unescaped HTML tag in tbody: \n${tbody.innerHTML}`
    );
  });

  // BUG-02-12: state-not-persisted on UI
  test('BUG-02-12: UI submitted-addresses table should gain a new row on successful form submission', async () => {
    const candidateId = 912;
    const newSubmission = {
      id: 10,
      candidateId,
      current: { line1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
      permanent: { line1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
      sameAsPermanent: true,
      matchPercent: 100,
      createdAt: '2026-09-10T12:00:00.000Z'
    };

    window.renderSubmissions([]);

    window.fetch = async (url, opts) => {
      if (opts && opts.method === 'POST') {
        return {
          ok: true,
          status: 201,
          json: async () => newSubmission
        };
      }
      return { ok: true, json: async () => [] };
    };

    document.getElementById('candidateId').value = String(candidateId);
    document.getElementById('current-line1').value = '12 MG Road';
    document.getElementById('current-city').value = 'Bengaluru';
    document.getElementById('current-pincode').value = '560001';

    const form = document.getElementById('address-form');
    form.dispatchEvent(new window.Event('submit', { cancelable: true }));

    await new Promise((r) => setTimeout(r, 50));

    // Spec: Submitted-addresses list gains a new row on success
    // Unpatched app does not append row and relies on empty API store (FAILS)
    const tbody = document.getElementById('submissions-tbody');
    const rows = tbody.querySelectorAll('tr');
    assert.ok(
      rows.length > 0,
      `Expected table to gain a row for candidate ${candidateId} after successful submit, but row count is ${rows.length}`
    );
  });

});
