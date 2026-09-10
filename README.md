# Springworks SDET Internship Hackathon — Defect Test Suite (App 02)

**Candidate:** Saransh Singh  
**Email:** `saranshchaudhary888@gmail.com`  
**Assigned Application:** [App 02 — Digital Address Verification](https://sv-qa-02-address-verify.onrender.com)  
**Hackathon Score / Standing:** **26 Points / 15 Bugs Found (100% Solved — Rank #1 on Leaderboard)**  

---

## 1. Project Overview

This repository contains the automated test suite developed for **Phase 2** of the Springworks SDET Hackathon. Per the guidelines, each test in this suite asserts the expected behavior defined in the official specification (`/spec`) and **intentionally fails against the application as it currently is**, mathematically and programmatically proving the existence of each defect.

---

## 2. Defect Coverage Matrix (15 / 15 Defects — 100% Complete)

| Bug ID | Component | Defect Type | Spec Requirement | Actual Flawed Behavior | Test Name in Suite |
|---|---|---|---|---|---|
| **BUG-02-01** | API | `wrong-status-code` | Returns `201 Created` on creation | Returns `200 OK` | `BUG-02-01: POST /api/address should return HTTP 201 Created` |
| **BUG-02-02** | API | `wrong-status-code` | Returns `404 Not Found` for missing candidate | Returns `200 OK` with `null` body | `BUG-02-02: GET /api/address/:candidateId should return HTTP 404` |
| **BUG-02-03** | API | `wrong-arithmetic` | `matchPercent` = `(matches / 4) * 100` | Divides by 3 (`(matches / 3) * 100` = 133%) | `BUG-02-03: POST /api/address should calculate matchPercent as (matches / 4) * 100` |
| **BUG-02-04** | API | `missing-required-field` | Returns `400 Bad Request` if `city` or `candidateId` missing | Returns `200 OK` | `BUG-02-04: POST /api/address should return HTTP 400 when city is missing` |
| **BUG-02-05** | UI | `missing-ui-feedback-guard` | Shows error toast on failed submission | Unconditionally shows success toast | `BUG-02-05: UI should display an error toast on API failure` |
| **BUG-02-06** | UI | `wrong-dropdown-default-selection` | State dropdowns require explicit choice (no default) | "Karnataka" is pre-selected by default | `BUG-02-06: State dropdowns should require an explicit choice` |
| **BUG-02-07** | UI | `wrong-format-display` | Match % displayed with `%` symbol | Displays raw number without `%` | `BUG-02-07: Submitted Addresses table should display match percentage with "%"` |
| **BUG-02-08** | API | `off-by-one-boundary` | Pincode must be exactly 6 digits `/^[1-9][0-9]{5}$/` | Accepts 5-digit pincodes (boundary check defect) | `BUG-02-08: POST /api/address should enforce strict 6-digit boundary for pincode` |
| **BUG-02-10** | API | `missing-enum-validation` | State must be in 8 allowed states enum | Accepts arbitrary states like `"Goa"` | `BUG-02-10: POST /api/address should return HTTP 400 when state is not in enum` |
| **BUG-02-11** | API | `wrong-persisted-default` | `sameAsPermanent` defaults to `false` when omitted | Defaults to `true` | `BUG-02-11: POST /api/address should default sameAsPermanent to false` |
| **BUG-02-12** | UI | `state-not-persisted` | Submitted address list gains a new row on successful submit | Table row is not appended / lost on reload | `BUG-02-12: UI submitted-addresses table should gain a new row on successful form submission` |
| **BUG-02-13** | API | `state-not-persisted` | Submissions stored and retrievable via `GET /api/address` | Submissions are never persisted | `BUG-02-13: POST /api/address should persist newly submitted address` |
| **BUG-02-14** | API | `state-not-persisted` | Submissions stored and retrievable via `GET /api/address/:candidateId` | Returns `null` for newly posted candidates | `BUG-02-14: GET /api/address/:candidateId should return newly submitted candidate address` |
| **BUG-02-15** | API | `missing-sanitization` | Surrounding whitespace trimmed before storage/comparison | Stores untrimmed whitespace | `BUG-02-15: POST /api/address should trim leading and trailing whitespace` |
| **BUG-02-19** | UI | `missing-sanitization` | `line1` escaped with `escapeHtml()` before rendering | Rendered unescaped into `innerHTML` (XSS) | `BUG-02-19: Address Line 1 should be sanitized with escapeHtml()` |

---

## 3. How to Run the Tests

### Prerequisites
- Node.js (v18+ or v20+)
- npm

### Installation
```bash
npm install
```

### Running All 15 Defect Verification Tests
```bash
npm test
```
*Note: As expected by the Phase 2 specification, all 15 tests will **FAIL** against the unpatched application, programmatically proving every single planted bug.*

### Running Subsets
```bash
# Run only API defect tests (10 tests)
npm run test:api

# Run only UI defect tests (5 tests)
npm run test:ui
```

### Testing Against a Local Server
To test against a locally running instance:
```bash
APP_URL=http://localhost:3000 npm test
```

---

## 4. Tools Used (Required for Submission)

- **Node.js Test Runner (`node:test` and `node:assert`)**: High-performance, zero-dependency native test framework for API contract verification.
- **JSDOM**: Headless DOM simulation environment used to test frontend logic, event handlers, HTML escaping, and UI feedback guards without requiring a heavy browser daemon.
- **Python (`urllib.request`)**: Automated exploratory probing and payload permutation generation during Phase 1.
- **Antigravity AI (Google DeepMind)**: Assisted with systematic combinatorial probing, defect triage, root-cause code analysis, and test suite scaffolding.
- **Git & GitHub**: Version control and artifact tracking.

---

## 5. Bonus: How the Defects Can Be Fixed

1. **`BUG-02-01`**: In `server.js`, change `res.status(200).json(...)` to `res.status(201).json(...)`.
2. **`BUG-02-02`**: In `server.js`, return `res.status(404).json({ error: "Not found" })` when `!submission` instead of `res.json(null)`.
3. **`BUG-02-03`**: Change the match calculation from `Math.round((matches / 3) * 100)` to `Math.round((matches / 4) * 100)`.
4. **`BUG-02-04`**: Add validation for `!current.city` and `!candidateId`, returning `res.status(400).json({ error: "city and candidateId are required" })`.
5. **`BUG-02-05`**: In `app.js`, check `if (!res.ok) { showToast(err.error || "Submission failed", "error"); return; }` before showing the success toast.
6. **`BUG-02-06`**: In `app.js`, add `<option value="" disabled selected>Select a state</option>` before mapping `STATES`.
7. **`BUG-02-07`**: In `app.js` `renderSubmissions()`, change `<td>${s.matchPercent}</td>` to `<td>${s.matchPercent}%</td>`.
8. **`BUG-02-08`**: In `server.js`, validate pincode strictly with `/^[1-9][0-9]{5}$/` and `pincode.length === 6`.
9. **`BUG-02-10`**: Add enum validation: `if (!ALLOWED_STATES.includes(current.state)) return res.status(400).json({ error: "Invalid state" })`.
10. **`BUG-02-11`**: Default `sameAsPermanent = Boolean(req.body.sameAsPermanent ?? false)`.
11. **`BUG-02-12`**: In `app.js`, append newly created submission row directly to the table upon successful POST.
12. **`BUG-02-13`**: Persist new submission: `submissions.push(newSubmission)`.
13. **`BUG-02-14`**: In `GET /api/address/:candidateId`, search the updated in-memory array containing all submissions.
14. **`BUG-02-15`**: Trim string fields: `line1 = line1.trim()`, `city = city.trim()`, `state = state.trim()`.
15. **`BUG-02-19`**: In `app.js`, wrap `cur.line1` and `perm.line1` in `escapeHtml()`.
