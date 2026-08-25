---
title: "How to Extract W-2 Data to Excel: Every Box Explained"
description: "A complete guide to W-2 to Excel conversion: what every box (a–f, 1–20) contains, how to extract W-2 data from PDFs, scans, and photos with W-2 OCR, and how to avoid Excel formatting corruption."
excerpt: "A complete guide to W-2 to Excel conversion: what every box (a–f, 1–20) contains, how to extract W-2 data from PDFs, scans, and photos with W-2 OCR, and how to avoid Excel formatting corruption."
category: ocr-software
author: FormX
date: 2026-07-16
lastmod: 2026-07-16
featured_image: "/images/blog/w2-to-excel-csv-json-hero.png"
featured_image_alt: "How to Extract W-2 Data to Excel: Every Box Explained"
canonical_url: "/blog/w2-to-excel-csv-json/"
draft: false
---

<style>
  .rt-post table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
  .rt-post th, .rt-post td { padding: 10px 14px; border: 1px solid #e2e8f0; text-align: left; font-size: 15px; }
  .rt-post thead th { background: #f8fafc; font-weight: 600; }
  .rt-post tbody tr:nth-child(even) { background: #f8fafc; }
</style>

Converting a W-2 to Excel means turning every box on the form — employee and employer identifiers, federal wage and withholding amounts, Box 12 code pairs, Box 13 checkboxes, and the state and local rows — into named spreadsheet columns. The fastest reliable way to do it is automated W-2 extraction: a W-2 OCR tool like FormX reads a PDF, scan, or phone photo of the form and exports structured data to Excel, CSV, or JSON with one row per form. This guide explains what every W-2 box contains, why some boxes break naive extraction, and how to build a W-2 to spreadsheet workflow that survives real-world documents.

## **Every W-2 Box Explained (a–f and 1–20)**

Accurate W-2 field extraction starts with knowing what each box holds and where extraction typically goes wrong. The W-2 has six lettered identity boxes and twenty numbered boxes.

### Lettered boxes: who the form belongs to

| Box | Field | Data type | Extraction pitfalls |
|-----|-------|-----------|---------------------|
| a | Employee's Social Security Number | String, `XXX-XX-XXXX` | Often truncated to `***-**-1234` on employee copies; Excel strips leading zeros if imported as a number |
| b | Employer Identification Number (EIN) | String, `XX-XXXXXXX` | Same leading-zero risk; distinguish from box a by format (2-7 split vs 3-2-4) |
| c | Employer's name, address, and ZIP code | Multi-line string | Line breaks inside one box; needs splitting into name/street/city/state/ZIP columns |
| d | Control number | Optional string | Blank on many forms; payroll-internal reference, safe to leave empty |
| e | Employee's name | String | Suffixes (Jr., III) and middle initials complicate first/last splitting |
| f | Employee's address and ZIP code | Multi-line string | ZIP codes starting with 0 (e.g., New Jersey, Massachusetts) get corrupted by Excel's number coercion |

### Numbered boxes 1–11: federal wages and withholding

| Box | Field | Data type | Extraction pitfalls |
|-----|-------|-----------|---------------------|
| 1 | Wages, tips, other compensation | Decimal | The federal taxable wage figure; not the same as gross pay — pre-tax 401(k) and similar deferrals are excluded |
| 2 | Federal income tax withheld | Decimal | Positionally adjacent to Box 1 — generic OCR frequently swaps them |
| 3 | Social Security wages | Decimal | Capped at the annual Social Security wage base, so it can legitimately differ from Box 1; a Box 1 ≠ Box 3 mismatch is not an error |
| 4 | Social Security tax withheld | Decimal | Should be 6.2% of Box 3 — a useful validation check on extracted values |
| 5 | Medicare wages and tips | Decimal | No wage cap, so often the largest wage figure on the form |
| 6 | Medicare tax withheld | Decimal | 1.45% of Box 5, plus 0.9% Additional Medicare Tax withheld on wages over $200,000 — do not hard-code a single rate check |
| 7 | Social Security tips | Decimal | Usually blank outside hospitality; blank ≠ parse failure |
| 8 | Allocated tips | Decimal | Not included in Box 1 wages; must stay a separate column |
| 9 | *(blank / grayed out)* | — | The IRS verification-code pilot ended; current forms leave Box 9 empty — extractors should return null, not noise |
| 10 | Dependent care benefits | Decimal | Usually blank; amounts over the annual exclusion also appear in Box 1 |
| 11 | Nonqualified plans | Decimal | Rare; distributions from nonqualified deferred compensation plans |

### Box 12: the multi-code trap

Box 12 is where most W-2 to Excel conversions fall apart. The form has four slots (12a, 12b, 12c, 12d), and each slot holds a **letter code plus a dollar amount**. There are more than 30 valid codes. Common ones:

| Code | Meaning |
|------|---------|
| D | 401(k) elective deferrals |
| E | 403(b) elective deferrals |
| G | 457(b) deferrals |
| W | Employer + employee HSA contributions |
| C | Taxable group-term life insurance over $50,000 |
| AA | Designated Roth 401(k) contributions |
| BB | Designated Roth 403(b) contributions |
| DD | Cost of employer-sponsored health coverage (informational) |
| V | Income from nonstatutory stock option exercise |
| II | Medicaid waiver payments excluded from gross income |

Starting with tax year 2026 forms, the IRS added three codes under the One Big Beautiful Bill Act: **TA** (employer contributions to a Trump account), **TP** (total cash tips reported to the employer), and **TT** (total qualified overtime compensation). A W-2 extraction pipeline built on a frozen code list will start failing on 2026 forms unless the code set is maintained.

The extraction pitfalls: the slot letter (12a–12d) is positional and meaningless — the *code* is what carries meaning. An employee's 401(k) deferral might appear in 12a on one employer's form and 12c on another's. A converter that flattens Box 12 into a single cell like `D 5000 DD 3200` destroys the structure. The correct Excel layout is paired columns — `Box 12a Code`, `Box 12a Amount`, `Box 12b Code`, `Box 12b Amount`, and so on — or a normalized code-keyed layout if you control the downstream schema. FormX extracts each code–amount pair as a discrete field, so the export stays machine-readable.

### Box 13: checkboxes, not numbers

Box 13 contains three checkboxes: **statutory employee**, **retirement plan**, and **third-party sick pay**. These are booleans, not amounts. Generic OCR either skips them or returns a filled-square glyph that maps to nothing. In Excel these should be three TRUE/FALSE columns; in JSON, three boolean fields. The retirement-plan checkbox matters downstream because it affects IRA deduction limits — losing it silently changes tax outcomes.

### Box 14 and the state/local rows (15–20)

| Box | Field | Data type | Extraction pitfalls |
|-----|-------|-----------|---------------------|
| 14 | Other | Free-text label + amount pairs | Employer-defined labels (union dues, state disability insurance, tuition assistance) with no fixed vocabulary; the 2026 form splits it into 14a (Other) and 14b (Treasury tipped occupation codes) |
| 15 | State / Employer's state ID number | String pair, per state row | Two rows on the standard form — a multi-state employee has both populated; more than two states means an additional W-2 |
| 16 | State wages, tips, etc. | Decimal, per state row | Can differ from Box 1 because states define taxable wages differently |
| 17 | State income tax | Decimal, per state row | Blank for no-income-tax states (TX, FL, WA, etc.) — blank is correct, not a failure |
| 18 | Local wages, tips, etc. | Decimal, per locality row | Only populated where city or county tax applies (e.g., NYC, Philadelphia, Ohio municipalities) |
| 19 | Local income tax | Decimal, per locality row | Paired with Box 18 |
| 20 | Locality name | String | Free-text locality abbreviations vary by employer |

Boxes 15–20 are **rows, not single values**. An employee who moved from New York to New Jersey mid-year has two state lines, each with its own state code, employer state ID, wages, and withholding. The clean Excel representation is either repeated column groups (`State 1`, `State 1 Wages`, `State 1 Tax`, `State 2`…) or one spreadsheet row per state line with the federal fields repeated. FormX returns the state block as an array, so either layout is a straightforward mapping.

## **Four Ways to Convert a W-2 to Excel, Compared**

| Method | Speed | Accuracy on scans/photos | Box 12 / Box 13 handling | Scales to bulk | Cost profile |
|--------|-------|--------------------------|--------------------------|----------------|--------------|
| Manual re-keying | ~5–10 min per form | Human-limited; typos in EINs and amounts | Full, if the operator is careful | No | Labor cost grows linearly |
| Generic OCR (Acrobat text export, raw Textract) | Fast | Reads characters, not fields — box assignments break | Codes dropped, checkboxes lost | Partially | Cheap per page, expensive to clean up |
| Excel's built-in import (Data → From PDF / picture) | Fast on clean digital PDFs | Poor on scans and photos; grabs table fragments | Flattened or missing | No | Free but manual per file |
| Dedicated W-2 OCR API (FormX) | Seconds per form | Trained on the W-2 schema; handles skew and photos | Code–amount pairs and booleans preserved | Yes — batch + async | Pay-as-you-go per document |

The honest tradeoffs: for one clean, text-selectable PDF from a payroll provider, Excel's own PDF import or careful copy-paste can be adequate. Manual entry remains the right fallback for a handwritten-amended form that no software should be trusted with unsupervised. But the moment inputs include scans or phone photos, or volume passes a handful of forms, a W-2-specific extractor is the only method where accuracy and effort don't degrade together. Generic OCR is the worst fit for W-2s specifically, because the form's meaning lives in box positions and code letters that plain text extraction discards.

## **Step by Step: W-2 PDF or Photo to Excel with FormX**

FormX is a W-2 extraction API and browser tool purpose-built for structured tax documents. The workflow is the same whether the input is a digital PDF, a scanned image, or a photo of a W-2:

1. **Upload the form.** Submit a PDF, JPG, or PNG through the FormX portal, or POST it to the extraction API. Multi-form PDFs are split into one record per W-2.
2. **Automated extraction runs.** The W-2-specific model identifies the form, reads every box — including Box 12 code pairs, Box 13 checkboxes, and the state rows — and attaches confidence scores so low-confidence fields can be routed for review.
3. **Review flagged fields (optional).** High-confidence extractions pass straight through; anything below your threshold gets a human glance. This is how bulk pipelines stay fast without going blind.
4. **Export.** Download Excel or CSV with one row per form and named columns per box, or consume the JSON response programmatically.

The JSON output maps directly to the form's structure:

```json
{
  "document_type": "W-2",
  "tax_year": "2025",
  "employee": {
    "ssn": "***-**-1234",
    "name": "Maria Alvarez",
    "address": "18 Orchard St, Newark, NJ 07102"
  },
  "employer": {
    "ein": "04-3456789",
    "name": "Beacon Logistics LLC",
    "address": "200 Harbor Way, Boston, MA 02210",
    "control_number": "PR-88412"
  },
  "federal": {
    "box_1_wages": 68450.00,
    "box_2_federal_tax_withheld": 8214.00,
    "box_3_ss_wages": 71950.00,
    "box_4_ss_tax_withheld": 4460.90,
    "box_5_medicare_wages": 71950.00,
    "box_6_medicare_tax_withheld": 1043.28,
    "box_7_ss_tips": null,
    "box_8_allocated_tips": null,
    "box_10_dependent_care": null,
    "box_11_nonqualified_plans": null
  },
  "box_12": [
    { "slot": "12a", "code": "D", "amount": 3500.00 },
    { "slot": "12b", "code": "DD", "amount": 6980.00 }
  ],
  "box_13": {
    "statutory_employee": false,
    "retirement_plan": true,
    "third_party_sick_pay": false
  },
  "box_14": [
    { "label": "NJ SDI", "amount": 145.26 }
  ],
  "state": [
    {
      "state": "NJ",
      "employer_state_id": "043-456-789/000",
      "box_16_state_wages": 71950.00,
      "box_17_state_tax_withheld": 2870.00
    }
  ],
  "local": [],
  "confidence": 0.97
}
```

Notice what the structure preserves that a flat text dump loses: Box 1 and Box 3 differ (the 401(k) deferral under code D explains the gap), the retirement-plan checkbox is a boolean, and the state block is an array ready for a second entry on multi-state forms. Nulls mean "blank on the form," which is normal for boxes 7–11 on most W-2s. For the API-integration angle — endpoints, batch submission, confidence-score handling — see the companion guide on the [W-2 OCR API](/blog/w2-ocr-api/).

## **W-2 Image to Excel: Photos, Scans, and Low-Quality Inputs**

A large share of real-world W-2s arrive as a photo of a W-2 taken on a phone: perspective skew, shadows, a thumb in the corner. Scanned copies add fold lines and photocopier noise. Converting a W-2 image to Excel reliably requires pre-processing before extraction — rotation correction, deskewing, and contrast normalization — which FormX applies automatically. Practical guidance for whoever captures the image:

- Shoot flat and straight-on; perspective distortion is the biggest accuracy killer.
- Fill the frame with the form and keep shadows off the amount boxes.
- Aim for the equivalent of 300 DPI — a modern phone camera at normal distance clears this easily, but a photo of a screen or a heavily compressed messaging-app forward may not.
- If a value is illegible to your eye, expect a low confidence score on that field — that's the review queue working as intended, not a bug.

## **Bulk W-2 Extraction and Multi-Form PDFs**

Tax season is a volume spike, not a steady stream. For bulk W-2 extraction — onboarding batches, mortgage files, a payroll audit spanning thousands of employees — one-at-a-time conversion doesn't survive contact with January. What a bulk pipeline needs:

- **Batch submission:** send many documents in one request instead of one call per form.
- **Asynchronous results:** retrieve completed extractions via webhook or polling rather than blocking per document.
- **Multi-form PDF handling:** payroll providers export consolidated packages with several W-2s in one file, and an employee with two jobs uploads two W-2s at once. Document segmentation must split these into one record per form before field extraction.
- **Failure separation:** corrupted files and password-protected PDFs should surface as typed errors, not silently missing rows.

FormX supports batch and async submission with pay-as-you-go pricing, which suits seasonal volume better than a flat subscription: the cost of February doesn't carry into July.

## **Getting W-2 Data into Excel Cleanly (Without Corrupting It)**

Extraction is half the job; the other half is stopping Excel from mangling the data on import.

**Recommended column layout** for a one-row-per-form W-2 spreadsheet:

1. Identity: `Tax Year`, `Employee Name`, `Employee SSN`, `Employer Name`, `Employer EIN`, `Control Number`
2. Federal amounts: `Box 1` through `Box 11` as numeric columns
3. Box 12 as pairs: `Box 12a Code`, `Box 12a Amount` … `Box 12d Code`, `Box 12d Amount`
4. Box 13 as three TRUE/FALSE columns
5. Box 14 label/amount pairs
6. State group repeated twice: `State 1`, `State 1 Employer ID`, `Box 16 (1)`, `Box 17 (1)`, then the `(2)` set
7. Local group: `Box 18`, `Box 19`, `Box 20`

**The leading-zero problem.** SSNs, EINs, ZIP codes, and employer state IDs are identifiers, not numbers. Open a CSV by double-clicking it and Excel will coerce EIN `04-3456789` into something unusable and strip ZIP `07102` down to `7102`. To import safely:

- Use **Data → Get Data → From Text/CSV** (Power Query) instead of double-clicking the file, and set the SSN, EIN, ZIP, and state-ID columns to **Text** before loading.
- Or use the legacy Text Import Wizard and mark those columns as Text.
- Exporting to `.xlsx` directly (as FormX does) sidesteps the problem entirely, because column types are set in the file rather than guessed at open time.
- Keep dollar amounts as plain decimals without currency symbols or thousands separators in the CSV — `68450.00`, not `$68,450.00` — so they land as numbers you can sum and validate.

A worthwhile sanity check once the data is in Excel: `Box 4 ≈ Box 3 × 0.062` and `Box 6 ≥ Box 5 × 0.0145`. Rows that fail either formula are the ones to re-inspect against the source image.

## **Frequently Asked Questions**

### How do I convert a W-2 to Excel?

Upload the W-2 (PDF, scan, or photo) to a W-2 OCR tool like FormX, which maps every box to a named field and exports an Excel or CSV file with one row per form — including Box 12 code–amount pairs and both state rows. For a single clean digital PDF, Excel's Data → From PDF import can work, but it degrades quickly on scans and drops Box 12 structure.

### Can I convert a photo of a W-2 to Excel?

Yes. FormX accepts phone photos alongside PDFs and scans, applying deskew and contrast correction before extraction. Shoot the form flat, straight-on, and well-lit; fields that remain hard to read return low confidence scores so you can verify them instead of trusting them blindly.

### Is there a W-2 extraction API?

Yes. The FormX W-2 extraction API accepts a PDF or image via a POST request and returns structured JSON with every box as a typed field, plus confidence scores. Batch and async endpoints handle tax-season volume. See the [W-2 OCR API guide](/blog/w2-ocr-api/) for integration details.

### How do I convert a W-2 to JSON?

Run the form through a W-2 extraction API that returns a normalized object: employee and employer identifiers, Boxes 1–11 as decimals, Box 12 as an array of code–amount pairs, Box 13 as booleans, and state/local lines as arrays. The JSON sample earlier in this guide shows the full FormX structure.

### What is W-2 OCR and how accurate is it?

W-2 OCR is optical character recognition trained on the W-2 form schema, so it extracts *fields* (Box 1 wages vs Box 2 withholding) rather than undifferentiated text. Accuracy on real documents comes from that structural awareness plus confidence scoring: FormX flags low-confidence fields for human review, so high-volume pipelines auto-accept the clean majority and only inspect the exceptions.

## **Summary**

A W-2 PDF parser earns its keep on the boxes that don't behave like simple key-value pairs: Box 12's letter-coded amount pairs (with new TP, TT, and TA codes arriving on 2026 forms), Box 13's checkboxes, the two-row state block, and identifiers that Excel will corrupt if imported as numbers. Manual entry and generic OCR both fail on exactly those points. FormX extracts every box — from a digital PDF, a scan, or a phone photo — into Excel, CSV, or JSON with the structure intact, and scales from a single form to seasonal batches on pay-as-you-go pricing.

Try the [free W-2 extractor tool](https://www.formx.ai/tools/w2-extractor/) with no signup, or [schedule a demo](https://www.formx.ai/schedule-demo) to see the API in a bulk workflow.

*Related reading: [W-2 OCR API: automate W-2 extraction at scale](/blog/w2-ocr-api/) · [Best tax form extraction tools](/blog/best-tax-form-extraction-tools/) · [Convert a tax form photo to Excel](/blog/convert-tax-form-photo-to-excel/)*
