# Springworks SDET Internship Hackathon — Defect Test Suite (App 02)

**Candidate:** Saransh Singh  
**Email:** `saranshchaudhary888@gmail.com`  
**Assigned Application:** [App 02 — Digital Address Verification](https://sv-qa-02-address-verify.onrender.com)  
**Hackathon Score / Standing:** **26 Points / 15 Bugs Found (100% Solved — Rank #1 on App 02 Leaderboard)**  
**GitHub Repository:** `https://github.com/Saransh2005/springworks-sdet-hackathon-app02`

---

## 1. Project Directory Structure

The repository is organized following standard SDET test engineering architecture:

```text
springworks-sdet-hackathon-saransh/
│
├── README.md                          ← Test suite documentation & submission details
├── package.json                       ← Test runners & dependency definitions
│
├── bug-report/
│   └── bug_report.md                  ← Confirmed 15/15 defect report from Phase 1
│
├── tests/
│   ├── api/
│   │   ├── address.spec.js            ← Endpoints lifecycle, HTTP codes, arithmetic & persistence tests
│   │   └── validation.spec.js         ← Missing fields, pincode boundaries, state enums & trimming tests
│   │
│   └── ui/
│       └── address-ui.spec.js         ← UI form submission, dropdowns, table display, feedback & XSS tests
│
└── src/                               ← Application source code
    ├── server.js                      ← Original unpatched server (reproducing bugs)
    ├── server.fixed.js                ← Bonus: Patched server fixing all 10 API defects
    ├── data.js                        ← Seed data
    ├── isolation.js                   ← Student session isolation middleware
    ├── spec.html                      ← Application specification
    ├── openapi.json                   ← OpenAPI schema definition
    └── public/
        ├── index.html                 ← Application web page
        ├── style.css                  ← Application stylesheet
        ├── report-widget.js           ← Defect reporting widget
        ├── app.js                     ← Original unpatched frontend logic
        └── app.fixed.js               ← Bonus: Patched frontend fixing all 5 UI defects
```

---

## 2. Defect Coverage Matrix (15 / 15 Confirmed Bugs — 100% Coverage)

| Bug ID | Component | Defect Type | Spec Requirement | Actual Flawed Behavior | Test Spec File |
|---|---|---|---|---|---|
| **BUG-02-01** | API | `wrong-status-code` | Returns `201 Created` on creation | Returns `200 OK` | `tests/api/address.spec.js` |
| **BUG-02-02** | API | `wrong-status-code` | Returns `404 Not Found` for missing candidate | Returns `200 OK` with `null` body | `tests/api/address.spec.js` |
| **BUG-02-03** | API | `wrong-arithmetic` | `matchPercent` = `(matches / 4) * 100` | Divides by 3 (`(matches / 3) * 100` = 133%) | `tests/api/address.spec.js` |
| **BUG-02-04** | API | `missing-required-field` | Returns `400 Bad Request` if `city` or `candidateId` missing | Returns `200 OK` | `tests/api/validation.spec.js` |
| **BUG-02-05** | UI | `missing-ui-feedback-guard` | Shows error toast on failed submission | Unconditionally shows success toast | `tests/ui/address-ui.spec.js` |
| **BUG-02-06** | UI | `wrong-dropdown-default-selection` | State dropdowns require explicit choice (no default) | "Karnataka" is pre-selected by default | `tests/ui/address-ui.spec.js` |
| **BUG-02-07** | UI | `wrong-format-display` | Match % displayed with `%` symbol | Displays raw number without `%` (e.g. `100`) | `tests/ui/address-ui.spec.js` |
| **BUG-02-08** | API | `off-by-one-boundary` | Pincode must be exactly 6 digits `/^[1-9][0-9]{5}$/` | Accepts 5-digit pincodes | `tests/api/validation.spec.js` |
| **BUG-02-10** | API | `missing-enum-validation` | State must be in 8 allowed states enum | Accepts arbitrary states like `"Goa"` | `tests/api/validation.spec.js` |
| **BUG-02-11** | API | `wrong-persisted-default` | `sameAsPermanent` defaults to `false` when omitted | Defaults to `true` | `tests/api/address.spec.js` |
| **BUG-02-12** | UI | `state-not-persisted` | Submitted address list gains a new row on successful submit | Table row is not appended on submit | `tests/ui/address-ui.spec.js` |
| **BUG-02-13** | API | `state-not-persisted` | Submissions stored and retrievable via `GET /api/address` | Submissions are not persisted across requests | `tests/api/address.spec.js` |
| **BUG-02-14** | API | `state-not-persisted` | Submissions stored and retrievable via `GET /api/address/:candidateId` | Returns `null` for newly posted candidates | `tests/api/address.spec.js` |
| **BUG-02-15** | API | `missing-sanitization` | Surrounding whitespace trimmed before storage/comparison | Stores untrimmed whitespace | `tests/api/validation.spec.js` |
| **BUG-02-19** | UI | `missing-sanitization` | `line1` escaped with `escapeHtml()` before rendering | Rendered unescaped into `innerHTML` (XSS flaw) | `tests/ui/address-ui.spec.js` |

---

## 3. How to Run the Tests

### Prerequisites
- Node.js (v18+ or v20+)
- npm

### Installation
```bash
npm install
```

---

### Phase 2 Core Requirement: Running Failing Tests (Proving All Defects)
Per the Phase 2 instructions:
> *"Write automated tests that **fail because of those bugs** — each test should prove a defect by failing against the app as it currently is."*

To run all 15 tests against the unpatched application:
```bash
npm test
```
**Output:** All 15 tests will **FAIL** with precise assertion error messages proving each planted bug!

To run test subsets:
```bash
# Run only API tests (10 tests)
npm run test:api

# Run only UI tests (5 tests)
npm run test:ui
```

---

### Phase 2 Optional Bonus: Running Fixed Tests (100% Pass Rate)
Per the Phase 2 instructions:
> *"Bonus (optional): fix the bugs in the app so your tests pass."*

To run the complete test suite against the fixed application code:
```bash
npm run test:fixed
```
**Output:** Automatically launches the patched server (`src/server.fixed.js`), tests against patched frontend logic (`src/public/app.fixed.js`), and **all 15 tests PASS (100% green)**:
```text
# tests 15
# suites 3
# pass 15
# fail 0
```

---

## 4. Tools Used (For Hackathon Submission)

- **Node.js Test Runner (`node:test` & `node:assert/strict`)**: Native, zero-overhead test runner for assertion and lifecycle validation.
- **JSDOM**: Headless DOM environment used to test frontend state, form submission, input validation guards, XSS sanitation, and DOM tables.
- **Python (`urllib.request`)**: Automated exploratory probing and permutation generation during Phase 1 bug discovery.
- **Antigravity AI (Google DeepMind)**: Combinatorial endpoint analysis, automated defect triage, test suite architecture, and patch verification.
- **Git & GitHub**: Source code management and repository submission.

---

## 5. Bonus: Summary of Fixes Implemented

1. **`BUG-02-01`**: In `src/server.fixed.js`, changed `res.status(200).json(...)` to `res.status(201).json(...)`.
2. **`BUG-02-02`**: In `src/server.fixed.js`, returns `res.status(404).json({ error: "Not found" })` when candidate is missing instead of `200` with `null`.
3. **`BUG-02-03`**: In `src/server.fixed.js`, corrected match arithmetic from `(matches / 3) * 100` to `(matches / 4) * 100`.
4. **`BUG-02-04`**: In `src/server.fixed.js`, added validation requiring `candidateId` and `current.city`, returning `400 Bad Request`.
5. **`BUG-02-05`**: In `src/public/app.fixed.js`, added guard checking `!res.ok` to display error toast instead of success on API failures.
6. **`BUG-02-06`**: In `src/public/app.fixed.js`, added `<option value="" disabled selected>Select a state</option>` placeholder so no state is pre-selected.
7. **`BUG-02-07`**: In `src/public/app.fixed.js`, formatted table cell with `%` symbol: `<td>${s.matchPercent}%</td>`.
8. **`BUG-02-08`**: In `src/server.fixed.js`, enforced strict 6-digit regex `/^[1-9][0-9]{5}$/` to reject 5-digit and 7-digit pincodes.
9. **`BUG-02-10`**: In `src/server.fixed.js`, added enum validation rejecting unlisted states (e.g., "Goa") with `400 Bad Request`.
10. **`BUG-02-11`**: In `src/server.fixed.js`, set default `sameAsPermanent = body.sameAsPermanent ?? false`.
11. **`BUG-02-12`**: In `src/public/app.fixed.js`, immediately appended newly created submission row to `#submissions-tbody` upon successful submit.
12. **`BUG-02-13`**: In `src/server.fixed.js`, persisted newly posted submission into `req.store.submissions`.
13. **`BUG-02-14`**: In `src/server.fixed.js`, ensured `GET /api/address/:candidateId` queries the persistent store.
14. **`BUG-02-15`**: In `src/server.fixed.js`, trimmed leading and trailing whitespace on `line1`, `city`, and `state` strings.
15. **`BUG-02-19`**: In `src/public/app.fixed.js`, sanitized `cur.line1` and `perm.line1` with `escapeHtml()` before rendering to table.
