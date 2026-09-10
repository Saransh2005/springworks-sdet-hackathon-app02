import urllib.request
import urllib.error
import json

BASE = "https://sv-qa-02-address-verify.onrender.com"

def req(path, method="GET", data=None):
    url = f"{BASE}{path}"
    headers = {"Content-Type": "application/json"}
    body = json.dumps(data).encode("utf-8") if data is not None else None
    r = urllib.request.Request(url, data=body, headers=headers, method=method)
    try:
        with urllib.request.urlopen(r) as response:
            return response.status, response.read().decode("utf-8")
    except urllib.error.HTTPError as e:
        return e.code, e.read().decode("utf-8")
    except Exception as e:
        return 0, str(e)

print("Resetting data...")
req("/api/reset", "POST")

valid_current = {
    "line1": "12 MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001"
}
valid_perm = {
    "line1": "12 MG Road",
    "city": "Bengaluru",
    "state": "Karnataka",
    "pincode": "560001"
}

# Test 1: POST success status code & return structure
print("\n--- Test 1: Valid POST ---")
status, body = req("/api/address", "POST", {
    "candidateId": 201,
    "current": valid_current,
    "permanent": valid_perm,
    "sameAsPermanent": False
})
print(f"Status: {status}\nBody: {body}")

# Test 2: sameAsPermanent default when omitted
print("\n--- Test 2: sameAsPermanent omitted ---")
status, body = req("/api/address", "POST", {
    "candidateId": 202,
    "current": valid_current,
    "permanent": valid_perm
})
print(f"Status: {status}\nBody: {body}")

# Test 3: sameAsPermanent = True with different permanent
print("\n--- Test 3: sameAsPermanent = True with different permanent ---")
status, body = req("/api/address", "POST", {
    "candidateId": 203,
    "current": valid_current,
    "permanent": {
        "line1": "99 Different Road",
        "city": "Delhi",
        "state": "Delhi",
        "pincode": "110001"
    },
    "sameAsPermanent": True
})
print(f"Status: {status}\nBody: {body}")

# Test 4: sameAsPermanent = True without permanent field
print("\n--- Test 4: sameAsPermanent = True without permanent field ---")
status, body = req("/api/address", "POST", {
    "candidateId": 204,
    "current": valid_current,
    "sameAsPermanent": True
})
print(f"Status: {status}\nBody: {body}")

# Test 5: State not in enum
print("\n--- Test 5: State not in enum ---")
invalid_state = valid_current.copy()
invalid_state["state"] = "Goa"
status, body = req("/api/address", "POST", {
    "candidateId": 205,
    "current": invalid_state,
    "permanent": invalid_state,
    "sameAsPermanent": False
})
print(f"Status: {status}\nBody: {body}")

# Test 6: Pincode starting with 0
print("\n--- Test 6: Pincode starting with 0 (e.g. 056001) ---")
pincode_zero = valid_current.copy()
pincode_zero["pincode"] = "056001"
status, body = req("/api/address", "POST", {
    "candidateId": 206,
    "current": pincode_zero,
    "permanent": pincode_zero,
    "sameAsPermanent": False
})
print(f"Status: {status}\nBody: {body}")

# Test 7: Pincode invalid length/chars
print("\n--- Test 7: Pincode invalid length/chars ---")
for p in ["56000", "5600001", "ABCDEF", " 560001"]:
    c = valid_current.copy()
    c["pincode"] = p
    status, body = req("/api/address", "POST", {
        "candidateId": 207,
        "current": c,
        "permanent": c,
        "sameAsPermanent": False
    })
    print(f"Pincode '{p}' -> Status: {status}, Body: {body}")

# Test 8: Whitespace trimming
print("\n--- Test 8: Whitespace trimming ---")
padded = {
    "line1": "  12 MG Road  ",
    "city": "  Bengaluru  ",
    "state": "Karnataka",
    "pincode": "560001"
}
status, body = req("/api/address", "POST", {
    "candidateId": 208,
    "current": padded,
    "permanent": valid_perm,
    "sameAsPermanent": False
})
print(f"Status: {status}\nBody: {body}")

# Test 9: Blank string or missing fields
print("\n--- Test 9: Blank line1/city ---")
blank_line = valid_current.copy()
blank_line["line1"] = "   "
status, body = req("/api/address", "POST", {
    "candidateId": 209,
    "current": blank_line,
    "permanent": valid_perm,
    "sameAsPermanent": False
})
print(f"Blank line1 '   ' -> Status: {status}, Body: {body}")

blank_line["line1"] = ""
status, body = req("/api/address", "POST", {
    "candidateId": 210,
    "current": blank_line,
    "permanent": valid_perm,
    "sameAsPermanent": False
})
print(f"Empty line1 '' -> Status: {status}, Body: {body}")

# Test 10: Case insensitivity in matchPercent
print("\n--- Test 10: Case insensitivity in matchPercent ---")
lower_c = {
    "line1": "12 mg road",
    "city": "bengaluru",
    "state": "Karnataka",
    "pincode": "560001"
}
upper_p = {
    "line1": "12 MG ROAD",
    "city": "BENGALURU",
    "state": "Karnataka",
    "pincode": "560001"
}
status, body = req("/api/address", "POST", {
    "candidateId": 211,
    "current": lower_c,
    "permanent": upper_p,
    "sameAsPermanent": False
})
print(f"Status: {status}\nBody: {body}")

# Test 11: Partial match percent calculation (1, 2, 3 fields matching)
print("\n--- Test 11: Match percent steps (1, 2, 3 of 4) ---")
for num_match in [0, 1, 2, 3, 4]:
    c = {"line1": "A", "city": "Bengaluru", "state": "Karnataka", "pincode": "560001"}
    p = {"line1": "B", "city": "Delhi", "state": "Delhi", "pincode": "110001"}
    fields = ["line1", "city", "state", "pincode"]
    for i in range(num_match):
        p[fields[i]] = c[fields[i]]
    status, body = req("/api/address", "POST", {
        "candidateId": 300 + num_match,
        "current": c,
        "permanent": p,
        "sameAsPermanent": False
    })
    print(f"Matches {num_match}/4: expected {num_match*25}% -> Status: {status}, Body: {body}")
