# ZATCA Compliance Fields — Business Central AL Extension

This per-tenant extension (PTE) adds native ZATCA e-invoicing fields to posted
Sales Invoices and Credit Memos, and exposes them through a custom API that the
ZATCA middleware writes back to after clearance.

## What it adds

**Fields** (on *Sales Invoice Header* and *Sales Cr.Memo Header*):

| Field            | Type               | Purpose                                  |
|------------------|--------------------|------------------------------------------|
| ZATCA UUID       | Text[100]          | Clearance UUID returned by FATOORA        |
| ZATCA Status     | Enum `ZATCA Status`| None / Pending / Submitted / Cleared / Reported / Failed |
| ZATCA Cleared At | DateTime           | When the document was cleared/reported    |
| ZATCA Error      | Text[250]          | Last submission error, if any             |

- A **ZATCA Compliance** FastTab is added to the *Posted Sales Invoice* and
  *Posted Sales Credit Memo* pages so users can see the status.
- A custom API is published at:
  ```
  /api/zatca/compliance/v1.0/companies({id})/zatcaSalesInvoices({systemId})
  /api/zatca/compliance/v1.0/companies({id})/zatcaSalesCreditMemos({systemId})
  ```
  The middleware PATCHes `zatcaUuid`, `zatcaStatus`, `zatcaClearedAt`, `zatcaError`.

> The middleware works **without** this extension too — in that case it records
> status as a document **comment** plus XML/PDF **attachments**. Installing this
> extension simply upgrades that to first-class fields on the document card.

Object IDs use the per-tenant range **50100–50199**. If that range collides with
another extension in your tenant, change `idRanges` in `app.json` and the object/
field IDs in `src/` to a free range.

## Build & deploy

### Option A — VS Code (recommended)
1. Install **VS Code** + the **AL Language** extension (publisher: Microsoft).
2. Open this `bc-extension` folder in VS Code.
3. Press `Ctrl+Shift+P` → **AL: Download Symbols** (authenticate to your BC
   environment when prompted; configure `.vscode/launch.json` if needed).
4. Press `Ctrl+Shift+B` (or **AL: Package**) to compile a `.app` file.
5. Press **F5** to publish directly, **or** upload the `.app` manually (Option B).

### Option B — Upload the .app manually
1. In Business Central, search **Extension Management**.
2. Click **Manage → Upload Extension**.
3. Select the compiled `.app` file, accept the terms, and deploy.

### Verify
- Open a posted Sales Invoice → you should see the **ZATCA Compliance** FastTab.
- Browse `https://api.businesscentral.dynamics.com/v2.0/{tenant}/{env}/api/zatca/compliance/v1.0/companies({id})/zatcaSalesInvoices` — it should return JSON.

Once verified, post an invoice through your Power Automate flow; the UUID/Status
fields will populate automatically.
