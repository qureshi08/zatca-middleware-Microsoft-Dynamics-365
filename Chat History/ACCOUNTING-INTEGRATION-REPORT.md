# Accounting Software Integration — Strategy Report

**Prepared for:** ZATCA Suite (Bank App + Universal Portal)
**Question:** Which accounting software should we integrate with so the user **never leaves their tool** — invoice creation, ZATCA clearance, QR code, status and audit all happen inside it?
**Date:** 2026‑05‑18
**Scope:** Saudi market first, MEA second, global third.

---

## TL;DR

1. **Build for Odoo first.** It is the only realistic platform where we can replace the invoice PDF, embed a custom view, and make ZATCA compliance *invisible* to the user. Big install base in KSA via system integrators.
2. **Ship a Zoho Books app second.** Fastest go‑to‑market via the Zoho Marketplace; covers the SMB segment that won't run Odoo.
3. **Add Microsoft Dynamics 365 Business Central third.** This is where the Saudi banks and mid‑market corporates already live — and where the Bank App's own customers will be.
4. **Keep QuickBooks Online** for international SMBs, but don't lead with it.
5. **Do not build for Wafeq.** They're a Saudi‑native, ZATCA‑certified accounting tool — i.e. a competitor, not a host.

A user on Odoo or D365 BC issues their normal invoice, clicks one button (or nothing — it auto‑fires on validate), the QR appears on the printed PDF, the clearance UUID lives on the invoice screen, and the only time anyone opens our Portal is to debug.

---

## 1. What "everything happens in that software" actually requires

Five concrete capabilities. If any one of these is missing, the user has to come to our Portal.

| # | Capability | Why it matters |
|---|---|---|
| 1 | **REST / OData API for invoice CRUD** | We need to read invoices to submit; we need to write back the clearance result. |
| 2 | **Webhooks or events on invoice lifecycle** | Auto‑submit on "validate / post". No cron polling. |
| 3 | **Replaceable invoice PDF template** | ZATCA Phase 2 requires the QR on the printed invoice itself. |
| 4 | **Custom fields on the invoice record** | To store UUID, ICV, PIH, status, signature timestamp. |
| 5 | **Embeddable UI / extension framework** | A side panel or button inside the invoice screen for re‑submit, view XML, view ZATCA response. |

A platform that scores 5/5 is a Tier‑1 host. 3/5 with strong attachments and a memo field is Tier‑3 (functional but ugly).

---

## 2. Scorecard

Scores are 1–5 (5 = best). Higher is better. KSA presence is a 1–3 multiplier‑style flag for prioritisation.

| Platform | 1·API | 2·Webhooks | 3·PDF replaceable | 4·Custom fields | 5·Embedded UI | KSA presence | Total | Tier |
|---|:--:|:--:|:--:|:--:|:--:|:--:|:--:|:--:|
| **Odoo** *(Enterprise + Community)* | 5 | 5 | **5** | 5 | 5 | High | **25** | **1** |
| Microsoft Dynamics 365 Business Central | 5 | 5 | 4 | 5 | 5 | High (banks) | 24 | 1 |
| Oracle NetSuite | 5 | 5 | 5 | 5 | 5 | Medium | 25 | 1 |
| SAP S/4HANA · B1 | 4 | 4 | 5 | 5 | 4 | High (corp.) | 22 | 1 |
| Sage Intacct | 4 | 4 | 4 | 5 | 4 | Low | 21 | 2 |
| **Zoho Books** | 5 | 5 | 4 | 5 | 3 | High | **22** | **2** |
| Xero | 5 | 5 | 2 | 3 | 4 | Low | 19 | 3 |
| **QuickBooks Online** | 5 | 5 | 2 | 3 | 4 | Medium | **19** | **3** |
| FreshBooks | 4 | 4 | 1 | 2 | 2 | Low | 13 | 4 |
| Tally Prime | 3 | 2 | 3 | 3 | 1 | Medium | 12 | 4 |

**Tier 1** — invoice + QR + status appear natively. **Tier 2** — same fidelity via attached PDF and custom fields. **Tier 3** — link‑out or external PDF download. **Tier 4** — not worth building.

---

## 3. Top three — deep dive

### 3.1 Odoo — **the recommendation**

**What it is.** Open‑source ERP (Community = free, Enterprise = paid). Modular: each business capability is an `addon`. Self‑hosted, Odoo.sh, or Odoo Online. Versions ship yearly; today: 17 stable, 18 latest.

**Why it wins for us.**

- **PDF takeover.** The invoice report is a QWeb XML template. We ship our own `account.report_invoice_document` and the QR code is part of every printed and emailed invoice. No "two PDFs" confusion.
- **Custom fields are first‑class.** `zatca_uuid`, `zatca_status`, `zatca_qr`, `zatca_pih` go on `account.move`. They show up on the invoice form, in list views, in filters, in reports.
- **Embedded UI.** We add a smart button on the invoice form: *"Submit to ZATCA"*, *"View XML"*, *"Re‑clear"*. We add a status bar widget showing `Draft → Posted → Submitted → Cleared`.
- **Hooks everywhere.** `_post()` on `account.move` is the natural hook for "auto‑submit on validate". `ir.cron` for retries. `mail.thread` for an audit trail inside the invoice.
- **OCA module pattern.** The Odoo Community Association already publishes regional e‑invoicing modules (`l10n_sa_edi` is partial). We extend that pattern instead of inventing one.
- **Distribution.** Three channels: the Odoo Apps store, our website, and via Saudi system integrators (who control ~60% of Odoo deployments in KSA).

**Why a customer chooses us over the OCA `l10n_sa_edi` module.** We bring a hosted middleware that owns the CSR, the secret, the retries, the audit log, the certificate rotation. The OCA module is bring‑your‑own‑certificate; we are a service.

**Setup for the customer (steady state).**

1. Customer installs the `zatca_suite` module from Odoo Apps (one click).
2. Goes to *Settings → ZATCA → Connect*. Pastes our `sk_zatca_live_***` key. Tests the connection.
3. (If not already onboarded) clicks *Run ZATCA onboarding* — our module walks them through OTP + compliance + production in‑place.
4. From now on: post any invoice → ZATCA fields populate within ~1 second → QR is on every PDF.

**Build effort for us.**

| Work | Estimate |
|---|---|
| Odoo module `zatca_suite` (server + client) | 4–6 weeks |
| QWeb invoice template w/ QR | 1 week |
| Smart buttons + status widget | 1 week |
| Onboarding wizard inside Odoo | 1 week |
| Backporting to Odoo 16/17 | 1 week |
| Internal QA on Community + Enterprise | 1 week |
| **Total** | **~9–10 weeks, 1.5 engineers** |

---

### 3.2 Zoho Books — **fastest go‑to‑market**

**What it is.** Cloud‑native SMB accounting from Zoho. Strong in KSA, UAE, India. Already advertises ZATCA Phase 2 support natively.

**Why we still integrate with it.** Zoho's own ZATCA pipeline is a black box — many customers want a **bring‑your‑own‑certificate** option for multi‑tenant control (banks, accountants serving multiple clients, audit trails). That's our angle.

**Capabilities.**

- Full REST API for invoices, customers, contacts.
- Webhooks for `invoice.created`, `invoice.sent`, `invoice.thumbsup`.
- Custom fields on Invoice — we expose `ZATCA UUID`, `Clearance status`, `QR base64`.
- Custom PDF template — we ship a Zoho template that prints the QR. Customer sets it as default.
- Marketplace app distribution = one‑click install.
- **Limitation:** the embedded UI inside Zoho is a "Widget" — limited to a side panel, no full takeover of the invoice screen.

**Setup for the customer.**

1. Install *"ZATCA Suite"* from the Zoho Marketplace.
2. OAuth grant (Zoho → us).
3. Paste our API key (or auto‑provision via the install flow).
4. Choose: *auto‑submit on send* or *manual button*.
5. Optionally pick our PDF template as default in Zoho settings.

**Build effort.** ~4 weeks, 1 engineer. Marketplace review adds 1–2 weeks.

---

### 3.3 Microsoft Dynamics 365 Business Central — **the enterprise play**

**What it is.** Microsoft's mid‑market ERP. The natural home for Saudi banks and corporates that already live inside Microsoft 365.

**Why it matters strategically.** The Bank App's own customers (banks doing back‑office fee invoicing) often *already* use D365 BC or D365 F&O for their general ledger. A D365 BC connector closes the loop without forcing them to use our Bank App.

**Capabilities.**

- Full OData v4 REST API.
- Webhooks via Business Events + Power Automate.
- Reports are RDL / Word templates — fully replaceable.
- Custom fields via Extensions (AL language) or Power Platform.
- Embedded UI via "Page extension" in AL → buttons, fact boxes, action ribbons on the sales invoice.
- Distribution: AppSource (Microsoft's marketplace) and direct via Microsoft partner network.

**Setup for the customer.**

1. Install the *ZATCA Suite* extension from AppSource.
2. In BC, *Setup → ZATCA Connection* → paste our key.
3. (Standard onboarding flow runs inside BC.)
4. Posting a sales invoice triggers `OnAfterPostInvoice` → our connector submits to ZATCA → fields write back → QR prints.

**Build effort.** ~10–12 weeks (AL is its own learning curve). Microsoft AppSource certification adds 4–6 weeks. ROI is large‑ticket enterprise deals.

---

## 4. Architecture — how "everything stays in the accounting software"

```
┌───────────────────────────────────────────┐
│  Accounting Software  (Odoo, Zoho, BC…)   │
│                                           │
│   ┌─────────────────────────────────────┐ │
│   │  Native invoice screen              │ │
│   │  ─ buttons we add  (Submit / View)  │ │
│   │  ─ our status widget                │ │
│   │  ─ QR on the printed PDF            │ │
│   └─────────────────────────────────────┘ │
│              │ events / OAuth API         │
└──────────────┼────────────────────────────┘
               │
               ▼
┌───────────────────────────────────────────┐
│  ZATCA Middleware  (our Universal Portal) │
│  ─ Holds the certificate, secret, key     │
│  ─ Signs XML (XAdES‑EPES)                 │
│  ─ Talks to ZATCA Clearance / Reporting   │
│  ─ Writes result back to the accounting   │
│    software via its API                   │
└──────────────┬────────────────────────────┘
               │ HTTPS  (Basic Auth: CSID:secret)
               ▼
        ┌──────────────┐
        │   ZATCA API  │
        └──────────────┘
```

**Three flows happen automatically:**

1. **Trigger (accounting → us).**
   Customer posts/validates an invoice. The accounting software fires an event (webhook or `OnAfterPost`). Our connector receives it.

2. **Sign + submit (us → ZATCA).**
   We pull the full invoice via the accounting API, build UBL XML, sign it, call the right ZATCA endpoint (Clearance for Standard 388, Reporting for Simplified 381/383).

3. **Write‑back (us → accounting).**
   We write the cleared XML, UUID, ICV, PIH and QR back into custom fields and attach the signed PDF. We also append a line in the invoice's chatter / audit trail.

The user, meanwhile, has never opened our Portal. They see one status colour change on their invoice from *Posted* to *Cleared*.

---

## 5. Setup playbook — Odoo (the winner)

This is what we hand to a customer on day 1.

### A. One‑time tenant onboarding (our side)

1. Customer registers at portal.zatca‑suite.com.
2. Goes through the 3‑phase ZATCA onboarding wizard (already designed).
3. Lands on "Choose your path" → picks **Accounting integration → Odoo**.
4. Portal generates a tenant API key.

### B. Install in their Odoo (their side)

1. *Apps → Search → "ZATCA Suite" → Install*.
2. After install, a banner appears at top: *"Connect ZATCA Suite to start clearing invoices."*
3. *Settings → Accounting → ZATCA Suite → Configure*:
   - Paste API key
   - Click *Test connection* (green dot)
   - Pick environment: Sandbox / Production
   - Pick auto‑submit policy: *On post* / *Manual*
4. Done. The next invoice they post is ZATCA‑cleared.

### C. What the user sees, per invoice

| Place | What appears |
|---|---|
| Invoice form header | New status pill: `Cleared by ZATCA` (or `Pending`, `Rejected`) |
| Smart buttons | *View ZATCA XML*, *View QR*, *Re‑submit* |
| Right‑hand fact box | UUID · ICV · Stamp time · Cleared timestamp |
| Printed/emailed PDF | QR code (TLV/base64) bottom right · "ZATCA" footer |
| Chatter (activity log) | "Submitted to ZATCA · 312 ms · CLEARED" |
| Filters in invoice list | Filter by ZATCA status — find the rejects in one click |

### D. Failure modes — handled inside Odoo

- **ZATCA rejects:** invoice gets `Rejected` pill, the error text goes into the chatter, and a smart button *"Open in Portal"* deep‑links to our log viewer for diagnosis.
- **Network blip:** auto‑retry with exponential backoff. Cron checks pending submissions every minute.
- **Certificate expiring:** banner on every invoice form 30 days before, deep‑link to renew.

---

## 6. Build effort, ranked

| Integration | Effort (eng‑weeks) | Time to first paying customer | Distribution friction |
|---|:--:|:--:|---|
| Odoo | 9–10 | 3 months | Low (Odoo Apps + integrators) |
| Zoho Books | 5–6 (incl. review) | 2 months | **Lowest** (Zoho Marketplace) |
| QuickBooks | 5–6 (incl. review) | 2 months | Low (QB App Store) |
| Dynamics 365 BC | 14–18 (incl. AppSource cert) | 5 months | Medium (AppSource + partner) |
| SAP B1 | 12–16 | 5 months | High (long enterprise sale) |
| Xero | 5 | 2 months | Low |

---

## 7. Recommended sequence

```
Now ─────────── Q1 2026 ─────────── Q2 ──────────── Q3 ────────── Q4
 │                 │                  │               │             │
 ├─ Odoo module  ──┤                  │               │             │
 │                 ├─ Zoho Books app ─┤               │             │
 │                                    ├─ D365 BC ext. ────────┤     │
 │                                    │               ├─ QB app ────┤
```

- **Q1**: ship Odoo connector. Land 5 KSA integrators as design partners.
- **Q2**: ship Zoho Books marketplace app. Targets the SMB long tail.
- **Q3**: ship D365 BC extension. Pursue Saudi bank deals; this also closes the loop for Bank App customers.
- **Q4**: ship QB Online app. Picks up international expansion.

---

## 8. What changes in our product

Three concrete changes:

1. **The Universal Portal's "Choose your path" screen** widens from {QuickBooks, API} to a tile grid: **Odoo · Zoho · Dynamics 365 BC · QuickBooks · Custom (API)**. The QB tile is no longer the headline.
2. **A new section in the Portal: "Connected systems."** Lists each accounting tool a tenant has linked, with health, last sync, last invoice cleared.
3. **The Portal's Activity / Logs screen** gets a *Source* column showing which accounting tool sent each invoice. Same screen, more sources.

These changes are additive — the Bank App and the existing API path keep working untouched.

---

## 9. Risks and open questions

- **Wafeq is a competitor.** Do we treat them as a host (integrate) or a rival (out‑compete)? Recommendation: ignore for now; we win against Wafeq via Odoo's deeper customisation, not by integrating with them.
- **Odoo version sprawl.** We need to support 17 and 18 at minimum; 16 if customer demand. Budget time for back‑porting.
- **ZATCA changes.** ZATCA's API evolves. Our middleware shields the accounting connectors from this — but we have to keep all connectors versioned.
- **PDF template wars.** Customers customise their own invoice template. We need to document *how* to inject our QR into their custom QWeb / RDL / Zoho template without breaking it.
- **Pricing model.** Per‑tenant flat fee? Per‑invoice? Tiered by volume? This decision feeds the marketplace listing copy.

---

## 10. One‑paragraph recommendation

Build the Odoo connector first. It is the only platform in this list where ZATCA compliance becomes invisible — the QR ships on the customer's existing invoice, the UUID lives in a field they can filter on, and our Portal becomes a back‑office monitoring tool instead of a place they have to visit. Follow with Zoho Books for fast SMB reach and Dynamics 365 BC for the enterprise / bank segment. Leave QuickBooks Online as a "we support it" check‑box, not a flagship. The Universal Portal stays as the brain; the accounting software is now the face.
