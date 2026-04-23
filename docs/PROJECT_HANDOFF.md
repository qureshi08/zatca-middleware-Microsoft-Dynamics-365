# 🏁 Project Hand-off: ZATCA Z3C Integration (Bank of Jordan)

This document serves as the ultimate source of truth for the **Z3C (ZATCA Core Connector)** project. Refer to this if chat history is lost or when onboarding new team members/AI agents.

---

## 🏗️ Project Overview
- **Client**: Bank of Jordan (BOJ)
- **Objective**: Full Phase 2 (Integration Phase) compliance for ZATCA (FATOORA).
- **Core Function**: Handling the lifecycle of EGS (Electronic Generating Souls), including identity generation (CSID), automated compliance testing, and live invoice clearance/reporting.

---

## 🛠️ Tech Stack & Infrastructure
- **Framework**: Next.js 16.x (Turbopack) / React / TypeScript.
- **Styling**: Vanilla CSS / Tailwind (Premium Dark Theme).
- **Cryptographic Curve**: **secp256k1** (ECDSA).
- **Compliance Version**: Strictly follows ZATCA **ISB 2.1.0** (Developer Portal Sandbox).

---

## ✅ Major Accomplishments & Features

### 1. The "Cryptographic Handshake" (API 1/6)
- **Status**: **COMPLETE**.
- Built a custom **CSR (Certificate Signing Request)** engine in `csr.ts` that mirrors ZATCA's OID requirements 1:1.
- Successfully implemented the **Compliance CSID API** to exchange OTPs for testing certificates.

### 2. Automated Compliance Suite (API 2/6)
- **Status**: **STABLE / IN PROGRESS**.
- Automated submission of the **6 mandatory ZATCA test documents**:
    - Standard/Simplified Invoices.
    - Standard/Simplified Credit Notes.
    - Standard/Simplified Debit Notes.
- This suite handles PIH (Previous Invoice Hash) chaining and ICV (Invoice Counter Value) automatically.

### 3. XML & QR Engine
- **UBL 2.1 Generator**: `builder.ts`, `standard.ts`, and `simplified.ts`.
- **Phase 2 QR**: Implements the 9-tag TLV encoding (Tags 6-9 contain the hash, signature, public key, and certificate signature).

---

## 🛡️ Critical Technical Fixes (Important!)
These were the most challenging bugs solved. Do **NOT** revert these changes:

1.  **Double-Hashing Bug**: Fixed in `signing.ts`. The system used to hash the SHA-256 digest *again* before signing. Now it signs the raw digest directly as per ZATCA's requirement.
2.  **PIH Encoding**: Fixed in `onboarding.ts`. The Previous Invoice Hash must be **Base64(Hex(SHA256))**. Standard Base64 of the binary digest causes validation failure.
3.  **Positive Totals (BR-KSA-F-04)**: Reverted a brief attempt at negative totals for credit notes. ZATCA requires all monetary amounts in XML to be **positive**. Direction is determined by the `InvoiceTypeCode`.
4.  **Positive Unit Price (BR-KSA-26)**: Logic in `builder.ts` ensures unit prices are never negative, even for discount lines.

---

## 📡 API Roadmap (6 Total - ALL COMPLETED)
1. ✅ **Compliance CSID**: Identity generation & Handshake.
2. ✅ **Compliance Invoice**: Automated 6-document testing suite.
3. ✅ **Production CSID**: Official onboarding and certificate trade-in.
4. ✅ **Clearance API**: Real-time B2B Standard Invoice clearance.
5. ✅ **Reporting API**: 24-hour B2C Simplified Invoice reporting.
6. ✅ **Production CSID (Renewal)**: Automated lifecycle maintenance.

---

## 📁 Repository Structure & Documentation
Primary logic is in `src/lib/zatca/`.

**Documentation Index:**
- [**User Manual**](./USER_MANUAL.md): Guidance for Finance/Admin teams.
- [**Developer Manual**](./DEVELOPER_MANUAL.md): Technical deep-dive.
- [**C4 Architecture**](./C4_ARCHITECTURE.md): Structural diagrams (Context, Container, Component).
- [**Test Cases**](./TEST_CASES.md): Exhaustive list of business scenarios.

---

## 🚦 How to Resume Work
1. Run `cd zatca-einvoicing && npm run dev`.
2. Open `localhost:3000`.
3. Check `zatca-onboarding.json` to verify the current stage of the EGS unit.
4. Use the `Compliance Suite` button in the UI to run validation tests.

---
*Created on: 2026-03-04*  
*Project Status: Milestone 2 Active*
