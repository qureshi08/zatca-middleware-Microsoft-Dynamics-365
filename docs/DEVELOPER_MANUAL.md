# 🛠️ ZATCA Integration Developer Manual - Bank of Jordan (Z3C)

## 🏗️ Technical Architecture
The Z3C gateway is built as a highly resilient, event-driven micro-service designed to integrate with the Bank of Jordan Core Banking systems.

### Core Stack
- **Framework**: Next.js 16.x (Turbopack)
- **Logic**: Node.js 22+ with zero-drift cryptographic libraries.
- **Security**: ECDSA (secp256k1) implementation matching ZATCA ISB 2.1 specifications.

---

## 🔐 Cryptographic Implementation Details

### 1. Key & CSR Generation
The system generates keys matching the **secp256k1** curve. The CSR (Certificate Signing Request) is built using custom ASN.1 templates to include ZATCA-specific Object Identifiers (OIDs):
- `Common Name`: `TST-CN-...`
- `Organization Identifier`: `399999999900003` (Sandbox Master VAT)
- `Organization Unit`: `Riyadh Branch`
- `Category`: `Supply activities`

### 2. Invoice Hashing Logic
We implement strict canonicalization before SHA-256 hashing:
1.  Removal of `UBLExtensions`.
2.  Removal of `cac:Signature`.
3.  Removal of the `AdditionalDocumentReference` containing the QR tag.
4.  XML C14N-style whitespace normalization.

### 3. Digital Signature (XAdES-EPES)
The signing process involves:
- Calculating the hash of the cleaned XML.
- Signing with the Private Key.
- Injecting the **XAdES-EPES** XML block into the `UBLExtensions`.

---

## 📡 API Integration Specs

### Authentication
All ZATCA endpoints require **Basic Auth**:
```bash
Authorization: Basic Base64(Certificate_Binary_Token : Secret)
```

### Endpoints (Sandbox Simulation)
- **Compliance**: `/compliance` (Trade OTP for CCSID)
- **Reporting**: `/invoices/reporting/single` (For B2C Simplified Invoices)
- **Clearance**: `/invoices/clearance/single` (For B2B Standard Invoices)

---

## 📁 Repository Map
- `/src/lib/zatca/crypto`: Handlers for signing, hashing, and ASN1 CSR building.
- `/src/lib/zatca/xml`: UBL 2.1 generator utilizing `xmlbuilder2` for strict schema adherence.
- `/src/lib/zatca/api`: Production HTTP clients with automatic retry logic for transient 5xx errors.
- `/src/lib/zatca/onboarding.ts`: The state machine for EGS lifecycle management.

---
*Version: 1.2.0*  
*Stability: Stable (Phase 2 Compliant)*
