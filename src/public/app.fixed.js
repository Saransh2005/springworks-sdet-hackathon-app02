const STATES = [
  "Karnataka",
  "Maharashtra",
  "Delhi",
  "Tamil Nadu",
  "Telangana",
  "Uttar Pradesh",
  "West Bengal",
  "Gujarat",
];

// BUG-02-06 FIX: Include empty placeholder option so no default state is pre-selected
function populateStateDropdown(select) {
  const placeholder = '<option value="" disabled selected>Select a state</option>';
  select.innerHTML = placeholder + STATES.map((s) => `<option value="${s}">${s}</option>`).join("");
}

function showToast(message, type) {
  const toast = document.getElementById("toast");
  toast.textContent = message;
  toast.className = "toast" + (type === "error" ? " error" : "");
  setTimeout(() => toast.classList.add("hidden"), 2500);
}

const sameAsPermanentCheckbox = document.getElementById("same-as-permanent");
const permanentFieldset = document.getElementById("permanent-fieldset");

if (sameAsPermanentCheckbox && permanentFieldset) {
  sameAsPermanentCheckbox.addEventListener("change", () => {
    const checked = sameAsPermanentCheckbox.checked;
    const permanentInputs = permanentFieldset.querySelectorAll("input, select");
    permanentInputs.forEach((el) => (el.disabled = checked));

    if (checked) {
      document.getElementById("permanent-line1").value = document.getElementById("current-line1").value;
      document.getElementById("permanent-city").value = document.getElementById("current-city").value;
      document.getElementById("permanent-state").value = document.getElementById("current-state").value;
      document.getElementById("permanent-pincode").value = document.getElementById("current-pincode").value;
    }
  });
}

function escapeHtml(str) {
  return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function renderSubmissions(list) {
  const tbody = document.getElementById("submissions-tbody");
  if (!tbody) return;
  tbody.innerHTML = list
    .map((s) => {
      const cur = s.current || {};
      const perm = s.permanent || {};
      return `
        <tr>
          <td>${s.candidateId}</td>
          <td>${escapeHtml(cur.line1 ?? "")}, ${escapeHtml(cur.city ?? "")}, ${escapeHtml(cur.state ?? "")} - ${escapeHtml(cur.pincode ?? "")}</td>
          <td>${escapeHtml(perm.line1 ?? "")}, ${escapeHtml(perm.city ?? "")}, ${escapeHtml(perm.state ?? "")} - ${escapeHtml(perm.pincode ?? "")}</td>
          <td>${s.sameAsPermanent ? "Yes" : "No"}</td>
          <td>${s.matchPercent}%</td>
          <td>${s.createdAt}</td>
        </tr>`;
    })
    .join("");
}

async function loadSubmissions() {
  try {
    const res = await fetch("/api/address");
    const data = await res.json();
    if (Array.isArray(data) && data.length > 0) {
      renderSubmissions(data);
    }
  } catch (err) {
    console.warn("Could not load submissions:", err);
  }
}

const addressForm = document.getElementById("address-form");
if (addressForm) {
  addressForm.addEventListener("submit", async (e) => {
    e.preventDefault();

    const candidateId = parseInt(document.getElementById("candidateId").value, 10);
    const sameAsPermanent = sameAsPermanentCheckbox ? sameAsPermanentCheckbox.checked : false;

    const current = {
      line1: document.getElementById("current-line1")?.value || "",
      city: document.getElementById("current-city")?.value || "",
      state: document.getElementById("current-state")?.value || "",
      pincode: document.getElementById("current-pincode")?.value || "",
    };
    const permanent = {
      line1: document.getElementById("permanent-line1")?.value || "",
      city: document.getElementById("permanent-city")?.value || "",
      state: document.getElementById("permanent-state")?.value || "",
      pincode: document.getElementById("permanent-pincode")?.value || "",
    };

    const res = await fetch("/api/address", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ candidateId, current, permanent, sameAsPermanent }),
    });

    // BUG-02-05 FIX: Guard feedback by checking HTTP response status
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      showToast(errData.error || "Failed to submit address", "error");
      return;
    }

    const created = await res.json().catch(() => null);
    showToast("Address submitted successfully", "success");

    // BUG-02-12 FIX: Immediately append new row to submitted addresses table
    if (created) {
      const tbody = document.getElementById("submissions-tbody");
      if (tbody) {
        const cur = created.current || {};
        const perm = created.permanent || {};
        const rowHtml = `
          <tr>
            <td>${created.candidateId}</td>
            <td>${escapeHtml(cur.line1 ?? "")}, ${escapeHtml(cur.city ?? "")}, ${escapeHtml(cur.state ?? "")} - ${escapeHtml(cur.pincode ?? "")}</td>
            <td>${escapeHtml(perm.line1 ?? "")}, ${escapeHtml(perm.city ?? "")}, ${escapeHtml(perm.state ?? "")} - ${escapeHtml(perm.pincode ?? "")}</td>
            <td>${created.sameAsPermanent ? "Yes" : "No"}</td>
            <td>${created.matchPercent}%</td>
            <td>${created.createdAt}</td>
          </tr>`;
        tbody.insertAdjacentHTML("beforeend", rowHtml);
      }
    }

    loadSubmissions();
  });
}

const resetBtn = document.getElementById("reset-data-btn");
if (resetBtn) {
  resetBtn.addEventListener("click", async () => {
    await fetch("/api/reset", { method: "POST" });
    loadSubmissions();
    showToast("Data reset", "success");
  });
}

const curState = document.getElementById('current-state');
if (curState) populateStateDropdown(curState);
const permState = document.getElementById('permanent-state');
if (permState) populateStateDropdown(permState);
loadSubmissions();
