# 🧪 Exhaustive ZATCA Test Cases - Bank of Jordan

This document provides the exhaustive test suite for verifying the Z3C Integration against the ZATCA Sandbox environment.

---

## 🏗️ Phase 1: Onboarding & Connectivity

| ID | Scenario | Input | Expected Output |
| :--- | :--- | :--- | :--- |
| **TC-1.1** | Valid OTP Handshake | Valid 6-digit OTP | HTTP 200, Binary Token issued, Step: `compliance_requested` |
| **TC-1.2** | Expired OTP Handshake | 1-hour old OTP | HTTP 401/400, Message: `Invalid-OTP` |
| **TC-1.3** | Malformed CSR | Corrupted ASN.1 string | HTTP 400, Message: `Invalid-Request` |

---

## 🏗️ Phase 2: Compliance Suite (The "6-Document" Test)

These 6 tests are executed sequentially by the **ZATCA Compliance Suite Runner**.

| ID | Document Type | Key Rule to Verify | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-2.1** | Standard Invoice (B2B) | Clearance Header, PIH Chaining | `CLEARED` |
| **TC-2.2** | Standard Credit Note | BillingReference to Original INV | `CLEARED` |
| **TC-2.3** | Standard Debit Note | Correct Sign for Adjustment | `CLEARED` |
| **TC-2.4** | Simplified Invoice (B2C) | Reporting Status, QR Code Integrity | `REPORTED` |
| **TC-2.5** | Simplified Credit Note | Reporting Status | `REPORTED` |
| **TC-2.6** | Simplified Debit Note | Reporting Status | `REPORTED` |

---

## 🏗️ Phase 3: Business Rule Edge Cases

| ID | Scenario | Business Rule | Expected ZATCA Behavior |
| :--- | :--- | :--- | :--- |
| **TC-3.1** | Negative Unit Price | **BR-KSA-26** | **REJECTED**: Price must be positive. |
| **TC-3.2** | Invalid VAT Number | **BR-KSA-31** | **REJECTED**: Must match 15-digit pattern. |
| **TC-3.3** | Supply Date in Future | **BR-KSA-03** | **WARNING**: Supply date cannot be in future. |
| **TC-3.4** | Duplicate UUID | **BR-KSA-UUID** | **REJECTED**: UUID must be unique per session. |

---

## 🏗️ Phase 4: Production Trade-in

| ID | Scenario | Prerequisites | Expected Result |
| :--- | :--- | :--- | :--- |
| **TC-4.1** | Finalize Production | Passed all TC-2.x tests | Production Certificate Issued |
| **TC-4.2** | Unauthorized Finalize | One or more TC-2.x failed | **REJECTED**: Compliance not complete |

---

## 🛠️ Validation Tools
- **ZATCA Emulator**: Used for offline validation.
- **XML C14N Tool**: To verify canonicalized hash strings.
- **Base64 Decode**: To inspect the `binarySecurityToken` OIDs.
