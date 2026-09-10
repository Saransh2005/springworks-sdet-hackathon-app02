const express = require("express");
const path = require("path");

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

const PORT = process.env.PORT || 3002;

app.use(express.json());
const { makeSeed } = require('./data');

let globalFixedStore = makeSeed();
app.use((req, res, next) => {
  req.store = globalFixedStore;
  req.resetStore = () => {
    globalFixedStore = makeSeed();
    req.store = globalFixedStore;
  };
  next();
});
app.use(express.static(path.join(__dirname, "public")));

// BUG-02-08 FIX: strict 6-digit pincode boundary
const PINCODE_REGEX = /^[1-9][0-9]{5}$/;

// BUG-02-10 FIX: allowed state enum validation
const ALLOWED_STATES = [
  "Karnataka",
  "Maharashtra",
  "Delhi",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
  "Gujarat",
];

// BUG-02-03 FIX: matchPercent divides by 4 (not 3)
function computeMatchPercent(current, permanent) {
  const fields = ["line1", "city", "state", "pincode"];
  let matches = 0;
  for (const f of fields) {
    if ((current[f] || "").toLowerCase() === (permanent[f] || "").toLowerCase()) {
      matches++;
    }
  }
  return Math.round((matches / 4) * 100);
}

function validateAddress(addr) {
  if (!addr) return "Address is required";
  if (!addr.line1 || !addr.line1.trim()) return "line1 is required";
  // BUG-02-04 FIX: city is required
  if (!addr.city || !addr.city.trim()) return "city is required";
  if (!addr.state || !addr.state.trim()) return "state is required";
  // BUG-02-10 FIX: state enum check
  if (!ALLOWED_STATES.includes(addr.state.trim())) return "Invalid state";
  // BUG-02-08 FIX: pincode exact 6 digits
  if (!addr.pincode || !PINCODE_REGEX.test(addr.pincode)) return "Invalid pincode";
  return null;
}

app.get("/api/address", (req, res) => {
  res.json(req.store.submissions);
});

app.get("/api/address/:candidateId", (req, res) => {
  const candidateId = parseInt(req.params.candidateId, 10);
  const found = req.store.submissions.find((s) => s.candidateId === candidateId);
  // BUG-02-02 FIX: return HTTP 404 when candidate is not found
  if (!found) {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json(found);
});

app.post("/api/address", (req, res) => {
  const body = req.body || {};
  const candidateId = body.candidateId;

  // BUG-02-04 FIX: candidateId is required and must be valid
  if (!candidateId) {
    return res.status(400).json({ error: "candidateId is required" });
  }

  let current = body.current;
  if (!current) {
    return res.status(400).json({ error: "current address is required" });
  }

  // BUG-02-11 FIX: sameAsPermanent defaults to false if omitted
  let sameAsPermanent = body.sameAsPermanent;
  if (sameAsPermanent === undefined || sameAsPermanent === null) {
    sameAsPermanent = false;
  }

  // BUG-02-15 FIX: Trim leading and trailing whitespace before storage and comparison
  current = {
    line1: current.line1 ? current.line1.trim() : "",
    city: current.city ? current.city.trim() : "",
    state: current.state ? current.state.trim() : "",
    pincode: current.pincode ? current.pincode.trim() : "",
  };

  const currentError = validateAddress(current);
  if (currentError) {
    return res.status(400).json({ error: currentError });
  }

  let permanent = body.permanent;
  if (sameAsPermanent) {
    // If sameAsPermanent is true, permanent is derived as an exact copy of current
    permanent = { ...current };
  } else {
    if (!permanent) {
      return res.status(400).json({ error: "permanent address is required when sameAsPermanent is false" });
    }
    permanent = {
      line1: permanent.line1 ? permanent.line1.trim() : "",
      city: permanent.city ? permanent.city.trim() : "",
      state: permanent.state ? permanent.state.trim() : "",
      pincode: permanent.pincode ? permanent.pincode.trim() : "",
    };
    const permanentError = validateAddress(permanent);
    if (permanentError) {
      return res.status(400).json({ error: permanentError });
    }
  }

  const record = {
    id: req.store.nextSubmissionId++,
    candidateId,
    current,
    permanent,
    sameAsPermanent,
    matchPercent: computeMatchPercent(current, permanent),
    createdAt: new Date().toISOString(),
  };

  // BUG-02-13 & BUG-02-14 FIX: Persist submission to in-memory store
  req.store.submissions.push(record);

  // BUG-02-01 FIX: Return HTTP 201 Created on creation
  res.status(201).json(record);
});

app.post("/api/reset", (req, res) => {
  req.resetStore();
  res.json({ ok: true });
});

if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`[FIXED-APP] server listening on http://localhost:${PORT}`);
  });
}

module.exports = app;
