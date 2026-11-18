---
title: "Sub-Processors"
heading: "Sub-Processors"
description: "FormX Sub-Processors list and other vendor relationships."
canonicalUrl: "https://www.formx.ai/sub-processors/"
---

**Last updated: 2026-11-18**

This page lists the third-party Sub-processors engaged by FormX (Skymakers Digital Limited) to deliver the FormX Services. Each Sub-processor is bound by data-protection obligations substantially equivalent to those in the [Data Processing Agreement](/dpa/).

This page is the canonical record of FormX's current Sub-processors and related vendor relationships. See [*Subscribing to Changes*](#subscribing-to-changes) below for notification and objection procedures.

## FormX-operated Sub-Processors (GDPR Article 28)

The vendors in the table below Process Personal Data on Customer's behalf in connection with the FormX Services and therefore qualify as Sub-processors under Article 28 of the EU GDPR and the equivalent provisions of the UK GDPR.

| Sub-Processor | Entity | Region | Purpose | Personal Data |
|---|---|---|---|---|
| Google Cloud Platform | Google LLC | United States, Taiwan, Singapore | Cloud hosting and infrastructure (compute, managed databases, object storage, networking) | All Personal Data processed by the Services |
| Microsoft Azure | Microsoft Corporation | United States, Hong Kong, Singapore, Japan | AI model inference for document processing ([where enabled](#customer-configured-integrations-not-formx-sub-processors)) | Document Content submitted for extraction (where Azure inference is enabled) |
| Postmark | ActiveCampaign, LLC | United States | Transactional email delivery for the FormX portal (account invitations, password resets, billing and security notifications) | Recipient email address; message content |
| Stripe | Stripe, Inc. | United States | Subscription billing and payment processing | Customer billing contact details; payment-card data (stored by Stripe, not by FormX) |
| Sentry | Functional Software, Inc. d/b/a Sentry | United States | Application error and exception monitoring across the FormX Services and portal | Error and stack-trace data; may incidentally contain limited Personal Data from request context |
| PostHog | PostHog, Inc. | United States | Product analytics on Customer admin activity within the FormX portal | Customer admin event data; project metadata |

## Other Vendor Relationships

The vendors in the table below support FormX's own business operations (corporate communications, marketing-site analytics, sales-demo scheduling). They process FormX's own data, and in some cases may incidentally process Customer administrator contact details (for example, when a Customer admin emails FormX support or books a sales demo). They do not Process Customer End User Personal Data on Customer's behalf and are therefore not Sub-processors within the meaning of Article 28 GDPR. They are listed here for transparency.

| Vendor | Entity | Region | Purpose | Data |
|---|---|---|---|---|
| Google Workspace | Google LLC | United States | Corporate email, file storage, and internal collaboration (the mailbox behind support@formx.ai and FormX's internal documents) | Inbound and outbound email content, including any Customer admin support correspondence; internal documents |
| MailerLite | MailerLite Limited | Ireland | Marketing mailing list and newsletter delivery | Email address and (where provided) name of opt-in newsletter subscribers; engagement metadata |
| Plausible Analytics | Plausible Insights OÜ | European Union (Germany) | Privacy-friendly analytics for the FormX marketing site (formx.ai) | Anonymous aggregated visitor metrics; no cookies, no Personal Data |
| Google Tag Manager / Google Analytics | Google LLC | United States | Marketing-site analytics for the FormX marketing site (formx.ai), loaded only after analytics-cookie consent | Marketing-site usage events; visitor browser-side analytics, governed by the [Privacy Policy](/data-privacy-policy/) |
| Calendly | Calendly, LLC | United States | Sales-demo scheduling for the [Schedule a demo](/schedule-demo/) flow | Prospect or Customer admin name, email, company, time zone, meeting time, and any answers provided in the booking form |
| Sprinto | Sprinto, Inc. | United States (with operations in India) | Compliance-program automation for maintaining ISO/IEC 27001 and SOC 2 Type II | Employee names and access reviews; system inventory; compliance evidence metadata. No Customer Personal Data. |

## Customer-configured Integrations (not FormX Sub-Processors)

Customers may, at their option, configure the FormX Services to interact with third-party providers using credentials and accounts that the Customer owns and controls. FormX is not a Sub-processor for these integrations; the Customer selects the provider, controls the data flow, and is responsible for entering into appropriate data-protection arrangements directly with the provider.

Categories include:

- **External API endpoints (webhooks)** — Customer-controlled destinations to which FormX sends Parsed Content or other Service output
- **Customer-controlled cloud storage** (AWS S3, Google Cloud Storage, Azure Blob Storage, or equivalent) for Customer-controlled storage of Parsed Content and other Service output
- **OAuth source connectors** — Customer-authorised integrations with cloud-storage and document services (currently Google Drive) used to fetch source documents into FormX for processing, using credentials granted by the Customer to FormX through the third-party service's OAuth flow
- **AI model inference and OCR providers** — Customers may configure the AI model inference and OCR used to process their documents to run on a service of their choice, including OpenAI, Anthropic (Claude), AWS Bedrock, OpenRouter, or a specific FormX regional deployment (currently United States, Taiwan, Hong Kong, and Singapore)

## Subscribing to Changes

FormX publishes proposed Sub-processor additions or replacements on this page at least thirty (30) days before the change takes effect, unless an earlier engagement is required for security or business-continuity reasons. To receive email notifications when this list changes, please write to [support@formx.ai](mailto:support@formx.ai) with the subject line *"Subscribe to sub-processor updates"*. Objections on reasonable data-protection grounds may be raised in accordance with Section 6 of the [Data Processing Agreement](/dpa/).
