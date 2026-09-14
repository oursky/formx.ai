---
title: "The 5 Biggest Challenges in AP Automation (And How AI Solves Them)"
description: "75% of AP departments already use AI or automation, yet only 32.6% of invoices go fully touchless. Here are the 5 challenges we see behind that gap — bundled files, GL coding, non-PO invoices, invoice fraud, and AP reporting — and how FormX.ai handles each."
excerpt: "75% of AP departments already use AI or automation, yet only 32.6% of invoices go fully touchless. Here are the 5 challenges we see behind that gap — bundled files, GL coding, non-PO invoices, invoice fraud, and AP reporting — and how FormX.ai handles each."
category: guide
author: FormX
date: 2026-09-14
featured_image: "/images/blog/ap-automation-challenges-hero.jpg"
featured_image_alt: "The 5 biggest challenges in AP automation: bundled invoice files, GL coding, non-PO invoices, invoice fraud, and AP reporting"
canonical_url: "/blog/the-5-biggest-challenges-in-ap-automation/"
---

<style>
  .rt-post h3.faq-q,
  .rt-post h3.challenge-h {
    font-size: 22px;
    line-height: 1.4;
    margin-top: 28px;
    color: var(--primary-formx-green);
  }
</style>

Picture the invoice that comes in, gets captured, and arrives in your queue with every field already filled in. That used to be the finish line for "AP automation." It isn't anymore, not when the same invoice still needs someone to code it, check it against the right cost centre, catch a mismatch, and route it to the right approver by hand.

If you're one of the 75% of Accounts Payable (AP) departments already using some form of AI or automation, the real question by now is why the results haven't fully caught up yet.

In short:

  * 75% of AP departments already use some form of AI or automation — adoption isn't the problem anymore.
  * Even so, only 32.6% of invoices go fully touchless on average, and even best-in-class teams only reach 49.2%.
  * The gap comes down to what automation actually covers: most tools stop at capture and extraction, leaving coding, prioritisation, and routing manual.

## The gap between adoption and outcomes

[Ardent Partners' 2025 Accounts Payable Metrics That Matter report](https://europe.thomsonreuters.com/guides/ardent-partners-2025-ap-metrics), one of the more widely cited AP benchmarking studies in the U.S., puts a number on what that gap costs:

  * **Cost per invoice:** US$9.40 on average, versus US$2.78 for best-in-class AP teams
  * **Processing time:** 9.2 days on average (17.4 days for slower organisations), versus 3.1 days for best-in-class teams
  * **Exception rate:** 14% of invoices need manual intervention on average in 2024 (22% among non-best-in-class organisations specifically), versus 9% for best-in-class teams

A lot of that gap comes down to where automation stops. Most tools get an invoice captured and its fields extracted, yet everything after it goes back to being manual. This article draws on what we've observed working with AP leaders on their workflow automation.

## The 5 challenges we see in AP automation

<h3 class="challenge-h">1. Invoices buried in messy files</h3>

Not everything that arrives in an AP inbox is one clean invoice. In our observations, a single file might bundle several documents together, with an invoice, PO, delivery note, statement, and remittance stapled into one PDF. Splitting and classifying these multi-document files, then routing each page to the right queue, is a step we consistently see needing a person to catch, even when extraction itself is automated.

FormX.ai splits and classifies each page on intake, so every document reaches the right queue on its own. Every split is saved for audit.

<h3 class="challenge-h">2. GL codes are not on the invoice</h3>

Extracted data isn't useful until it's coded. GL account, cost centre, project code, tax treatment, credit/debit splits, the right internal company code across multiple entities. Most of it isn't printed on the vendor's invoice. It's the step we see most consistently still done by hand, even where capture is fully automated.

FormX.ai learns your coding rules and each vendor's history, then applies them to every new invoice. High-confidence lines are applied automatically. Low-confidence lines are sent for human review, so a person still owns the edge cases and every decision is traceable in the audit log.

<h3 class="challenge-h">3. No PO to match against</h3>

Sometimes services invoices arrive with no PO. In our experience, without a PO the coding answer has to come from somewhere else, and in most teams that means a human decides invoice by invoice.

FormX.ai codes non-PO invoices from vendor history instead of a matching document. When a vendor has been coded consistently across past invoices, that pattern is applied to the new one automatically. Low-confidence cases are sent for human review with the reasoning attached, so a person can accept or adjust in one step.

<h3 class="challenge-h">4. Invoice fraud slips through</h3>

Business Email Compromise (BEC) and vendor impersonation are among the most-reported invoice fraud vectors. The FBI's IC3 report has cited multi-billion-dollar annual losses to BEC for several years running, and the AFP Payments Fraud Survey routinely finds a majority of surveyed organisations experienced BEC attempts. Enterprise losses are especially large. Toyota Boshoku, Nikkei, Ubiquiti, and the Google/Facebook fake-vendor case are all documented examples where invoice or payment instructions were altered and nobody caught it before the money left.

Most tools only flag a field when the OCR itself is uncertain. What we see helping AP teams more is catching what doesn't add up at intake, not three approvals later. FormX.ai runs three checks on every invoice:

  * **Layout:** does the format match the vendor's previous invoices?
  * **Bank details region:** any irregularity in the field where the account number sits?
  * **Bank account:** does the account number differ from the last known one for this vendor?

Anything unusual is flagged to Finance for callback verification before the invoice enters the approval workflow. Every check is saved for audit. This is our earliest-possible sensor layer that goes before your existing controls or third-party bank verification. It catches the anomaly before the invoice reaches them.

<h3 class="challenge-h">5. Making sense of your AP data</h3>

Once every invoice is captured, coded, and paid through AI, the whole process becomes queryable. In our experience, the block for most AP leaders is not that reports take too long. It is that they don't know where to start, or what to ask.

FormX.ai Clark, our agentic AI workflow layer, answers plain-language questions about invoices, vendors, and workflow. Ask "Any insights on AP this quarter?" and Clark returns a scannable brief: touchless rate trend, discounts at risk this week, vendors flagged for verification. No reports to pull, no dashboards to build.

## Built to extend what you already run, not replace it

None of this means ripping out your ERP or approval workflow. FormX.ai sits in front of the process you already run, and works with it rather than around it.

FormX.ai combines OCR, computer vision, and large language models to turn an invoice into structured data (invoice number, PO number, vendor details, line items with quantity and unit price) without needing a fixed template first. Template-based, or traditional OCR needs a new template built for every layout, which doesn't hold up in AP: every vendor formats invoices differently, and even the same field gets worded differently from one supplier to the next (invoice number, reference no., document ID). That's why a new vendor's invoice layout works with FormX.ai on the first try, not the tenth.

FormX.ai's [Smart Learning](https://go.formx.ai/smart-learning) means corrections compound. When someone teaches FormX.ai a preference, for example capturing the total amount before discount rather than after, FormX.ai remembers it and applies the same choice to future invoices from that vendor. No IT ticket, no developer involved.

Once an invoice is coded and validated, [FormX.ai Clark](https://www.youtube.com/watch?v=8zifGfsJN1Y), our agentic AI document workflow layer, takes over routing. It pushes the invoice into the right approval path, fills fields across ERP platforms like SAP, and hands off the next task automatically, instead of parking it in a generic, one-size-fits-all queue.

## A few common questions

<h3 class="faq-q">Does this replace our ERP or approval workflow?</h3>

No. FormX.ai sits in front of what you already run and pushes clean, coded data into your existing ERP or AP system.

<h3 class="faq-q">What if our invoices don’t fit a standard integration?</h3>

Our servicing consultation and development team can help build custom requirements. You're not limited to a one-size-fits-all setup.

<h3 class="faq-q">How do we start without disrupting our current process?</h3>

Scope a pilot to one invoice type or vendor group, run it alongside what you already have, and only connect it to your core systems once accuracy has been validated on your own documents.

## Try FormX.ai on your own AP workflow

If you want to see this against your own invoices rather than a benchmark report, FormX.ai's free trial covers the first 100 pages. Or, if you'd rather talk it through first, [schedule a meeting](https://go.formx.ai/booking) with our specialist for a free consultation, especially if sorting bundled files, coding, non-PO invoices, anomaly checks, or matching exceptions is still the part you're doing by hand.
