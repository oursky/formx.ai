---
title: "FormX public endpoint IP addresses are changing"
description: "If your network allowlists FormX by IP, update your firewall or egress rules before the January 2027 DNS cutover. Hostnames, API paths, and tokens are not changing."
date: 2026-12-01
tag: ANNOUNCEMENT
featured_image: "/images/whats-new/2026-12-01-public-endpoint-ip-change.png"
canonical_url: "/whats-new/2026-12-01-public-endpoint-ip-change/"
---

We are updating the IP addresses used by FormX public hostnames (`*.formextractorai.com`). If your applications rely on outbound IP allowlisting, firewall rules, or other egress controls that reference our current IPs, you will need to update your configuration (including rules tied to IPs your resolvers return for FormX hostnames). FormX URLs, API paths, and tokens are **not** changing.

Update your allowlists with the **new** IPs below **before the DNS cutover window** in the timeline.

## Timeline

| | When |
| --- | --- |
| **Update allowlists by** | **Before 4 January 2027, 11:00 (Hong Kong time)** |
| **DNS cutover** | **4 January 2027 to 8 January 2027 (Hong Kong time), Monday–Friday** — hostnames below switch to the new IPs during this period |

During and after the cutover window, some DNS resolvers may still return the previous IP for a few hours.

## Endpoints by region

Add the **new** IP for each region you use.

### Global default

```text
Previous: 35.201.226.173
New:      104.199.211.182

Hostnames:
  formextractorai.com
  worker.formextractorai.com
```

### Singapore (`sg-gcp`)

```text
Previous: 34.124.213.52
New:      34.87.164.111

Hostnames:
  sg-gcp.formextractorai.com
  sg-gcp.worker.formextractorai.com
```

### United States (`us-gcp`)

```text
Previous: 34.59.242.141
New:      34.134.235.32

Hostnames:
  us-gcp.formextractorai.com
  us-gcp.worker.formextractorai.com
```

## Questions

Reach out through the [FormX portal](<https://auth.formextractorai.com/login>) or contact your account manager if you need help checking egress rules.