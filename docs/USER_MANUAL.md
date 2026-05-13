# 📄 ZATCA E-Invoicing User Manual - Bank of Jordan (Z3C)

## 🏦 Project Mission
The **Z3C (ZATCA Core Connector)** is the authorized gateway for Bank of Jordan's Phase 2 E-Invoicing transition. This portal is designed for administrative and finance personnel to manage the lifecycle of Electronic Generating Souls (EGS).

---

## 🚀 The Three Pillars of Onboarding

To go live with ZATCA, every EGS unit must complete the following mandatory sequence:

### 1️⃣ Digital Identity Generation (CCSID)
This step establishes your unit's identity with ZATCA.
- **Workflow**: 
    1. Retrieve a 6-digit OTP from the ZATCA Developer Portal.
    2. Enter the OTP into the Z3C Portal.
    3. The system automatically generates your **Private Key** and **CSR** (Certificate Signing Request) using Bank of Jordan's secure parameters.
- **Outcome**: A **Compliance Certificate (CCSID)** is issued and stored securely.

### 2️⃣ Technical Compliance Suite (Mandatory Testing)
ZATCA requires every system to demonstrate technical proficiency before production access is granted.
- **Workflow**:
    1. Click the **"Execute Compliance"** button.
    2. The system will automatically generate, sign, and submit **6 specific documents**:
        - Standard Invoice (B2B)
        - Standard Credit Note
        - Standard Debit Note
        - Simplified Invoice (B2C)
        - Simplified Credit Note
        - Simplified Debit Note
- **Outcome**: All 6 submissions must return a `PASS` status.

### 3️⃣ Production Graduation (PCSID)
This is the final step to enable real-world financial reporting.
- **Workflow**:
    1. Trade your passed Compliance Token for a **Production Certificate**.
- **Outcome**: Your EGS is now **ZATCA Certified** and can clear/report real invoices.

---

## 🛠️ Status & Error Handling Guide

| Status Code | Meaning | User Action |
| :--- | :--- | :--- |
| **CLEARED** | (B2B) ZATCA has validated and stamped the invoice. | You can now share the PDF/XML with the buyer. |
| **REPORTED** | (B2C) ZATCA has acknowledged the submisson. | No further action needed; invoice is legal. |
| **REJECTED** | Validation failed. | Check the "Validation Errors" log. Usually due to incorrect tax calculation or rounding. |
| **WARNING** | Accepted with technical notes. | Review notes; no immediate action but should be fixed for future documents. |

---

## 📂 Audit & Legal Compliance
- **Retention**: All signed XML documents are logged and archived in accordance with Saudi Arabian Tax Law (7-year retention).
- **Security**: Private keys are encrypted and stored in the BOJ-isolated environment.

---
*Owner: Bank of Jordan IT Compliance*  
*Contact: e-invoicing-support@bankofjordan.com.sa*
