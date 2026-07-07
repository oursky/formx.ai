---
title: "ZUGFeRD to Excel, CSV, and JSON: Extract and Convert German E-Invoice Data"
description: "How to convert a ZUGFeRD e-invoice to Excel, CSV, or JSON: XML parsing with OCR fallback, field extraction, bulk processing, scanned invoices, free tools, and an accurate ZUGFeRD extraction API."
excerpt: "How to convert a ZUGFeRD e-invoice to Excel, CSV, or JSON, covering XML parsing with OCR fallback, field extraction, bulk processing, and an accurate ZUGFeRD extraction API."
category: ocr-software
author: FormX
date: 2026-07-07
lastmod: 2026-07-07
featured_image: "/images/blog/zugferd-to-excel-csv-json-hero.png"
featured_image_alt: "ZUGFeRD to Excel, CSV, and JSON: Extract and Convert German E-Invoice Data"
canonical_url: "/blog/zugferd-to-excel-csv-json/"
draft: false
---

<style>
  .rt-post table { width: 100%; border-collapse: collapse; margin: 1.5rem 0; }
  .rt-post th, .rt-post td { padding: 10px 14px; border: 1px solid #e2e8f0; text-align: left; font-size: 15px; }
  .rt-post thead th { background: #f8fafc; font-weight: 600; }
  .rt-post tbody tr:nth-child(even) { background: #f8fafc; }
</style>

The fastest way to turn a ZUGFeRD e-invoice into usable data is an extraction tool like FormX that parses the embedded XML when present and falls back to OCR for flat PDFs, then exports structured fields to Excel, CSV, or JSON. As Germany's B2B e-invoicing mandate rolls out, finance teams receive a mix of proper ZUGFeRD files and plain scanned invoices, and both need to land in one consistent output. This guide covers how to extract and convert ZUGFeRD invoices with FormX accurately, in bulk, and programmatically.

## How do you convert a ZUGFeRD invoice to Excel or CSV?

To convert a ZUGFeRD invoice to Excel or CSV, run it through FormX, which extracts the fields (from the embedded XML or via OCR fallback) and exports them as spreadsheet columns, with line items expanded to one row each. Upload the invoice and FormX returns invoice number, seller and buyer VAT IDs, line items, and VAT totals. FormX preserves the VAT breakdown and line-item detail, which is what makes the export reconcile against your ledger.

## How do you convert a ZUGFeRD invoice to JSON?

To convert a ZUGFeRD invoice to JSON, use a ZUGFeRD extraction API like FormX that normalizes every profile into one object. The FormX response carries the invoice number and date, currency, seller and buyer VAT IDs, line items with quantities, unit prices, and tax rates, and the net, VAT, and grand totals, so a BASIC-profile invoice and an EXTENDED one return the same labelled fields.

## Why is ZUGFeRD extraction different from normal invoice OCR?

ZUGFeRD extraction is different because the format is hybrid: invoice data lives in an embedded XML payload, not just the visible PDF. Pure OCR ignores that payload and re-reads the page, while an XML-only parser breaks on flat PDF invoices with no ZUGFeRD data. An accurate ZUGFeRD extractor detects whether XML is present, parses it when it is, and applies OCR as a fallback when it is not, normalizing all profiles (BASIC, EN 16931, EXTENDED, XRECHNUNG) to one schema.

## Can you extract from a scanned or photographed invoice?

Yes. When an invoice carries valid ZUGFeRD XML, FormX parses it for near-perfect accuracy; when it is a scanned or photographed PDF with no XML, FormX runs OCR and maps the visible fields to the same schema. You do not have to sort invoices by type before processing, which is the requirement most tools miss.

## How do you extract ZUGFeRD invoices in bulk?

Bulk ZUGFeRD extraction with FormX uses a batch or asynchronous API: submit many invoices in one request rather than one call per file. For accounts-payable teams processing high invoice volume, this automates intake regardless of whether each file is a true ZUGFeRD or a flat PDF, and FormX bills pay-as-you-go.

## Extract ZUGFeRD data programmatically (API and SDK)

To extract ZUGFeRD data programmatically, POST a file to the FormX ZUGFeRD OCR API and receive normalized JSON across all profiles. The FormX parsing API returns per-field confidence scores and integrates into ERP, accounts-payable, or n8n and Power Automate workflows.

## ZUGFeRD extraction and conversion tools compared

| Tool | Profiles + XRechnung | XML + OCR fallback | To Excel / CSV / JSON | Bulk / API | Pricing |
|---|---|---|---|---|---|
| **FormX** | All six, normalized | Yes, auto-detect | Yes, all three | Yes, batch + async | Pay-as-you-go |
| DocuClipper | Generic invoice | OCR only | Yes | Limited API | Subscription |
| Affinda | Configurable | Partial | Yes | Yes | Subscription |
| Generic OCR | No | OCR only | Manual mapping | Varies | Varies |

## Frequently asked questions

**Is there a free ZUGFeRD to Excel converter?** Yes, FormX offers a free ZUGFeRD/invoice extractor for one-off files, plus an API for bulk use.

**What is the best ZUGFeRD to Excel tool?** One that parses XML with OCR fallback and normalizes all profiles including XRechnung; FormX does both.

**Can I turn a ZUGFeRD invoice into CSV?** Yes, export the extracted fields as CSV, with line items expanded to one row each.

**Does it support XRechnung and flat PDFs?** Yes, XRechnung is handled as a profile, and flat PDFs are processed via OCR fallback in the same pipeline.

## How FormX handles ZUGFeRD conversion

FormX is purpose-built for structured financial documents, including German e-invoices:

- Converts ZUGFeRD invoices to Excel, CSV, and JSON, normalizing all six profiles including XRechnung
- Auto-detects ZUGFeRD XML and falls back to OCR for flat PDFs in one pipeline
- Returns normalized JSON with per-field confidence scores
- Batch and async endpoints for high invoice volume, pay-as-you-go pricing

*Related reading: [ZUGFeRD extraction API](/blog/zugferd-extraction-api/) · [Best ZUGFeRD extraction tools](/blog/best-zugferd-extraction-tools/) · [ZUGFeRD, XRechnung, Factur-X: Germany's e-invoicing guide](/blog/zugferd-xrechnung-factur-x-germanys-e-invoicing-guide/)*
