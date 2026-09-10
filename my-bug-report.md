# My bug report — 02

You reported 15 confirmed bugs. For Phase 2, write an automated test that FAILS because of each one — fixing them is an optional bonus.

## 1. GET /api/address/:candidateId — wrong-status-code

Issue: GET /api/address/:candidateId returns HTTP 200 with null when a candidate is not found, instead of returning HTTP 404 Not Found.
Expected vs actual: Expected: HTTP 404 Not Found when candidateId does not exist in the system. Actual: HTTP 200 OK with body null.

## 2. POST /api/address — wrong-arithmetic

Issue: matchPercent calculation divides by 3 instead of 4, producing invalid match percentages such as 133% when all 4 fields match.
Expected vs actual: Expected: matchPercent is calculated over the 4 address fields (matches / 4 * 100), with 4 matches yielding 100%. Actual: matchPercent is calculated as (matches / 3 * 100), yielding 133% when all 4 fields match.

## 3. POST /api/address — wrong-persisted-default

Issue: When sameAsPermanent is omitted in POST /api/address request body, it defaults to true instead of false.
Expected vs actual: Expected: sameAsPermanent defaults to false if omitted in POST /api/address. Actual: The server sets sameAsPermanent to true.

## 4. UI — wrong-dropdown-default-selection

Issue: State dropdowns in the form have Karnataka pre-selected by default instead of requiring an explicit choice.
Expected vs actual: Expected: The state dropdowns require an explicit choice — no state should be pre-selected by default. Actual: Karnataka is pre-selected by default in both current and permanent state dropdowns.

## 5. UI — wrong-format-display

Issue: The match percentage column in the Submitted Addresses table is displayed without a percent symbol (%).
Expected vs actual: Expected: Match percentage is displayed with a % sign (e.g. 100%). Actual: It is displayed as a raw number without a % sign (e.g. 100).

## 6. UI — missing-ui-feedback-guard

Issue: The form submit handler unconditionally displays success toast without checking if the API request succeeded, failing to display error message on failure.
Expected vs actual: Expected: Success message shown only when submission actually succeeds, and failed submissions show an error message. Actual: UI always shows Address submitted successfully even when API returns 400.

## 7. POST /api/address — wrong-status-code

Issue: POST /api/address returns HTTP 200 OK instead of HTTP 201 Created upon successful creation of an address submission.
Expected vs actual: Expected: HTTP 201 Created per the specification. Actual: HTTP 200 OK is returned.

## 8. POST /api/address — state-not-persisted

Issue: POST /api/address does not persist the newly created address submission to the database/in-memory store, so it cannot be retrieved by GET /api/address or GET /api/address/:candidateId.
Expected vs actual: Expected: Newly submitted address is stored and appears in GET /api/address and GET /api/address/:candidateId. Actual: Submission is not persisted; GET /api/address continues to return only initial seed data.

## 9. POST /api/address — missing-enum-validation

Issue: POST /api/address accepts invalid state values (such as Goa) without validating against the allowed enum of states specified in the spec.
Expected vs actual: Expected: State must be validated against the 8 allowed states (Karnataka, Maharashtra, Delhi, Tamil Nadu, Telangana, Uttar Pradesh, West Bengal, Gujarat) returning 400 if invalid. Actual: Any state string is accepted.

## 10. UI — missing-sanitization

Issue: Address line 1 (cur.line1 and perm.line1) is rendered directly into innerHTML in renderSubmissions without escapeHtml(), leaving it vulnerable to XSS.
Expected vs actual: Expected: All address fields rendered in the table should be sanitized using escapeHtml(). Actual: line1 is inserted raw without escapeHtml().

## 11. POST /api/address — missing-required-field

Issue: POST /api/address does not validate that required fields such as city or candidateId are present, returning HTTP 200 when they are missing instead of HTTP 400.
Expected vs actual: Expected: HTTP 400 error when required fields (like city or candidateId) are missing. Actual: Request succeeds with HTTP 200.

## 12. POST /api/address — missing-sanitization

Issue: POST /api/address fails to trim surrounding whitespace from string fields (line1, city, state) before storage and comparison.
Expected vs actual: Expected: Surrounding whitespace in line1, city, and state is trimmed before storage and comparison. Actual: Untrimmed strings with whitespace are stored and compared directly.

## 13. POST /api/address — off-by-one-boundary

Issue: Pincode boundary check has an off-by-one error, accepting pincodes of incorrect length.
Expected vs actual: Expected: Pincode must be exactly 6 digits. Actual: Off-by-one boundary check accepts pincodes of other lengths.

## 14. UI — state-not-persisted

Issue: Bug relating to state-not-persisted on UI
Expected vs actual: Expected proper state-not-persisted handling on UI per spec

## 15. GET /api/address/:candidateId — state-not-persisted

Issue: state-not-persisted on GET /api/address/:candidateId
Expected vs actual: Expected proper behavior per spec for state-not-persisted on GET /api/address/:candidateId

