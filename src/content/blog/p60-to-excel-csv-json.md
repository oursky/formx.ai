---
title: "How to Extract UK P60 Data into Excel for Payroll Reconciliation"
description: "A practical guide to extracting UK P60 data into Excel for payroll reconciliation: every P60 field explained, extraction pitfalls, a worked reconciliation workflow against your payroll ledger and FPS totals, and automated P60 extraction with FormX."
excerpt: "How payroll teams extract UK P60 data into Excel and reconcile it against the payroll ledger and FPS submissions: field-by-field extraction, common pitfalls, and an automated P60 extraction workflow."
category: ocr-software
author: FormX
date: 2026-07-16
lastmod: 2026-07-16
featured_image: "/images/blog/p60-to-excel-csv-json-hero.png"
featured_image_alt: "How to Extract UK P60 Data into Excel for Payroll Reconciliation"
canonical_url: "/blog/p60-to-excel-csv-json/"
draft: false
---

<style>
  .rt-post table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
  .rt-post th, .rt-post td { padding: 10px 14px; border: 1px solid #e2e8f0; text-align: left; font-size: 15px; }
  .rt-post thead th { background: #f8fafc; font-weight: 600; }
  .rt-post tbody tr:nth-child(even) { background: #f8fafc; }
</style>

Every year after 5 April, UK payroll teams face the same job: get the figures from a stack of P60 End of Year Certificates into Excel, then prove those figures agree with the payroll ledger and the Full Payment Submissions (FPS) already filed with HMRC. The extraction step is where most of the time goes — P60s arrive as PDFs from Sage, Xero, QuickBooks, and BrightPay, as scans of HMRC booklets, and as phone photos, each laying the same fields out differently.

This guide covers the whole job: every P60 field and where extraction goes wrong, three ways to get the data into a spreadsheet (manual entry, generic OCR, a dedicated P60 extractor like FormX), and a worked payroll reconciliation workflow — the Excel columns to set up and the checks to run against your ledger and FPS totals.

## What a P60 Contains — and Why Reconciliation Needs Every Field

A P60 is the End of Year Certificate an employer must give to every employee still on the payroll at 5 April, by **31 May** following the tax year end. It summarises the full tax year — which in the UK runs **6 April to 5 April**, never a calendar year — covering gross pay, income tax deducted through PAYE, National Insurance contributions broken down by category letter, statutory payments, student loan deductions, and the final tax code.

Three documents get confused at year end, and only one of them belongs in a P60 reconciliation:

- **P60** — end-of-year summary for employees still employed at 5 April. Full tax year figures, including pay from a previous employer in the same year if the employee joined mid-year.
- **P45** — a leaver document covering only the period worked, not the full tax year. If a P45 lands in your P60 batch, its totals will not reconcile — catch it at intake.
- **P11D** — reports taxable benefits in kind, due to HMRC by 6 July. Benefit values reported on a P11D do not appear on the P60.

The P60 is generated *from* payroll records, so any discrepancy between the certificate, the ledger, and the FPS totals filed with HMRC signals an error somewhere in the chain — a missed correction, an FPS that never went through, or a migration that dropped year-to-date figures. Reconciliation in a spreadsheet is how you find it before HMRC or the employee does.

## P60 Fields, Field by Field — With Extraction Pitfalls

Every field a P60 extraction needs to capture, and where extraction — manual or automated — typically goes wrong.

| Field | What it contains | Data type | Extraction pitfalls |
|---|---|---|---|
| Employee forenames and surname | Legal name as held by HMRC | String | Some layouts print one combined name field; substitute forms vary the label |
| National Insurance number | Unique employee identifier, format `XX999999X` | String | The best join key — but sometimes redacted; a partial NI number should stay partial, never guessed |
| Works/payroll number | Employer's internal reference | String | Leading zeros vanish if the Excel column is typed as a number |
| PAYE reference | Format `NNN/XXXXXXX` — HMRC office number plus employer reference | String | The slash makes Excel parse some references as dates or fractions; must stay text |
| Tax year | Printed as "6 April 2025 to 5 April 2026" | Date range | Never a calendar year; extract start and end, not a single year number |
| Pay in previous employment(s) | Pay from an earlier employer in the same tax year, carried from the P45 | Decimal | Frequently blank — blank means "no previous employment", not £0. Exclude from this-employer reconciliation |
| Tax in previous employment(s) | Tax deducted by the earlier employer | Decimal | Same caveat; only this-employment figures reconcile against your ledger |
| Pay in this employment | Gross taxable pay with this employer | Decimal | The primary reconciliation figure. Confusing it with the combined total (previous + this) is the most common P60 keying error |
| Tax deducted in this employment | PAYE income tax deducted by this employer | Decimal | A net refund can print with an "R" marker — a negative value, not a code to discard |
| NI category letter | One or more letters (A, B, C, D, J, M, Z and others) setting the contribution rate | String | Multiple rows appear when the category changed mid-year (e.g. turning 21 moves M to A). Keep each row separate, never summed |
| NI earnings at the Lower Earnings Limit (LEL) | Earnings up to the LEL, per category | Decimal | Printed per category row; misaligning rows against letters corrupts every NI check downstream |
| NI earnings above LEL up to the Primary Threshold (PT) | Earnings band, per category | Decimal | Small fonts in the NI table degrade badly on low-quality scans |
| NI earnings above PT up to the Upper Earnings Limit (UEL) | Earnings band, per category | Decimal | Same |
| Employee's NI contributions | NI actually deducted from pay, per category | Decimal | Distinct from the earnings bands beside it — a common column confusion with generic OCR |
| Statutory payments (SMP, SPP, SAP, ShPP, SPBP, SNCP) | Statutory maternity, paternity, adoption, shared parental, parental bereavement, and neonatal care pay in gross pay | Decimal | Usually absent rather than printed as £0 — must return null, not zero, or audit trails misstate what happened |
| Student loan deductions | Student loan repayments deducted through PAYE | Decimal | Shows the amount, not the plan type; a separate box covers postgraduate loan deductions |
| Final tax code | The code in use at year end, e.g. `1257L`, `BR`, `0T` | String | Must stay text in Excel; week 1/month 1 markers matter when interpreting the tax check |
| Employer name and address | Issuing employer | String | Substitute forms position this anywhere on the page |

Two structural pitfalls cut across the whole table. First, the **previous-employment vs this-employment split**: only this-employment pay and tax reconcile against your own ledger and FPS totals, so an extraction that merges the two produces false discrepancies on every mid-year joiner. Second, **week 53**: employees paid weekly, fortnightly, or four-weekly can receive a 53rd (or 54th/56th) payment in some tax years, taxed on a non-cumulative week 1 basis, and payroll software may mark this on the P60. A week 53 employee's tax will sit slightly off a pure cumulative PAYE calculation — correct behaviour, not an error, and your reconciliation checks need to allow for it.

## Three Ways to Get P60 Data into Excel

| Method | How it works | Where it breaks | Best for |
|---|---|---|---|
| **Manual entry** | Key each field from the PDF or paper form into a spreadsheet | Slow at volume; transposition errors; the previous/this-employment mix-up; no audit trail | A handful of P60s a year |
| **Generic OCR** | OCR to raw text or an unstructured table, then map fields by hand | No understanding of the P60 layout — and there is no single layout to learn. Cannot reliably tell pay from tax, misaligns NI rows, reads blanks as zeros | Documents with one fixed, known layout — which P60s are not |
| **Dedicated P60 extraction (FormX)** | ML-based extraction trained on the End of Year Certificate structure returns labelled fields with per-field confidence scores | Very poor images (faded dot-matrix prints, sub-200 DPI photos) route to human review rather than extracting cleanly | Payroll teams, bureaux, and platforms at year-end volume |

The honest tradeoff: manual entry is fine at five P60s and untenable at five hundred. Generic OCR looks cheap until you cost the field-mapping work you redo for every payroll software layout, HMRC booklet variant, and employer substitute form. A dedicated extractor costs per page but lands each value in the right labelled field regardless of layout — and the confidence scores tell you which few documents still need a human look.

## Step by Step: P60 to Excel with FormX

Automated P60 extraction with FormX is a three-step pipeline: submit the document, receive structured fields, export to your format.

**Step 1 — Submit the P60.** Upload a PDF, scanned image, or phone photo. FormX pre-processes images automatically (rotation correction, deskew, contrast normalisation), so a photographed HMRC booklet goes through the same pipeline as a clean Sage PDF. For one-off certificates, the [free P60 converter](https://www.formx.ai/tools/p60-converter/) runs in the browser with no signup; for batches, the API accepts submissions programmatically — see the [P60 OCR API guide](/blog/p60-ocr-api/) for the full schema and integration patterns.

**Step 2 — Receive structured output.** Every field comes back labelled and typed, with per-field confidence scores. A representative extraction:

```json
{
  "document_type": "p60",
  "tax_year": { "start": "2025-04-06", "end": "2026-04-05" },
  "employee_name": { "surname": "Hughes", "forenames": "Bethan" },
  "national_insurance_number": "AB123456C",
  "paye_reference": "475/GA61208",
  "pay_previous_employment": 6240.00,
  "tax_previous_employment": 748.80,
  "total_pay_this_employment": 34650.00,
  "total_tax_deducted": 4437.20,
  "ni_contributions": [
    {
      "category": "A",
      "earnings_lower_earnings_limit": 6396.00,
      "earnings_lel_to_pt": 6174.00,
      "earnings_pt_to_uel": 22080.00,
      "employee_contributions": 1766.40
    }
  ],
  "student_loan": {
    "plan_type": "SL2",
    "amount_deducted": 891.00
  },
  "postgraduate_loan_deductions": null,
  "statutory_payments": { "smp": null, "spp": null, "sap": null, "shpp": null },
  "tax_code": "1257L",
  "confidence": 0.97
}
```

Note what the nulls mean: the statutory payment boxes and the postgraduate loan box were not printed on this P60, so they return `null` — the deduction did not apply. That is different from £0, and the distinction survives into your spreadsheet.

**Step 3 — Export.** The extracted fields export as an Excel workbook or CSV with one row per certificate, or as JSON for direct integration. Either way, pay, tax, and each NI figure land in their own columns, ready for the reconciliation checks below.

## Building the Payroll Reconciliation Workbook

This is where extracted P60 data earns its keep. The goal: prove that what the P60 says matches what the payroll ledger says and what the FPS submissions told HMRC.

**Columns to set up.** One row per employee per employment, keyed on NI number plus PAYE reference (an employee with two jobs has two P60s — never merge them):

- Keys: `NI_number`, `PAYE_ref`, `employee_name`, `tax_code`
- P60 side: `P60_pay_this_emp`, `P60_tax_this_emp`, `P60_pay_prev_emp`, `P60_NI_category`, `P60_NI_employee_contribs`, `P60_earnings_PT_to_UEL`, `P60_student_loan`
- Ledger/FPS side (from your payroll year-to-date export and final FPS): `Ledger_gross_YTD`, `FPS_tax_YTD`, `Ledger_NI_employee_YTD`
- Results: `Pay_diff`, `Tax_diff`, `NI_diff`, `Status`

Pull the ledger figures alongside the P60 figures with `XLOOKUP` on NI number, then run three checks.

**Check 1 — Gross pay vs ledger.** `P60_pay_this_emp` minus `Ledger_gross_YTD` should be zero to the penny; both come from the same payroll engine, so any difference means a post-P60 correction, a duplicated pay run, or a migration gap. Compare against *this employment* pay only — a mid-year joiner's previous-employment figure belongs to the old employer's ledger.

**Check 2 — Tax deducted vs cumulative PAYE / FPS.** `P60_tax_this_emp` should equal the tax reported across the year's FPS submissions for that employee; flag differences above a small rounding tolerance. Build in two legitimate exceptions before flagging: week 53 payments (taxed non-cumulatively, so the year total sits slightly off a pure cumulative calculation) and in-year refunds (which reduce the total and can carry an "R" marker on the form).

**Check 3 — NI vs category rates.** For each NI category row, apply that year's employee rate for the category to `P60_earnings_PT_to_UEL` (plus the above-UEL rate where applicable) and compare against `P60_NI_employee_contribs`. NI is calculated per pay period rather than annually, so allow a per-period rounding tolerance — but a contribution wildly off the category rate usually means the extraction misaligned a category row, or payroll ran the wrong category letter all year. Employees with two category rows (a mid-year category change) need each row checked against its own rate.

Anything that fails a check gets a `Status` of "review", with the source document one click away. Clean rows become your evidence, dated and filed, that the year end reconciles. The same workbook pattern serves payroll bureaux reconciling client year-ends against FPS extracts, and lenders verifying declared income at scale.

## Handling Scanned and Photographed P60s

Employee-submitted P60s are rarely clean PDFs. Expect phone photos with perspective skew, scans of HMRC paper booklets (some with handwritten name and NI fields), faded dot-matrix prints, and photocopies of photocopies.

- **Resolution:** 300 DPI is the working floor. Below roughly 200 DPI, the small fonts in the NI contributions table degrade first — exactly where column misalignment does the most damage.
- **Automatic pre-processing:** FormX deskews, rotates, and contrast-normalises images before extraction, so most photos convert without preparation on your side.
- **Handwriting and redactions:** Handwritten fields on older booklets extract at lower confidence and are flagged for review rather than guessed. A redacted NI number returns null — the extraction never invents identifying data.
- **Confidence-driven review:** Auto-accept the clean majority on per-field confidence scores and route only the exceptions to a human.

## Bulk Processing for Multi-Employee Batches

Year end concentrates volume: hundreds of P60s land in the weeks around 31 May.

- **Batch submission:** FormX accepts asynchronous batch jobs — submit the full employee set in one request and collect results via webhook or polling.
- **Multi-P60 PDFs:** Payroll software often exports every employee's P60 into one PDF. Document segmentation splits it into per-certificate extractions; verify the returned count matches your headcount before reconciling.
- **Duplicate NI numbers are valid:** Two P60s with the same NI number means two employments. Key on `(NI number, PAYE reference, tax year)` — and note the second employer's P60 carries the first employer's pay in its previous-employment boxes, so summing carelessly double-counts.
- **Cost tracks the spike:** FormX bills pay-as-you-go, so seasonal May volume does not force a year-round subscription.

## Getting the Data into Excel Without Format Corruption

Excel's type inference mangles P60 data in predictable ways. Set the workbook up defensively:

- **Import, don't double-click.** Open CSVs via Data → Get Data (Power Query) or the text import wizard so you set column types explicitly, instead of handing every column to Excel's auto-detection.
- **Type as Text:** NI numbers, PAYE references, tax codes, and works numbers. PAYE references like `475/GA61208` contain a slash Excel loves to reinterpret; works numbers lose leading zeros the moment they become numbers.
- **Type as Number (2 dp), not currency-with-symbol:** all pay, tax, and NI columns. Keep raw numerics so tolerance checks work; apply £ formatting for display only, and strip `£` signs and thousands separators at import.
- **Dates:** store tax year start and end as ISO dates (`2026-04-05`) or plain text. "6 April 2026" imports fine on a UK-locale machine and breaks when the file crosses to a US-locale one.
- **One field per column.** Never pack the NI category table into a single cell — each category row gets its own columns (or row) so the rate check can run per category.

## Frequently Asked Questions

**What is the best P60 to Excel tool?**
One that handles P60s from any source — Sage, Xero, QuickBooks, BrightPay, HMRC booklets, substitute forms, scans, and phone photos — keeps pay, tax, and NI in separate typed columns, returns null (not zero) for absent fields, and provides per-field confidence scores. FormX does all of this and exports to Excel, CSV, or JSON; test it with the [free P60 converter](https://www.formx.ai/tools/p60-converter/).

**Is there a P60 extraction API for automated P60 extraction?**
Yes. The FormX P60 extraction API accepts a PDF or image and returns structured JSON with every P60 field labelled — NI number, PAYE reference, this-employment and previous-employment pay and tax, NI contributions by category letter, statutory payments, student loan deductions, and the final tax code — with per-field confidence scores and batch endpoints for year-end volume. The [P60 OCR API guide](/blog/p60-ocr-api/) covers the full schema.

**How does a P60 OCR tool differ from generic OCR?**
Generic OCR reads characters without understanding the End of Year Certificate structure, so it cannot reliably tell total pay from total tax, misaligns NI category rows, and reads blank statutory boxes as zeros. A P60 OCR tool is trained on the P60's field structure across payroll software layouts, HMRC booklets, and substitute forms, so each value lands in the right labelled field whatever the source.

**Can I convert a P60 scan to spreadsheet, including phone photos?**
Yes. FormX converts a scanned or photographed P60 to a spreadsheet through the same pipeline as a digital PDF — images are deskewed, rotated, and contrast-normalised automatically before extraction. Handwritten fields on old HMRC booklets are flagged at lower confidence for review rather than guessed.

**How accurate is an automated P60 extractor for payroll reconciliation?**
Accurate enough to run reconciliation on, provided you use the confidence scores: auto-accept high-confidence fields, and route the small minority of low-confidence extractions (faded prints, handwriting, sub-200 DPI photos) to human review before they enter the workbook. That review-by-exception model is also what gives regulated income-verification workflows their audit trail — every figure is traceable to a machine extraction with a known confidence level.

## From Certificate to Reconciled Workbook

Extract every P60 into labelled, typed fields; import into a defensively formatted Excel workbook keyed on NI number and PAYE reference; run the three checks — gross pay against the ledger, tax against cumulative PAYE and FPS totals, NI against category rates — with tolerances for week 53 and per-period rounding; and review only what the checks and confidence scores flag.

Try the [free P60 converter](https://www.formx.ai/tools/p60-converter/) on a real certificate — no signup required — or [schedule a demo](https://www.formx.ai/schedule-demo) to see how FormX fits a full year-end reconciliation pipeline.

*Related reading: [P60 OCR API](/blog/p60-ocr-api/) · [Best tax form extraction tools](/blog/best-tax-form-extraction-tools/) · [P60 vs PAYG: UK and Australia year-end payroll extraction](/blog/p60-vs-payg/)*
