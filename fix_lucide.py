#!/usr/bin/env python3
"""
Fix Lucide icon initialization across all ERP HTML pages.
Adds a guaranteed lucide.createIcons() call just before </body>
for any page that doesn't already have one within the last 25 lines.
"""
import os
import re

HTML_FILES = [
    "admin.html",
    "assets.html",
    "banking.html",
    "create-invoice.html",
    "delivery-challans.html",
    "design-book.html",
    "expenses.html",
    "index.html",
    "inventory.html",
    "jobwork.html",
    "journal-entry.html",
    "melting.html",
    "payment-made.html",
    "purchases.html",
    "reports.html",
    "sales-orders.html",
    "staff.html",
    "stock-adjustment.html",
    "supplier-kyc.html",
    "tree-making.html",
    "vendor-kyc.html",
    "worker-data-sheet.html",
]

LUCIDE_INJECT = '''    <!-- Lucide icons: guaranteed init after full DOM parse -->
    <script src="https://unpkg.com/lucide@latest"></script>
    <script>
        if (window.lucide) lucide.createIcons();
    </script>
'''

BASE = "/Users/vignesh/Desktop/erp"

fixed = []
already_ok = []
no_lucide = []

for fname in HTML_FILES:
    fpath = os.path.join(BASE, fname)
    if not os.path.exists(fpath):
        print(f"  SKIP (not found): {fname}")
        continue

    with open(fpath, "r", encoding="utf-8") as f:
        content = f.read()

    # Find position of </body>
    body_close_idx = content.lower().rfind("</body>")
    if body_close_idx == -1:
        print(f"  SKIP (no </body>): {fname}")
        continue

    # Check if Lucide is used at all
    if "lucide" not in content.lower():
        no_lucide.append(fname)
        print(f"  SKIP (no lucide): {fname}")
        continue

    # Get the last 30 lines before </body>
    tail = content[:body_close_idx]
    tail_lines = tail.split("\n")
    last_30 = "\n".join(tail_lines[-30:])

    # Check if there's already a guaranteed bare createIcons() near the bottom
    # (not inside a function, but inside a bare <script> block)
    # Strategy: check if the last 30 lines contain lucide.createIcons()
    has_create_icons_at_bottom = bool(re.search(r"lucide\.createIcons\(\)", last_30))
    
    # Also check if there's a second lucide script load at bottom (purchases.html pattern)
    has_lucide_load_at_bottom = bool(re.search(r'<script[^>]*unpkg\.com/lucide', last_30))

    if has_create_icons_at_bottom or has_lucide_load_at_bottom:
        already_ok.append(fname)
        print(f"  OK (already has init): {fname}")
        continue

    # Need to inject before </body>
    new_content = content[:body_close_idx] + LUCIDE_INJECT + content[body_close_idx:]
    with open(fpath, "w", encoding="utf-8") as f:
        f.write(new_content)
    fixed.append(fname)
    print(f"  FIXED: {fname}")

print(f"\n{'='*50}")
print(f"Fixed ({len(fixed)}): {fixed}")
print(f"Already OK ({len(already_ok)}): {already_ok}")
print(f"No Lucide ({len(no_lucide)}): {no_lucide}")
