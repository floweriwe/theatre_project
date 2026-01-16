# Security Audit Report

**Date:** 2026-01-16
**Project:** Theatre Management System
**Auditor:** Automated Security Scan + Manual Review

---

## Executive Summary

Security audit completed for both frontend (npm) and backend (pip) dependencies.
All High and Critical vulnerabilities have been addressed.

| Category | Before | After | Status |
|----------|--------|-------|--------|
| npm High/Critical | 2 | 0 | FIXED |
| npm Moderate | 2 | 0 | FIXED |
| pip High/Critical | 0 | 0 | CLEAN |
| pip Informational | 1 | 1 | MITIGATED |

---

## Frontend (npm) Vulnerabilities - FIXED

### 1. pdfjs-dist - Arbitrary JavaScript Execution (HIGH)

**CVE:** GHSA-wgrm-67xf-hhpq
**Severity:** HIGH
**Affected:** pdfjs-dist <= 4.1.392
**Status:** FIXED

**Description:** PDF.js vulnerable to arbitrary JavaScript execution upon opening a malicious PDF.

**Resolution:** Removed `@types/react-pdf` devDependency which depended on vulnerable pdfjs-dist@2.16.105. The `react-pdf@10.3.0` package has built-in TypeScript types and uses pdfjs-dist@5.4.296 which is not affected.

**Changes:**
- Removed `"@types/react-pdf": "^6.2.0"` from devDependencies
- react-pdf@10.3.0 uses pdfjs-dist@5.4.296 (safe version)

---

### 2. esbuild/vite - Development Server Request Forgery (MODERATE)

**CVE:** GHSA-67mh-4wv8-2f99
**Severity:** MODERATE
**Affected:** esbuild <= 0.24.2, vite 0.11.0 - 6.1.6
**Status:** FIXED

**Description:** esbuild enables any website to send any requests to the development server and read the response.

**Resolution:** Updated vite and @vitejs/plugin-react to versions that include patched esbuild.

**Changes in package.json:**
```json
// Before
"@vitejs/plugin-react": "^4.3.1",
"vite": "^5.4.0"

// After
"@vitejs/plugin-react": "^5.1.2",
"vite": "^6.2.1"
```

**Note:** vite@6.2.1 uses esbuild@^0.25.0 which contains the security fix.

---

## Backend (pip) Vulnerabilities - MITIGATED

### 1. ecdsa - Minerva Timing Attack (INFORMATIONAL)

**CVE:** CVE-2024-23342
**Severity:** MEDIUM (in general), NOT APPLICABLE (for this project)
**Affected:** ecdsa 0.19.1 (all versions)
**Status:** NOT EXPLOITABLE - No Fix Available

**Description:** python-ecdsa is subject to a Minerva timing attack on the P-256 curve. Using the `sign_digest()` API and timing signatures, an attacker can leak the internal nonce which may allow private key discovery.

**Why This Does NOT Affect the Theatre Project:**

1. **Algorithm Used:** The project uses HS256 (HMAC-SHA256), which is a symmetric algorithm. ECDSA is only used for asymmetric EC algorithms (ES256, ES384, ES512).

2. **Cryptography Backend:** The project installs `python-jose[cryptography]`, which means EC operations use the `cryptography` library instead of the vulnerable `ecdsa` library.

3. **No EC Keys:** The JWT implementation only uses symmetric HMAC signing with a shared secret key. No elliptic curve keys are generated or used.

**Evidence:**
```python
# app/config.py
ALGORITHM: str = "HS256"  # HMAC-SHA256, not ECDSA
```

**Mitigation:** The ecdsa package is a transitive dependency that is installed but never used in this codebase. The vulnerability cannot be exploited.

**Future Recommendation:** Consider migrating from `python-jose` to `PyJWT` to eliminate the unnecessary ecdsa dependency entirely. This is a low-priority enhancement.

---

## Input Validation Review

### Pydantic Schema Analysis

All Pydantic schemas were reviewed for proper input validation. Key findings:

**Positive Findings:**
- All string fields have `max_length` constraints
- Email validation implemented with regex pattern
- Password fields have `min_length` and `max_length` constraints
- Numeric fields use `ge` (greater than or equal) constraints where appropriate
- `str_strip_whitespace=True` enabled in BaseSchema to prevent whitespace attacks

**Schema Files Reviewed:**
- `backend/app/schemas/auth.py` - Login/Register validation OK
- `backend/app/schemas/user.py` - User CRUD validation OK
- `backend/app/schemas/inventory.py` - Inventory validation OK
- `backend/app/schemas/document.py` - Document validation OK
- `backend/app/schemas/performance.py` - Performance validation OK
- `backend/app/schemas/schedule.py` - Schedule validation OK

### SQL Injection Prevention

The project uses SQLAlchemy ORM with parameterized queries throughout. No raw SQL queries were found that could be vulnerable to SQL injection.

---

## Files Modified

1. `frontend/package.json` - Updated dependencies to fix npm vulnerabilities
2. `frontend/package-lock.json` - Regenerated with secure versions
3. `frontend/src/components/documents/PDFViewer.tsx` - Fixed CSS import paths for vite 6.x compatibility

---

## Verification Commands

```bash
# Frontend verification
cd frontend && npm audit
# Expected: found 0 vulnerabilities

# Backend verification
docker-compose -f docker-compose.dev.yml exec backend pip-audit
# Expected: 1 informational (ecdsa - not exploitable)
```

---

## Recommendations

### Immediate (Completed)
- [x] Update vite to ^6.2.1
- [x] Update @vitejs/plugin-react to ^5.1.2
- [x] Remove @types/react-pdf (react-pdf has built-in types)

### Future Enhancements (Low Priority)
- [ ] Consider migrating from python-jose to PyJWT to remove ecdsa dependency
- [ ] Add npm audit and pip-audit to CI/CD pipeline
- [ ] Implement Dependabot or similar for automated dependency updates

---

## OWASP Top 10 Coverage

| OWASP Category | Status | Notes |
|----------------|--------|-------|
| A01:2021 Broken Access Control | Covered | JWT-based auth with Redis blacklist |
| A02:2021 Cryptographic Failures | Covered | bcrypt for passwords, HS256 for JWT |
| A03:2021 Injection | Covered | SQLAlchemy ORM, Pydantic validation |
| A04:2021 Insecure Design | N/A | Design review not in scope |
| A05:2021 Security Misconfiguration | Partial | Recommend security headers review |
| A06:2021 Vulnerable Components | Fixed | Dependencies updated |
| A07:2021 Authentication Failures | Covered | Strong password policy, token expiry |
| A08:2021 Data Integrity Failures | N/A | Not in scope |
| A09:2021 Security Logging | Partial | Recommend audit logging |
| A10:2021 SSRF | N/A | No external URL fetching identified |

---

## Conclusion

The security audit identified and resolved all High and Critical vulnerabilities in project dependencies. The one remaining informational finding (ecdsa) does not affect the project as the vulnerable code path is never executed. The codebase demonstrates good security practices with proper input validation and parameterized database queries.
