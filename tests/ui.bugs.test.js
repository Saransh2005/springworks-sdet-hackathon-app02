import { test, describe, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { JSDOM } from 'jsdom';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
const appJsCode = fs.readFileSync(path.resolve(__dirname, '../app.js'), 'utf-8');

describe('Springworks SDET Bug Verification Test Suite — UI Defects', () => {
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

    // Provide mock fetch before executing app.js
    window.fetch = async () => ({
      ok: true,
      json: async () => []
    });

    // Execute app.js in the DOM window context
    window.eval(appJsCode);
  });

  // BUG-02-05: missing-ui-feedback-guard on form submission
  test('BUG-02-05: UI should display an error toast (not success) when API returns HTTP 400 error', async () => {
    const toast = document.getElementById('toast');

    // Mock fetch to simulate API validation error (HTTP 400)
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

    // Fill form inputs
    document.getElementById('candidateId').value = '101';
    document.getElementById('current-line1').value = '12 MG Road';
    document.getElementById('current-city').value = 'Bengaluru';
    document.getElementById('current-pincode').value = '012345'; // Invalid pincode

    // Dispatch form submit
    const form = document.getElementById('address-form');
    const submitEvent = new window.Event('submit', { cancelable: true });
    form.dispatchEvent(submitEvent);

    // Wait for async fetch to settle
    await new Promise((r) => setTimeout(r, 50));

    // Spec: On submit: a success message is shown only when the submission actually succeeds;
    // a failed submission shows an error message instead
    // Currently, it unconditionally calls showToast("Address submitted successfully", "success") (FAILS)
    const isErrorToast = toast.classList.contains('error');
    const message = toast.textContent;

    assert.ok(
      isErrorToast && !message.includes('successfully'),
      `Expected error toast message on API failure, but got text "${message}" with classes "${toast.className}"`
    );
  });

  // BUG-02-06: wrong-dropdown-default-selection
  test('BUG-02-06: State dropdowns should require an explicit choice with no default state pre-selected', () => {
    const currentStateSelect = document.getElementById('current-state');
    const permanentStateSelect = document.getElementById('permanent-state');

    // Spec: The state dropdowns require an explicit choice — no state should be pre-selected by default.
    // Currently, the first state "Karnataka" is pre-selected by default (FAILS)
    assert.equal(
      currentStateSelect.value,
      '',
      `Expected current state dropdown to have no pre-selected state (empty default), but found "${currentStateSelect.value}"`
    );
    assert.equal(
      permanentStateSelect.value,
      '',
      `Expected permanent state dropdown to have no pre-selected state (empty default), but found "${permanentStateSelect.value}"`
    );
  });

  // BUG-02-07: wrong-format-display for match percentage in table
  test('BUG-02-07: Submitted Addresses table should display match percentage with "%" symbol', () => {
    const sampleSubmissions = [
      {
        id: 1,
        candidateId: 101,
        current: { line1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        permanent: { line1: '12 MG Road', city: 'Bengaluru', state: 'Karnataka', pincode: '560001' },
        sameAsPermanent: true,
        matchPercent: 100,
        createdAt: '2026-07-01T09:00:00.000Z'
      }
    ];

    // Call renderSubmissions with sample submission
    window.renderSubmissions(sampleSubmissions);

    const tbody = document.getElementById('submissions-tbody');
    const row = tbody.querySelector('tr');
    assert.ok(row, 'Table row should be rendered');

    const cells = row.querySelectorAll('td');
    const matchPercentCellText = cells[4]?.textContent?.trim();

    // Spec: the match percentage (shown with a % sign)
    // Currently renders "100" without "%" (FAILS)
    assert.equal(
      matchPercentCellText,
      '100%',
      `Expected match percentage cell to be formatted as "100%", but got "${matchPercentCellText}"`
    );
  });

  // BUG-02-19: missing-sanitization / XSS in renderSubmissions
  test('BUG-02-19: Address Line 1 should be sanitized with escapeHtml() before rendering to prevent XSS', () => {
    const xssPayload = '<img src=x onerror=alert(1)>';
    const sampleSubmissions = [
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

    // Render submissions
    window.renderSubmissions(sampleSubmissions);

    const tbody = document.getElementById('submissions-tbody');

    // Spec: All user-controlled fields must be properly escaped before rendering into innerHTML
    // Currently, cur.line1 and perm.line1 are unescaped, leaving the raw <img> tag in innerHTML (FAILS)
    const rawHtml = tbody.innerHTML;
    const containsUnescapedTag = rawHtml.includes('<img src="x" onerror="alert(1)">') || rawHtml.includes('<img src=x onerror=alert(1)>');

    assert.ok(
      !containsUnescapedTag,
      `Expected address line1 to be HTML-escaped, but found unescaped HTML tag in tbody: ${rawHtml}`
    );
  });

});
