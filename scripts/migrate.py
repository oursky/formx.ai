#!/usr/bin/env python3
"""
FormX.ai Webflow → Astro migration script.
Handles tasks 1-5 from migration-next.md:
  Task 1: Download images from Webflow CDN
  Task 2: Self-host CSS, JS, and favicons
  Task 3: Fix broken links in markdown
  Task 4: Fix broken .html links in static pages
  Task 5: Fill empty what's-new descriptions
"""

import os
import re
import sys
import json
import time
import urllib.request
import urllib.parse
import urllib.error
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed
from collections import defaultdict

PROJECT_ROOT = Path(__file__).parent.parent
SRC = PROJECT_ROOT / "src"
PUBLIC = PROJECT_ROOT / "public"


# ─────────────────────────────────────────────
# STEP 1: Collect all CDN URLs and their sources
# ─────────────────────────────────────────────

CDN_PATTERN = re.compile(r'https://cdn\.prod\.website-files\.com[^\s"\'\\)>]+')
JQUERY_URL = "https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=65d1ef574683ac0a13f6ea25"


def scan_files():
    """Return dict: url -> set of file paths that reference it."""
    url_to_files = defaultdict(set)
    extensions = {".astro", ".md", ".ts", ".css"}
    for path in SRC.rglob("*"):
        if path.suffix in extensions and path.is_file():
            try:
                text = path.read_text(encoding="utf-8", errors="replace")
            except Exception:
                continue
            for m in CDN_PATTERN.finditer(text):
                url = m.group(0).rstrip(".,;")
                url_to_files[url].add(str(path))
    return url_to_files


def categorize(url: str, files: set) -> str:
    """Determine local folder for a given URL based on which files reference it."""
    has_blog = any("/content/blog/" in f for f in files)
    has_whats_new = any("/content/whats-new/" in f for f in files)
    has_css = any("/styles/" in f for f in files)
    has_ui = any(
        x in f
        for f in files
        for x in ["/components/", "/layouts/", "/lib/"]
    )
    has_pages = any("/pages/" in f for f in files)

    # Determine file type from URL
    lower = url.lower()
    if "/js/" in lower or lower.endswith(".js"):
        return "js"
    if "/css/" in lower or lower.endswith(".css"):
        return "css"
    ext = Path(url.split("?")[0]).suffix.lower()
    if ext in (".woff", ".woff2", ".ttf", ".eot", ".otf"):
        return "fonts"

    # Image/SVG priority order
    if has_blog and not has_whats_new and not has_ui and not has_pages:
        return "images/blog"
    if has_whats_new and not has_blog and not has_ui and not has_pages:
        return "images/whats-new"
    if has_css or has_ui:
        return "images/ui"
    if has_pages:
        return "images/pages"
    if has_blog:
        return "images/blog"
    if has_whats_new:
        return "images/whats-new"
    return "images/ui"


def local_filename(url: str) -> str:
    """Extract a clean local filename from a CDN URL."""
    # Strip query string
    clean = url.split("?")[0]
    # Get last path component
    part = clean.rstrip("/").split("/")[-1]
    # URL-decode
    part = urllib.parse.unquote(part)
    # If it matches {hash}_{name}, use {name}
    m = re.match(r"^[0-9a-f]{24}_(.+)$", part, re.IGNORECASE)
    if m:
        part = m.group(1)
    # Replace spaces/special chars that are bad in filenames
    part = part.replace(" ", "-").replace("%20", "-")
    return part


def build_url_map(url_to_files: dict) -> dict:
    """Build mapping: original_url -> (local_abs_path, local_web_path)."""
    result = {}
    # Track filename collisions per folder
    seen = defaultdict(set)
    for url, files in url_to_files.items():
        if url == "https://cdn.prod.website-files.com":
            continue  # bare domain, skip
        cat = categorize(url, files)
        fname = local_filename(url)
        # Avoid collisions: if same name exists in folder from different URL, prefix with hash
        key = (cat, fname)
        if key in seen and seen[key] != url:
            # Use hash prefix to disambiguate
            hash_m = re.search(r"/([0-9a-f]{24})_", url)
            prefix = hash_m.group(1)[:8] if hash_m else url[-8:]
            base, ext = os.path.splitext(fname)
            fname = f"{base}-{prefix}{ext}"
        seen[(cat, fname)] = url

        local_abs = PUBLIC / cat / fname
        local_web = f"/{cat}/{fname}"
        result[url] = (local_abs, local_web)
    return result


# ─────────────────────────────────────────────
# STEP 2: Download files
# ─────────────────────────────────────────────

HEADERS = {
    "User-Agent": "Mozilla/5.0 (compatible; migration-script/1.0)",
    "Accept": "*/*",
}


def download_one(url: str, dest: Path) -> tuple[str, bool, str]:
    """Download url to dest. Returns (url, success, message)."""
    if dest.exists() and dest.stat().st_size > 0:
        return (url, True, f"SKIP (exists) {dest.name}")
    dest.parent.mkdir(parents=True, exist_ok=True)
    try:
        req = urllib.request.Request(url, headers=HEADERS)
        with urllib.request.urlopen(req, timeout=30) as resp:
            data = resp.read()
        dest.write_bytes(data)
        return (url, True, f"OK {dest.name} ({len(data)} bytes)")
    except Exception as e:
        return (url, False, f"FAIL {url}: {e}")


def download_all(url_map: dict) -> dict:
    """Download all files in parallel. Returns {url: success}."""
    results = {}
    tasks = [(url, info[0]) for url, info in url_map.items()]
    ok = fail = skip = 0
    print(f"\n[Download] {len(tasks)} files to download...")
    with ThreadPoolExecutor(max_workers=20) as pool:
        futures = {pool.submit(download_one, url, dest): url for url, dest in tasks}
        for i, fut in enumerate(as_completed(futures), 1):
            url, success, msg = fut.result()
            results[url] = success
            if "SKIP" in msg:
                skip += 1
            elif success:
                ok += 1
            else:
                fail += 1
            if i % 50 == 0 or fail > 0:
                print(f"  [{i}/{len(tasks)}] {msg}")
    print(f"[Download] Done: {ok} downloaded, {skip} skipped, {fail} failed")
    return results


def download_extra_files(url_map: dict):
    """Download jQuery and Webflow JS/CSS not yet in url_map."""
    extra = [
        # jQuery
        (
            JQUERY_URL,
            PUBLIC / "js" / "jquery-3.5.1.min.js",
        ),
    ]
    for url, dest in extra:
        if url not in url_map:
            _, ok, msg = download_one(url, dest)
            print(f"  Extra: {msg}")


# ─────────────────────────────────────────────
# STEP 3: Update source files
# ─────────────────────────────────────────────

def replace_in_file(path: Path, replacements: dict) -> int:
    """Apply all URL replacements in a file. Returns number of replacements made."""
    try:
        text = path.read_text(encoding="utf-8", errors="replace")
    except Exception:
        return 0
    new_text = text
    count = 0
    for old, new in replacements.items():
        if old in new_text:
            n = new_text.count(old)
            new_text = new_text.replace(old, new)
            count += n
    if new_text != text:
        path.write_text(new_text, encoding="utf-8")
    return count


def build_replacements(url_map: dict) -> dict:
    """Build {old_url: new_local_path} replacements dict."""
    return {url: info[1] for url, info in url_map.items()}


def update_baselayout(url_map: dict):
    """Switch BaseLayout.astro from CDN CSS to local import, and update JS/favicon refs."""
    layout = SRC / "layouts" / "BaseLayout.astro"
    text = layout.read_text()
    new_text = text

    # 1. Add CSS import in frontmatter (before the closing ---)
    if "import '@/styles/webflow.css'" not in new_text:
        new_text = new_text.replace(
            "import { TAWK_WIDGET, LINKEDIN_PARTNER_ID, APOLLO_APP_ID } from '@/lib/constants';",
            "import { TAWK_WIDGET, LINKEDIN_PARTNER_ID, APOLLO_APP_ID } from '@/lib/constants';\nimport '@/styles/webflow.css';",
        )

    # 2. Remove the CDN <link> for Webflow CSS (replace with empty string)
    # The line looks like:
    # <link\n      href="https://cdn.prod.website-files.com/65d1ef574683ac0a13f6ea25/css/formx-landing-staging.webflow.shared.90535e100.min.css"\n      rel="stylesheet"\n      type="text/css"\n      integrity="sha384-..."\n      crossorigin="anonymous"\n    />
    new_text = re.sub(
        r'\s*<link\s+href="https://cdn\.prod\.website-files\.com/[^"]+\.css"[^/]*/>\s*',
        "\n",
        new_text,
    )

    # 3. Remove CDN preconnect tag
    new_text = new_text.replace(
        '    <link href="https://cdn.prod.website-files.com" rel="preconnect" crossorigin="anonymous" />\n',
        "",
    )

    # 4. Replace jQuery CDN with local
    old_jquery = 'src="https://d3e54v103j8qbb.cloudfront.net/js/jquery-3.5.1.min.dc5e7f18c8.js?site=65d1ef574683ac0a13f6ea25"'
    new_jquery = 'src="/js/jquery-3.5.1.min.js"'
    new_text = new_text.replace(old_jquery, new_jquery)

    # 5. Strip integrity + crossorigin from jQuery tag (since we're self-hosting)
    # This is a simple approach: remove integrity/crossorigin attrs from self-hosted scripts
    # We need to be careful - do a targeted replace
    new_text = re.sub(
        r'(src="/js/jquery-3\.5\.1\.min\.js")(\s+type="text/javascript")?\s+integrity="[^"]+"\s+crossorigin="[^"]+"',
        r'\1',
        new_text,
    )

    # Also apply URL replacements for CDN favicons and webflow JS in url_map
    replacements = build_replacements(url_map)
    for old, new in replacements.items():
        if old in new_text:
            new_text = new_text.replace(old, new)

    # 6. Remove integrity/crossorigin from self-hosted webflow JS tags
    new_text = re.sub(
        r'(src="/js/webflow\.[^"]+\.js")(\s+type="text/javascript")?\s+integrity="[^"]+"\s+crossorigin="[^"]+"',
        r'\1',
        new_text,
    )

    if new_text != text:
        layout.write_text(new_text)
        print("[BaseLayout] Updated CSS import, jQuery, and Webflow JS references.")
    else:
        print("[BaseLayout] No changes made.")


def update_webflow_css(url_map: dict):
    """Update font/image CDN references inside webflow.css."""
    css_path = SRC / "styles" / "webflow.css"
    if not css_path.exists():
        print("[webflow.css] Not found, skipping.")
        return
    replacements = build_replacements(url_map)
    count = replace_in_file(css_path, replacements)
    print(f"[webflow.css] Replaced {count} CDN references.")


def update_all_sources(url_map: dict):
    """Replace CDN URLs in all source files."""
    replacements = build_replacements(url_map)
    extensions = {".astro", ".md", ".ts"}
    total_files = total_replacements = 0
    for path in SRC.rglob("*"):
        if path.suffix in extensions and path.is_file():
            n = replace_in_file(path, replacements)
            if n > 0:
                total_files += 1
                total_replacements += n
    print(f"[Sources] Replaced {total_replacements} CDN references across {total_files} files.")


# ─────────────────────────────────────────────
# TASK 3: Fix broken relative links in markdown
# ─────────────────────────────────────────────

BROKEN_LINK_FILES = [
    "invoice-data-capture.md",
    "bank-statement-ocr.md",
    "document-classification.md",
    "financial-data-extraction.md",
    "invoice-digitization-automate-invoice-processing.md",
    "extract-table-from-pdf.md",
    "invoice-parsing.md",
]


def fix_broken_links():
    """Fix ../post/SLUG.html and ../blog/SLUG.html links in markdown files."""
    blog_dir = SRC / "content" / "blog"
    fixed_files = 0
    for fname in BROKEN_LINK_FILES:
        path = blog_dir / fname
        if not path.exists():
            print(f"  SKIP (not found): {fname}")
            continue
        text = path.read_text()
        new_text = text
        # ../post/SLUG.html -> /blog/SLUG
        new_text = re.sub(r'\.\./post/([^"\')\s]+)\.html', r'/blog/\1', new_text)
        # ../blog/SLUG.html -> /blog/SLUG
        new_text = re.sub(r'\.\./blog/([^"\')\s]+)\.html', r'/blog/\1', new_text)
        # Remaining relative SLUG.html patterns -> /blog/SLUG
        new_text = re.sub(r'(?<!\w)([a-z0-9-]+)\.html(?!\w)', r'/blog/\1', new_text)
        if new_text != text:
            path.write_text(new_text)
            fixed_files += 1
            print(f"  Fixed: {fname}")
    print(f"[Task 3] Fixed broken links in {fixed_files} files.")


# ─────────────────────────────────────────────
# TASK 4: Fix .html links in static pages
# ─────────────────────────────────────────────

def fix_html_links():
    """Fix href="*.html" links in Astro pages."""
    pages_dir = SRC / "pages"
    fixed = 0
    for path in pages_dir.rglob("*.astro"):
        text = path.read_text()
        new_text = text
        # href="talk-with-us.html" -> href="/talk-with-us"
        # href="tools/invoice-ocr-api.html" -> href="/tools/invoice-ocr-api"
        # href="index.html#" -> href="/#"
        # General pattern: href="SLUG.html" or href="path/SLUG.html"
        def fix_href(m):
            href_val = m.group(1)
            # Skip external URLs and anchor-only links
            if href_val.startswith(("http://", "https://", "#", "mailto:", "tel:")):
                return m.group(0)
            # Strip .html
            clean = re.sub(r'\.html(#.*)?$', lambda mm: (mm.group(1) or ''), href_val)
            # Ensure leading slash
            if not clean.startswith('/'):
                clean = '/' + clean
            # Handle index.html → /
            if clean == '/index':
                clean = '/'
            return f'href="{clean}"'

        new_text = re.sub(r'href="([^"]*\.html[^"]*)"', fix_href, new_text)
        if new_text != text:
            path.write_text(new_text)
            fixed += 1
    print(f"[Task 4] Fixed .html hrefs in {fixed} pages.")


# ─────────────────────────────────────────────
# TASK 5: Fill empty what's-new descriptions
# ─────────────────────────────────────────────

WHATS_NEW_DESCRIPTIONS = {
    "2022-08-01.md": "FormX.ai launches with AI-powered document extraction, enabling businesses to automate data capture from invoices, receipts, and identity documents with high accuracy.",
    "2022-09-22.md": "Introducing multi-document type support and improved extraction accuracy, allowing users to process a wider variety of document formats through the FormX.ai platform.",
    "2022-11-01.md": "FormX.ai enhances its extraction engine with better handling of multi-page documents and complex table structures, improving accuracy for financial and logistics documents.",
    "2023-05-01.md": "FormX.ai releases the Invoice Extractor with automatic field detection and a new bank statement extraction feature for seamless financial data processing.",
    "2023-06-01.md": "New document workspace features and improved API performance updates, making it easier for development teams to integrate FormX.ai into existing document workflows.",
    "2023-08-01.md": "FormX.ai introduces SmartAdapt technology, enabling the platform to automatically adapt to new document layouts without manual template configuration.",
    "2023-10-01.md": "Platform improvements include faster processing speeds, expanded language support, and new integrations with popular accounting tools like QuickBooks and Xero.",
    "2024-09-20.md": "FormX.ai achieves ISO 27001 and SOC 2 Type 2 compliance, reinforcing enterprise-grade security standards for organizations processing sensitive financial and identity documents.",
    "2025-09-22.md": "FormX.ai expands AI model support and improves extraction accuracy across multilingual documents, with enhanced processing for European invoice formats including ZUGFeRD and Factur-X.",
    "2026-02-10.md": "Introducing bounding box annotations and enhanced visual document review, giving teams more precise control over extracted field locations and validation workflows.",
    "2026-03-27.md": "FormX.ai integrates Azure Document Intelligence and Anthropic Claude support, delivering more flexible AI model options for enterprise document processing pipelines.",
}


def fill_whats_new_descriptions():
    """Write description for all what's-new entries that have empty descriptions."""
    wn_dir = SRC / "content" / "whats-new"
    filled = 0
    for fname, desc in WHATS_NEW_DESCRIPTIONS.items():
        path = wn_dir / fname
        if not path.exists():
            print(f"  SKIP (not found): {fname}")
            continue
        text = path.read_text()
        # Match description: "" or description: ''
        if re.search(r'^description:\s*["\'][\'"]\s*$', text, re.MULTILINE):
            new_text = re.sub(
                r'^(description:\s*)["\'][\'"]\s*$',
                f'\\1"{desc}"',
                text,
                flags=re.MULTILINE,
            )
            if new_text != text:
                path.write_text(new_text)
                filled += 1
                print(f"  Filled: {fname}")
        else:
            # Check if description is already filled
            m = re.search(r'^description:\s*["\'](.+)["\']', text, re.MULTILINE)
            if m and m.group(1).strip():
                print(f"  OK (already has description): {fname}")
            else:
                print(f"  WARN: could not match description pattern in {fname}")
    print(f"[Task 5] Filled descriptions in {filled} what's-new files.")


# ─────────────────────────────────────────────
# TASK 6: Generate _redirects file
# ─────────────────────────────────────────────

def generate_redirects():
    """Create public/_redirects for Netlify/Cloudflare Pages."""
    redirects_path = PUBLIC / "_redirects"
    if redirects_path.exists():
        print("[Task 6] _redirects already exists, skipping.")
        return
    lines = [
        "# HTML extension redirects (Webflow → Astro clean URLs)",
        "/index.html              /               301",
        "/blog.html               /blog           301",
        "/pricing.html            /pricing        301",
        "/why-formx.html          /why-formx      301",
        "/talk-with-us.html       /talk-with-us   301",
        "/schedule-demo.html      /schedule-demo  301",
        "/partner-program.html    /partner-program  301",
        "/referral-program.html   /referral-program 301",
        "/data-privacy-policy.html /data-privacy-policy 301",
        "/terms-of-service.html   /terms-of-service 301",
        "/service-level-agreement.html /service-level-agreement 301",
        "/whats-new.html          /whats-new      301",
        "/products/*.html         /products/:splat  301",
        "/solutions/*.html        /solutions/:splat 301",
        "/tools/*.html            /tools/:splat     301",
        "/documents/*.html        /documents/:splat 301",
        "/blog/*.html             /blog/:splat      301",
        "/whats-new/*.html        /whats-new/:splat 301",
        "/post/:slug              /blog/:slug       301",
    ]
    redirects_path.write_text("\n".join(lines) + "\n")
    print(f"[Task 6] Created {redirects_path}")


# ─────────────────────────────────────────────
# MAIN
# ─────────────────────────────────────────────

def main():
    print("=" * 60)
    print("FormX.ai Webflow → Astro Migration Script")
    print("=" * 60)

    print("\n[Scan] Scanning source files for CDN URLs...")
    url_to_files = scan_files()
    print(f"[Scan] Found {len(url_to_files)} unique CDN URLs across {sum(len(v) for v in url_to_files.values())} references.")

    print("\n[Map] Building URL → local path mapping...")
    url_map = build_url_map(url_to_files)
    print(f"[Map] Mapped {len(url_map)} URLs to local paths.")

    # Show category distribution
    cats = defaultdict(int)
    for url, (dest, _) in url_map.items():
        relative = dest.relative_to(PUBLIC)
        cat = str(relative.parent)
        cats[cat] += 1
    for cat, n in sorted(cats.items()):
        print(f"       {cat}: {n} files")

    print("\n[Task 1+2] Downloading CDN assets...")
    download_all(url_map)
    download_extra_files(url_map)

    print("\n[Task 2] Updating BaseLayout.astro (CSS import, JS, favicons)...")
    update_baselayout(url_map)

    print("\n[Task 1+2] Updating webflow.css font/image references...")
    update_webflow_css(url_map)

    print("\n[Task 1] Replacing CDN URLs in all source files...")
    update_all_sources(url_map)

    print("\n[Task 3] Fixing broken relative links in markdown...")
    fix_broken_links()

    print("\n[Task 4] Fixing .html href links in Astro pages...")
    fix_html_links()

    print("\n[Task 5] Filling empty what's-new descriptions...")
    fill_whats_new_descriptions()

    print("\n[Task 6] Generating _redirects file...")
    generate_redirects()

    print("\n" + "=" * 60)
    print("Migration complete!")
    print("Next step: run 'npm run build' to verify the build passes.")
    print("Then: grep -r 'cdn.prod.website-files.com' src/ to confirm zero CDN refs.")
    print("=" * 60)


if __name__ == "__main__":
    main()
