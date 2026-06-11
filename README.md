# 🏦 ZATCA-middleware-Business-Central

[![ZATCA Phase 2](https://img.shields.io/badge/ZATCA-Phase%202--Compliant-blue)](https://zatca.gov.sa/)
[![Status](https://img.shields.io/badge/Status-Production--Ready-green)]()

The **ZATCA-middleware-Business-Central** is a production-grade integration hub that brings **Microsoft Dynamics 365 Business Central** into ZATCA (FATOORA) compliance. It handles the complete onboarding lifecycle, cryptographic signing, and UBL 2.1 XML generation for Phase 2.

---

## 📖 Supporting Documentation

*   [**🚨 Project Hand-off**](./docs/PROJECT_HANDOFF.md) - **Start Here!** Full project context, critical fixes, and roadmap.
*   [**User Manual**](./docs/USER_MANUAL.md) - Documentation for operations and finance teams on onboarding and status handling.
*   [**Developer Manual**](./docs/DEVELOPER_MANUAL.md) - Deep technical breakdown of crypto, architecture, and API specs.
*   [**C4 Architecture Model**](./docs/C4_ARCHITECTURE.md) - System context, container, and component diagrams.
*   [**Exhaustive Test Cases**](./docs/TEST_CASES.md) - Complete list of technical and business scenarios for validation.

---

## 🔥 Key Technical Features

- **Business Central native**: Connects over the BC REST API v2.0 using OAuth 2.0 (Microsoft Entra ID) service-to-service auth.
- **Automated Workflow**: Full lifecycle from identity generation to production clearance, with writeback of QR/UUID/XML/PDF to the source document.
- **API Coverage**: 100% implementation of ZATCA Core APIs (Compliance, Production, Clearance, Reporting, and Renewal).
- **Strict Compliance**: Zero-drift hashing and signing matching ZATCA ISB 2.1 specifications.

---

## 💻 Quick Start

### 1. Installation
```bash
npm install
```

### 2. Configure environment
Create `.env.local` with your Supabase credentials (see `.env.example` if present, or the Developer Manual):
```bash
NEXT_PUBLIC_SUPABASE_URL=...
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
```

### 3. Provision the database
Run `supabase_schema.sql` (fresh DB) or `supabase_migration_bc.sql` (existing Odoo-based DB) in the Supabase SQL Editor.

### 4. Run Locally
```bash
npm run dev
```

---

## 🔌 Connecting Business Central

1. **Register an app** in Microsoft Entra ID (App registrations). Copy the **Client ID**, **Tenant ID**, and create a **Client Secret**.
2. **Grant API access**: add the *Dynamics 365 Business Central → API.ReadWrite.All* application permission and grant admin consent.
3. **Authorize the app inside BC** under *Microsoft Entra Applications*, then assign a permission set (e.g. `D365 AUTOMATION`).
4. In the middleware, open **Business Central Settings**, enter the credentials, use **List Companies** to grab your Company GUID, and **Save**.
5. **Automate posting** with a Power Automate flow that POSTs the posted invoice `systemId` to `/api/bc/webhook` (see the in-app Setup Playbook).

---

## 📁 System Architecture

- **`src/lib/bc/client.ts`** — Business Central REST client (OAuth2 token, invoice/credit-memo fetch, writeback, attachments).
- **`src/app/api/bc/config`** — connection settings (test / save / list companies).
- **`src/app/api/bc/webhook`** — push & pull entry point that drives ZATCA submission + writeback.
- **`src/lib/zatca/`** — crypto (ECDSA secp256k1 + SHA-256), UBL 2.1 XML, and ZATCA API clients.

---

## ⚖️ Governance
Internal Use Only. © 2026. All rights reserved.
